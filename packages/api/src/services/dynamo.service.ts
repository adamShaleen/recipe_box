import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { ListRecipesQuery, Recipe, RecipeMetadata } from '@recipe-box/shared';

// Instantiated once at module scope so the client is reused across warm Lambda invocations.
const dynamoClient = new DynamoDBClient();

export const listRecipes = async (query: ListRecipesQuery): Promise<RecipeMetadata[]> => {
  // Strip undefined query params so they don't produce empty filter fragments.
  const expressions = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => {
      return {
        key,
        value
      };
    });

  const input: ScanCommandInput = {
    TableName: process.env['TABLE_NAME'],
    // SK = :sk ensures only METADATA rows are returned. Query filters are appended if present.
    FilterExpression: expressions.length
      ? `SK = :sk AND ` + expressions.map(({ key }) => `${key} = :${key}`).join(' AND ')
      : 'SK = :sk',
    ExpressionAttributeValues: {
      ':sk': { S: 'METADATA' },
      // Spread query filter values using the field name as the placeholder key.
      ...expressions.reduce((a, { key, value }) => ({ ...a, [`:${key}`]: { S: value } }), {})
    }
  };

  const { Items: recipes }: ScanCommandOutput = await dynamoClient.send(new ScanCommand(input));
  // unmarshall converts DynamoDB's wire format ({ S: "value" }) to plain JS objects.
  return recipes?.length
    ? recipes.map((recipe) => {
        const { PK, SK: _sk, tags, ...rest } = unmarshall(recipe);
        return {
          ...rest,
          id: (PK as string).replace('RECIPE#', ''),
          tags: Array.isArray(tags) ? tags : []
        } as RecipeMetadata;
      })
    : [];
};

export const getRecipe = async (id: string): Promise<Recipe | null> => {
  // Query on PK alone returns all row types (METADATA, INGREDIENTS, STEPS, EMBEDDING) in one request.
  const input: QueryCommandInput = {
    TableName: process.env['TABLE_NAME'],
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': { S: `RECIPE#${id}` } }
  };

  const { Items }: QueryCommandOutput = await dynamoClient.send(new QueryCommand(input));
  const rows = Items?.map((item) => unmarshall(item));
  const metadata = rows?.find((r) => r['SK'] === 'METADATA');
  // A missing METADATA row means the recipe doesn't exist.
  if (!metadata) return null;

  // Assemble the recipe from its separate rows. ingredients and steps are stored as JSON strings.
  // EMBEDDING is intentionally excluded — only needed by the RAG service.
  const { PK, SK: _sortKey, tags, ...fieldsWeCareAbout } = metadata;

  return {
    ...fieldsWeCareAbout,
    id: (PK as string).replace('RECIPE#', ''),
    tags: Array.isArray(tags) ? tags : [],
    ingredients: JSON.parse(rows?.find((r) => r['SK'] === 'INGREDIENTS')?.ingredients ?? '[]'),
    steps: JSON.parse(rows?.find((r) => r['SK'] === 'STEPS')?.steps ?? '[]')
  } as Recipe;
};
