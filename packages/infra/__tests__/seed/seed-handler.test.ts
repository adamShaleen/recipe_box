import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import {
  DynamoDBClient,
  TransactionCanceledException,
  TransactWriteItemsCommand
} from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CloudFormationCustomResourceCreateEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import * as fs from 'fs';
import * as sut from '../../lib/seed/seed-handler';
jest.mock('fs');
jest.mock('faiss-node', () => ({
  IndexFlatL2: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    toBuffer: jest.fn().mockReturnValue(Buffer.from('mock-index'))
  }))
}));

describe('seed-handler', () => {
  const bedrockMock = mockClient(BedrockRuntimeClient);
  const dynamoMock = mockClient(DynamoDBClient);
  const s3Mock = mockClient(S3Client);
  const generateEmbeddingForRecipeMock = jest.spyOn(sut, 'generateEmbeddingForRecipe');
  const putEmbeddingsIntoDynamoMock = jest.spyOn(sut, 'putEmbeddingsIntoDynamo');

  const embedding = new Array(1526).fill(0.1);

  const recipe = {
    name: 'mock name',
    description: 'mock description',
    cuisine: 'mock cuisine',
    protein: 'mock protein',
    tags: ['foo'],
    ingredients: [{ name: 'mock ingredient 1' }, { name: 'mock ingredient 2' }]
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([recipe]));
  });

  describe('handler', () => {
    const event = {
      StackId: 'mock-stack-id',
      RequestId: 'mock-request-id',
      LogicalResourceId: 'mock-logical-resource-id',
      RequestType: 'Create',
      ResponseURL: 'https://mock-response-url',
      ResourceType: 'Custom::Seed',
      ServiceToken: 'mock-service-token',
      ResourceProperties: { ServiceToken: 'mock-service-token' }
    } as CloudFormationCustomResourceCreateEvent;

    describe('Happy Path', () => {
      let result: any;

      beforeEach(async () => {
        generateEmbeddingForRecipeMock.mockResolvedValue([]);
        s3Mock.on(PutObjectCommand).resolves(undefined as any);
        putEmbeddingsIntoDynamoMock.mockResolvedValue(undefined);
        result = await sut.handler(event);
      });

      it('creates a titan embedding for each recipe', () => {
        expect(generateEmbeddingForRecipeMock).toHaveBeenCalledTimes(1);
        expect(generateEmbeddingForRecipeMock).toHaveBeenCalledWith({
          cuisine: 'mock cuisine',
          description: 'mock description',
          ingredients: [{ name: 'mock ingredient 1' }, { name: 'mock ingredient 2' }],
          name: 'mock name',
          protein: 'mock protein',
          tags: ['foo']
        });
      });

      it('adds the vectors to the S3 FAISS bucket', () => {
        expect(s3Mock.commandCalls(PutObjectCommand)[0]!.args[0].input).toMatchObject({
          Key: 'faiss.index',
          ContentType: 'application/octet-stream'
        });
      });

      it('inserts the records into dynamo', () => {
        expect(putEmbeddingsIntoDynamoMock).toHaveBeenCalledTimes(1);
        expect(putEmbeddingsIntoDynamoMock).toHaveBeenCalledWith({
          embedding: [],
          recipe: {
            cuisine: 'mock cuisine',
            description: 'mock description',
            ingredients: [{ name: 'mock ingredient 1' }, { name: 'mock ingredient 2' }],
            name: 'mock name',
            protein: 'mock protein',
            tags: ['foo']
          }
        });
      });

      it('returns the success response', () => {
        expect(result).toEqual({
          LogicalResourceId: 'mock-logical-resource-id',
          PhysicalResourceId: 'mock-logical-resource-id',
          RequestId: 'mock-request-id',
          StackId: 'mock-stack-id',
          Status: 'SUCCESS'
        });
      });
    });

    describe('Sad Path', () => {
      it('when an operation fails returns the error response', async () => {
        generateEmbeddingForRecipeMock.mockRejectedValue('oh noes!');
        s3Mock.on(PutObjectCommand).resolves(undefined as any);
        putEmbeddingsIntoDynamoMock.mockResolvedValue(undefined);

        expect(await sut.handler(event)).toEqual({
          LogicalResourceId: 'mock-logical-resource-id',
          PhysicalResourceId: 'mock-logical-resource-id',
          Reason: '{"error":"INTERNAL_ERROR","message":"oh noes!"}',
          RequestId: 'mock-request-id',
          StackId: 'mock-stack-id',
          Status: 'FAILED'
        });
      });
    });

    afterAll(() => {
      generateEmbeddingForRecipeMock.mockRestore();
      putEmbeddingsIntoDynamoMock.mockRestore();
    });
  });

  describe('generateEmbeddingForRecipe', () => {
    let result: any;

    beforeEach(async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: Buffer.from(JSON.stringify({ embedding }))
      } as any);

      result = await sut.generateEmbeddingForRecipe(recipe);
    });

    it('invokes the model', () => {
      expect(bedrockMock.calls()).toHaveLength(1);

      expect(bedrockMock.commandCalls(InvokeModelCommand)[0]!.args[0].input).toMatchObject({
        modelId: 'amazon.titan-embed-text-v1'
      });
    });

    it('returns the embedding', () => {
      expect(result).toEqual(embedding);
    });
  });

  describe('putEmbeddingsIntoDynamo', () => {
    describe('Happy Path', () => {
      it('invokes transact write', async () => {
        dynamoMock.on(TransactWriteItemsCommand).resolves(undefined as any);
        await sut.putEmbeddingsIntoDynamo({ recipe, embedding });

        expect(dynamoMock.calls()).toHaveLength(1);
        expect(dynamoMock.commandCalls(TransactWriteItemsCommand)[0]!.args[0].input).toMatchObject({
          TransactItems: expect.arrayContaining([
            expect.objectContaining({
              Put: expect.objectContaining({
                Item: expect.objectContaining({ SK: { S: 'METADATA' } })
              })
            }),
            expect.objectContaining({
              Put: expect.objectContaining({
                Item: expect.objectContaining({ SK: { S: 'INGREDIENTS' } })
              })
            }),
            expect.objectContaining({
              Put: expect.objectContaining({
                Item: expect.objectContaining({ SK: { S: 'STEPS' } })
              })
            }),
            expect.objectContaining({
              Put: expect.objectContaining({
                Item: expect.objectContaining({ SK: { S: 'EMBEDDING' } })
              })
            })
          ])
        });
      });
    });

    describe('Sad Path', () => {
      it('swallows TransactionCanceledException', async () => {
        dynamoMock
          .on(TransactWriteItemsCommand)
          .rejects(new TransactionCanceledException({ message: 'Already seeded', $metadata: {} }));

        await expect(sut.putEmbeddingsIntoDynamo({ recipe, embedding })).resolves.toBeUndefined();
      });

      it('throws a non expected error', async () => {
        dynamoMock.on(TransactWriteItemsCommand).rejects(new Error('unknown error!'));
        await expect(sut.putEmbeddingsIntoDynamo({ recipe, embedding })).rejects.toThrow(
          'unknown error!'
        );
      });
    });
  });
});
