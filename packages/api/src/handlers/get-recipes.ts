import { ListRecipesQuery } from '@recipe-box/shared';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { listRecipes } from '../services/dynamo.service';
import { internalError, ok } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { cuisine, protein, tag } = event.queryStringParameters ?? {};
  const request: ListRecipesQuery = { cuisine, protein, tag };

  try {
    const recipes = await listRecipes(request);
    return ok(recipes);
  } catch (e) {
    return internalError(e instanceof Error ? e.message : String(e));
  }
};
