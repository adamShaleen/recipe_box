import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { Recipe } from '@recipe-box/shared';
import { IndexFlatL2 } from 'faiss-node';
import { getEnvVar } from '../utils/env';
import { getRecipe } from './dynamo.service';

// Cache both at module scope for warm invocations
let cachedVectorIndex: IndexFlatL2 | null = null;
let cachedRecipeIds: string[] | null = null;

// Resets the module-scope cache — used in tests to simulate cold start between test cases
export const _resetForTesting = (): void => {
  cachedVectorIndex = null;
  cachedRecipeIds = null;
};

const dynamoClient = new DynamoDBClient();

export const retrieveContext = async (embedding: number[], topK: number): Promise<Recipe[]> => {
  if (!cachedVectorIndex || !cachedRecipeIds) {
    // On cold start, scan DynamoDB for all SK = EMBEDDING rows to get recipe IDs and their embedding vectors
    const { Items } = await dynamoClient.send(
      new ScanCommand({
        TableName: getEnvVar('TABLE_NAME'),
        FilterExpression: 'SK = :sk',
        ExpressionAttributeValues: { ':sk': { S: 'EMBEDDING' } }
      })
    );

    // Build a FAISS index in memory from those vectors, keeping a parallel recipeIds[] array in the same order
    const vectorIndex = new IndexFlatL2(1536);
    const recipeIds: string[] = [];

    Items?.forEach((item) => {
      const { PK, embeddingVector } = unmarshall(item);
      recipeIds.push(PK.slice('RECIPE#'.length));
      const buf = Buffer.from(embeddingVector, 'base64');
      vectorIndex.add(Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)));
    });

    cachedVectorIndex = vectorIndex;
    cachedRecipeIds = recipeIds;
  }

  const { labels } = cachedVectorIndex.search(Array.from(embedding), topK);

  const labelToRecipeIds = labels
    .filter((label) => label !== -1)
    .map((label) => cachedRecipeIds![label]!);

  const recipes = await Promise.all(labelToRecipeIds.map((id) => getRecipe(id)));
  return recipes.filter((r): r is Recipe => r !== null);
};
