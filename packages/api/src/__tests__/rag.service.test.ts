import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import type { Recipe } from '@recipe-box/shared';
import { mockClient } from 'aws-sdk-client-mock';
import { IndexFlatL2 } from 'faiss-node';
import * as sut from '../services/rag.service';

// Factories must not reference outer const/let variables — ts-jest does not apply
// the babel-jest "mock*" hoisting exception. Mock implementations are set in beforeEach.
jest.mock('faiss-node', () => ({
  IndexFlatL2: jest.fn()
}));

jest.mock('../services/dynamo.service', () => ({
  getRecipe: jest.fn()
}));

const makeEmbeddingVector = (): string => {
  const floats = new Float32Array(1536).fill(0.1);
  return Buffer.from(floats.buffer).toString('base64');
};

const mockRecipe: Recipe = {
  id: 'recipe-1',
  name: 'mock-name',
  description: 'mock-description',
  cuisine: 'mock-cuisine',
  protein: 'mock-protein',
  tags: ['mock-tag'],
  servings: 2,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  ingredients: [],
  steps: []
};

const embeddingItems = [
  {
    PK: { S: 'RECIPE#recipe-1' },
    SK: { S: 'EMBEDDING' },
    embeddingVector: { S: makeEmbeddingVector() }
  },
  {
    PK: { S: 'RECIPE#recipe-2' },
    SK: { S: 'EMBEDDING' },
    embeddingVector: { S: makeEmbeddingVector() }
  }
];

const queryEmbedding = new Array(1536).fill(0.5);

describe('rag service', () => {
  const dynamoMock = mockClient(DynamoDBClient);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const getRecipe = require('../services/dynamo.service').getRecipe as jest.Mock;

  let mockAdd: jest.Mock;
  let mockSearch: jest.Mock;

  beforeAll(() => {
    process.env['TABLE_NAME'] = 'mock-table';
  });

  beforeEach(() => {
    sut._resetForTesting();
    dynamoMock.reset();

    mockAdd = jest.fn();
    mockSearch = jest.fn();
    (IndexFlatL2 as unknown as jest.Mock).mockImplementation(() => ({ add: mockAdd, search: mockSearch }));

    getRecipe.mockReset();
    getRecipe.mockResolvedValue(mockRecipe);
  });

  describe('cold start', () => {
    beforeEach(() => {
      dynamoMock.on(ScanCommand).resolves({ Items: embeddingItems });
      mockSearch.mockReturnValue({ labels: [0, 1] });
    });

    it('scans DynamoDB for EMBEDDING rows', async () => {
      await sut.retrieveContext(queryEmbedding, 2);

      expect(dynamoMock.calls()).toHaveLength(1);
      expect(dynamoMock.commandCalls(ScanCommand)[0]!.args[0].input).toStrictEqual({
        TableName: 'mock-table',
        FilterExpression: 'SK = :sk',
        ExpressionAttributeValues: { ':sk': { S: 'EMBEDDING' } }
      });
    });

    it('adds each embedding to the FAISS index', async () => {
      await sut.retrieveContext(queryEmbedding, 2);

      expect(mockAdd).toHaveBeenCalledTimes(2);
    });

    it('searches the index with the query embedding and topK', async () => {
      await sut.retrieveContext(queryEmbedding, 2);

      expect(mockSearch).toHaveBeenCalledWith(queryEmbedding, 2);
    });

    it('fetches each recipe returned by FAISS', async () => {
      await sut.retrieveContext(queryEmbedding, 2);

      expect(getRecipe).toHaveBeenCalledTimes(2);
      expect(getRecipe).toHaveBeenCalledWith('recipe-1');
      expect(getRecipe).toHaveBeenCalledWith('recipe-2');
    });

    it('returns the fetched recipes', async () => {
      const result = await sut.retrieveContext(queryEmbedding, 2);

      expect(result).toEqual([mockRecipe, mockRecipe]);
    });
  });

  describe('warm start', () => {
    beforeEach(async () => {
      dynamoMock.on(ScanCommand).resolves({ Items: embeddingItems });
      mockSearch.mockReturnValue({ labels: [0] });
      // Populate the cache
      await sut.retrieveContext(queryEmbedding, 1);
      dynamoMock.reset();
      mockAdd.mockReset();
    });

    it('does not scan DynamoDB on subsequent calls', async () => {
      await sut.retrieveContext(queryEmbedding, 1);

      expect(dynamoMock.calls()).toHaveLength(0);
    });

    it('does not rebuild the FAISS index on subsequent calls', async () => {
      await sut.retrieveContext(queryEmbedding, 1);

      expect(mockAdd).not.toHaveBeenCalled();
    });

    it('still returns recipes from the cached index', async () => {
      const result = await sut.retrieveContext(queryEmbedding, 1);

      expect(result).toEqual([mockRecipe]);
    });
  });

  describe('FAISS returns -1 labels', () => {
    beforeEach(() => {
      dynamoMock.on(ScanCommand).resolves({ Items: embeddingItems });
    });

    it('filters out -1 labels and does not call getRecipe for them', async () => {
      mockSearch.mockReturnValue({ labels: [0, -1] });

      await sut.retrieveContext(queryEmbedding, 2);

      expect(getRecipe).toHaveBeenCalledTimes(1);
      expect(getRecipe).toHaveBeenCalledWith('recipe-1');
    });

    it('returns empty array when all labels are -1', async () => {
      mockSearch.mockReturnValue({ labels: [-1, -1] });

      const result = await sut.retrieveContext(queryEmbedding, 2);

      expect(result).toEqual([]);
    });
  });

  describe('getRecipe returns null', () => {
    it('filters null recipes from results', async () => {
      dynamoMock.on(ScanCommand).resolves({ Items: embeddingItems });
      mockSearch.mockReturnValue({ labels: [0, 1] });
      getRecipe.mockResolvedValueOnce(mockRecipe).mockResolvedValueOnce(null);

      const result = await sut.retrieveContext(queryEmbedding, 2);

      expect(result).toEqual([mockRecipe]);
    });
  });

  describe('no EMBEDDING items in DynamoDB', () => {
    beforeEach(() => {
      dynamoMock.on(ScanCommand).resolves({ Items: [] });
      mockSearch.mockReturnValue({ labels: [] });
    });

    it('returns empty array', async () => {
      const result = await sut.retrieveContext(queryEmbedding, 2);

      expect(result).toEqual([]);
    });

    it('does not call getRecipe', async () => {
      await sut.retrieveContext(queryEmbedding, 2);

      expect(getRecipe).not.toHaveBeenCalled();
    });
  });
});
