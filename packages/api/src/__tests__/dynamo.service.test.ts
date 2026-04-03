import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ListRecipesQuery } from '@recipe-box/shared';
import { mockClient } from 'aws-sdk-client-mock';
import * as sut from '../services/dynamo.service';

describe('dynamo service', () => {
  const dynamoMock = mockClient(DynamoDBClient);

  const query: ListRecipesQuery = {
    cuisine: 'mock-cuisine',
    protein: 'mock-protein'
  };

  beforeAll(() => {
    process.env.TABLE_NAME = 'mock-table-name';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    dynamoMock.reset();
  });

  describe('listRecipes', () => {
    describe('recipes found', () => {
      let result: any;

      beforeEach(async () => {
        dynamoMock.on(ScanCommand).resolves({ Items: [{ foo: { S: 'jazz' } }] });
        result = await sut.listRecipes(query);
      });

      it('scans', () => {
        expect(dynamoMock.calls()).toHaveLength(1);
        expect(dynamoMock.commandCalls(ScanCommand)[0]!.args[0].input).toStrictEqual({
          ExpressionAttributeValues: {
            ':cuisine': { S: 'mock-cuisine' },
            ':protein': { S: 'mock-protein' },
            ':sk': { S: 'METADATA' }
          },
          FilterExpression: 'SK = :sk AND cuisine = :cuisine AND protein = :protein',
          TableName: 'mock-table-name'
        });
      });

      it('returns the recipes', () => {
        expect(result).toEqual([{ foo: 'jazz' }]);
      });
    });

    describe('no recipes found', () => {
      let result: any;

      beforeEach(async () => {
        dynamoMock.on(ScanCommand).resolves({ Items: [] });
        result = await sut.listRecipes({});
      });

      it('scans', () => {
        expect(dynamoMock.calls()).toHaveLength(1);
        expect(dynamoMock.commandCalls(ScanCommand)[0]!.args[0].input).toStrictEqual({
          ExpressionAttributeValues: { ':sk': { S: 'METADATA' } },
          FilterExpression: 'SK = :sk',
          TableName: 'mock-table-name'
        });
      });

      it('returns empty', () => {
        expect(result).toEqual([]);
      });
    });
  });

  describe('getRecipe', () => {
    describe('records exist', () => {
      let result: any;

      const Items = [
        {
          PK: { S: 'RECIPE#mock-id' },
          SK: { S: 'METADATA' },
          id: { S: 'mock-id' },
          name: { S: 'mock-name' },
          description: { S: 'mock-description' },
          cuisine: { S: 'mock-cuisine' },
          protein: { S: 'mock-protein' },
          tags: { SS: ['mock-tag'] },
          servings: { N: '2' },
          prepTimeMinutes: { N: '10' },
          cookTimeMinutes: { N: '20' }
        },
        {
          PK: { S: 'RECIPE#mock-id' },
          SK: { S: 'INGREDIENTS' },
          ingredients: {
            S: JSON.stringify([
              { id: 'ing-1', name: 'mock-ingredient', amount: 1, unit: 'cup', category: 'pantry' }
            ])
          }
        },
        {
          PK: { S: 'RECIPE#mock-id' },
          SK: { S: 'STEPS' },
          steps: { S: JSON.stringify([{ order: 1, instruction: 'mock-step', durationMinutes: 5 }]) }
        }
      ];

      beforeEach(async () => {
        dynamoMock.on(QueryCommand).resolves({ Items } as any);
        result = await sut.getRecipe('mock-id');
      });

      it('queries', () => {
        expect(dynamoMock.calls()).toHaveLength(1);
        expect(dynamoMock.commandCalls(QueryCommand)[0]!.args[0].input).toStrictEqual({
          ExpressionAttributeValues: { ':pk': { S: 'RECIPE#mock-id' } },
          KeyConditionExpression: 'PK = :pk',
          TableName: 'mock-table-name'
        });
      });

      it('returns Recipe', () => {
        expect(result).toEqual({
          cookTimeMinutes: 20,
          cuisine: 'mock-cuisine',
          description: 'mock-description',
          id: 'mock-id',
          ingredients: [
            { amount: 1, category: 'pantry', id: 'ing-1', name: 'mock-ingredient', unit: 'cup' }
          ],
          name: 'mock-name',
          prepTimeMinutes: 10,
          protein: 'mock-protein',
          servings: 2,
          steps: [{ durationMinutes: 5, instruction: 'mock-step', order: 1 }],
          tags: new Set(['mock-tag'])
        });
      });
    });

    describe('no records', () => {
      it('returns null', async () => {
        dynamoMock.on(QueryCommand).resolves({ Items: [] } as any);
        expect(await sut.getRecipe('mock-id')).toBeNull();
      });
    });
  });
});
