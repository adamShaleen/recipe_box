import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import {
  DynamoDBClient,
  TransactionCanceledException,
  TransactWriteItemsCommand
} from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Recipe } from '@recipe-box/shared';
import type {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceResponse
} from 'aws-lambda';
import { IndexFlatL2 } from 'faiss-node';
import * as fs from 'fs';
import * as path from 'path';

const bedrockClient = new BedrockRuntimeClient();
const dynamoClient = new DynamoDBClient();
const s3Client = new S3Client();

/**
 * Runs once at deploy time via a CloudFormation custom resource.
 * Reads recipes from the bundled recipes.json, generates a vector embedding for each recipe using
 * Amazon Titan, writes each recipe to DynamoDB (metadata, ingredients, steps, and embedding as
 * separate items), builds a FAISS index from all embeddings, and uploads it to S3.
 * Skips recipes that have already been seeded. Fails the deployment if any unexpected error occurs.
 */
export const handler = async (
  event: CloudFormationCustomResourceEvent
): Promise<CloudFormationCustomResourceResponse> => {
  const { StackId, RequestId, LogicalResourceId } = event;
  const CHUNK_SIZE = 5;

  try {
    const recipes: Recipe[] = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'recipes.json'), 'utf-8')
    );

    const titanEmbeddings: { recipe: Recipe; embedding: number[] }[] = [];

    for (let i = 0; i < recipes.length; i += CHUNK_SIZE) {
      const chunk = recipes.slice(i, i + CHUNK_SIZE);

      const results = await Promise.all(
        chunk.map(async (recipe) => ({
          recipe,
          embedding: await generateEmbeddingForRecipe(recipe)
        }))
      );

      titanEmbeddings.push(...results);
    }

    const vectors: number[][] = titanEmbeddings.map((r) => r.embedding);
    if (!vectors.length) throw new Error('No recipes found to index');

    const TITAN_EMBEDDING_DIMENSION = 1536;
    const index = new IndexFlatL2(TITAN_EMBEDDING_DIMENSION);
    vectors.forEach((vector) => index.add(vector));

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env['FAISS_BUCKET'],
        Key: 'faiss.index',
        Body: index.toBuffer(),
        ContentType: 'application/octet-stream'
      })
    );

    await Promise.all(
      titanEmbeddings.map((recipeEmbedding) => putEmbeddingsIntoDynamo(recipeEmbedding))
    );

    return {
      Status: 'SUCCESS',
      LogicalResourceId,
      PhysicalResourceId: LogicalResourceId,
      StackId,
      RequestId
    };
  } catch (e) {
    console.error('There was an error with the seed-handler', { e });

    return {
      Status: 'FAILED',
      LogicalResourceId,
      PhysicalResourceId: LogicalResourceId,
      StackId,
      RequestId,
      Reason: JSON.stringify({ error: 'INTERNAL_ERROR', message: e })
    };
  }
};

export const generateEmbeddingForRecipe = async (recipe: Recipe): Promise<number[]> => {
  const { name, description, cuisine, protein, tags, ingredients } = recipe;

  const inputText = `${name} ${description} ${cuisine} ${protein} ${tags.join(' ')} ${ingredients.map((i) => i.name).join(' ')}`;

  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({ inputText })
    })
  );

  const { embedding } = JSON.parse(Buffer.from(response.body).toString());
  return embedding;
};

export const putEmbeddingsIntoDynamo = async (recipeEmbedding: {
  recipe: Recipe;
  embedding: number[];
}): Promise<void> => {
  const { recipe } = recipeEmbedding;
  const TableName = process.env['TABLE_NAME'];
  const PK = { S: `RECIPE#${recipe.id}` };
  const ConditionExpression = 'attribute_not_exists(PK)';

  try {
    await dynamoClient.send(
      new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName,
              ConditionExpression,
              Item: {
                PK,
                SK: { S: 'METADATA' },
                name: { S: recipe.name },
                description: { S: recipe.description },
                cuisine: { S: recipe.cuisine },
                protein: { S: recipe.protein },
                tags: { SS: recipe.tags },
                servings: { N: String(recipe.servings) },
                prepTime: { N: String(recipe.prepTimeMinutes) },
                cookTime: { N: String(recipe.cookTimeMinutes) }
              }
            }
          },
          {
            Put: {
              TableName,
              ConditionExpression,
              Item: {
                PK,
                SK: { S: 'INGREDIENTS' },
                ingredients: { S: JSON.stringify(recipe.ingredients) }
              }
            }
          },
          {
            Put: {
              TableName,
              ConditionExpression,
              Item: {
                PK,
                SK: { S: 'STEPS' },
                steps: { S: JSON.stringify(recipe.steps) }
              }
            }
          },
          {
            Put: {
              TableName,
              ConditionExpression,
              Item: {
                PK,
                SK: { S: 'EMBEDDING' },
                embeddingVector: {
                  S: Buffer.from(new Float32Array(recipeEmbedding.embedding).buffer).toString(
                    'base64'
                  )
                }
              }
            }
          }
        ]
      })
    );
  } catch (e) {
    if (e instanceof TransactionCanceledException) return;
    throw e;
  }
};
