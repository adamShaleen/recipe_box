import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getRecipe } from '../services/dynamo.service';
import { internalError, notFound, ok } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters!['id']!;

  try {
    const recipe = await getRecipe(id);
    if (!recipe) return notFound(`No recipe found with id ${id}`);
    return ok({ recipe });
  } catch (e) {
    return internalError(e instanceof Error ? e.message : String(e));
  }
};
