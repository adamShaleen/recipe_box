import { APIGatewayProxyEvent } from 'aws-lambda';
import * as sut from '../handlers/modify-recipe';
import * as bedrockService from '../services/bedrock.service';
import * as dynamoService from '../services/dynamo.service';
import * as promptService from '../services/prompt.service';
import * as ragService from '../services/rag.service';
import * as Utils from '../utils/response';

describe('modify-recipe', () => {
  const badRequestSpy = jest.spyOn(Utils, 'badRequest');
  const notFoundSpy = jest.spyOn(Utils, 'notFound');
  const okSpy = jest.spyOn(Utils, 'ok');
  const internalErrorSpy = jest.spyOn(Utils, 'internalError');
  const getRecipeSpy = jest.spyOn(dynamoService, 'getRecipe');
  const generateEmbeddingSpy = jest.spyOn(bedrockService, 'generateEmbedding');
  const invokeHaikuSpy = jest.spyOn(bedrockService, 'invokeHaiku');
  const buildModificationPromptSpy = jest.spyOn(promptService, 'buildModificationPrompt');
  const retrieveContextSpy = jest.spyOn(ragService, 'retrieveContext');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sad Paths', () => {
    it('no request body', async () => {
      await sut.handler({ pathParameters: { id: 'mock-id' } } as unknown as APIGatewayProxyEvent);
      expect(badRequestSpy).toHaveBeenCalledTimes(1);
      expect(badRequestSpy).toHaveBeenCalledWith('Missing request body');
    });

    it('invalid request', async () => {
      await sut.handler({
        pathParameters: { id: 'mock-id' },
        body: 'foo'
      } as unknown as APIGatewayProxyEvent);

      expect(badRequestSpy).toHaveBeenCalledTimes(1);
      expect(badRequestSpy).toHaveBeenCalledWith('Invalid JSON in request body');
    });

    it('recipe not found', async () => {
      getRecipeSpy.mockResolvedValue(null);

      await sut.handler({
        pathParameters: { id: 'mock-id' },
        body: JSON.stringify('foo')
      } as unknown as APIGatewayProxyEvent);

      expect(notFoundSpy).toHaveBeenCalledTimes(1);
      expect(notFoundSpy).toHaveBeenCalledWith('No recipe found with id mock-id');
    });

    it('process fails', async () => {
      getRecipeSpy.mockRejectedValue(Error('oh noes!'));

      await sut.handler({
        pathParameters: { id: 'mock-id' },
        body: JSON.stringify('foo')
      } as unknown as APIGatewayProxyEvent);

      expect(internalErrorSpy).toHaveBeenCalledTimes(1);
      expect(internalErrorSpy).toHaveBeenCalledWith('oh noes!');
    });
  });

  describe('Happy Path', () => {
    beforeEach(async () => {
      getRecipeSpy.mockResolvedValue({
        id: 'mock-id',
        name: 'mock-name',
        description: 'mock-description',
        cuisine: 'american',
        protein: 'chicken',
        tags: ['mock-tag'],
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 45,
        ingredients: [
          {
            id: 'mock-ingredient-1',
            name: 'mock-ingredient',
            amount: 2,
            unit: 'cup',
            category: 'pantry'
          }
        ],
        steps: [
          { order: 1, instruction: 'mock-instruction', durationMinutes: 10 },
          { order: 2, instruction: 'mock-instruction', durationMinutes: 25 },
          { order: 3, instruction: 'mock-instruction', durationMinutes: 15 }
        ]
      });

      generateEmbeddingSpy.mockResolvedValue('mock-embedding' as any);
      retrieveContextSpy.mockResolvedValue('mock-context' as any);
      buildModificationPromptSpy.mockReturnValue('mock prompt');
      invokeHaikuSpy.mockResolvedValue('modified recipe' as any);

      await sut.handler({
        pathParameters: { id: 'mock-id' },
        body: JSON.stringify({
          baseRecipeId: 'mock-id',
          modifications: {
            dietaryFilters: ['keto'],
            ingredientSwaps: [{ from: 'ingredient-1', to: 'ingredient-2' }],
            ingredientRemovals: ['ingredient-1'],
            servingScale: 8,
            cuisineShift: 'mexican'
          }
        })
      } as unknown as APIGatewayProxyEvent);
    });

    it('fetches the recipe', () => {
      expect(getRecipeSpy).toHaveBeenCalledTimes(1);
      expect(getRecipeSpy).toHaveBeenCalledWith('mock-id');
    });

    it('generates the embedding', () => {
      expect(generateEmbeddingSpy).toHaveBeenCalledTimes(1);
      expect(generateEmbeddingSpy).toHaveBeenCalledWith(
        'keto, swap ingredient-1 for ingredient-2, remove ingredient-1, mexican'
      );
    });

    it('fetches the context', () => {
      expect(retrieveContextSpy).toHaveBeenCalledTimes(1);
      expect(retrieveContextSpy).toHaveBeenCalledWith('mock-embedding', 3);
    });

    it('builds the prompt', () => {
      expect(buildModificationPromptSpy).toHaveBeenCalledTimes(1);
      expect(buildModificationPromptSpy).toHaveBeenCalledWith(
        {
          cookTimeMinutes: 45,
          cuisine: 'american',
          description: 'mock-description',
          id: 'mock-id',
          ingredients: [
            {
              amount: 2,
              category: 'pantry',
              id: 'mock-ingredient-1',
              name: 'mock-ingredient',
              unit: 'cup'
            }
          ],
          name: 'mock-name',
          prepTimeMinutes: 10,
          protein: 'chicken',
          servings: 4,
          steps: [
            { durationMinutes: 10, instruction: 'mock-instruction', order: 1 },
            { durationMinutes: 25, instruction: 'mock-instruction', order: 2 },
            { durationMinutes: 15, instruction: 'mock-instruction', order: 3 }
          ],
          tags: ['mock-tag']
        },
        'mock-context',
        {
          baseRecipeId: 'mock-id',
          modifications: {
            cuisineShift: 'mexican',
            dietaryFilters: ['keto'],
            ingredientRemovals: ['ingredient-1'],
            ingredientSwaps: [{ from: 'ingredient-1', to: 'ingredient-2' }],
            servingScale: 8
          }
        }
      );
    });

    it('invokes haiku', () => {
      expect(invokeHaikuSpy).toHaveBeenCalledTimes(1);
      expect(invokeHaikuSpy).toHaveBeenCalledWith('mock prompt');
    });

    it('returns the ok response', () => {
      expect(okSpy).toHaveBeenCalledTimes(1);
      expect(okSpy).toHaveBeenCalledWith({ modifiedRecipe: 'modified recipe' });
    });
  });
});
