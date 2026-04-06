import { ModificationRequest } from '@recipe-box/shared';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { generateEmbedding, invokeHaiku } from '../services/bedrock.service';
import { getRecipe } from '../services/dynamo.service';
import { buildModificationPrompt } from '../services/prompt.service';
import { retrieveContext } from '../services/rag.service';
import { badRequest, internalError, notFound, ok } from '../utils/response';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters!['id']!;

  if (!event.body) return badRequest('Missing request body');

  let modificationRequest: ModificationRequest;
  try {
    modificationRequest = JSON.parse(event.body) as ModificationRequest;
  } catch {
    return badRequest('Invalid JSON in request body');
  }

  try {
    const recipe = await getRecipe(id);
    if (!recipe) return notFound(`No recipe found with id ${id}`);

    const modificationIntent = [
      ...modificationRequest.modifications.dietaryFilters,
      ...modificationRequest.modifications.ingredientSwaps.map(
        ({ from, to }) => `swap ${from} for ${to}`
      ),
      ...modificationRequest.modifications.ingredientRemovals.map((i) => `remove ${i}`),
      modificationRequest.modifications.cuisineShift ?? ''
    ]
      .filter(Boolean)
      .join(', ');

    const embedding = await generateEmbedding(modificationIntent);
    const context = await retrieveContext(embedding, 3);
    const prompt = buildModificationPrompt(recipe, context, modificationRequest);

    const modifiedRecipe = await invokeHaiku(prompt);
    return ok(modifiedRecipe);
  } catch (e) {
    return internalError(e instanceof Error ? e.message : String(e));
  }
};
