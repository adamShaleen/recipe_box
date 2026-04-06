import { APIGatewayProxyEvent } from 'aws-lambda';
import * as sut from '../handlers/get-recipe';
import * as dynamoService from '../services/dynamo.service';
import * as responseUtils from '../utils/response';

describe('get-recipe', () => {
  const getRecipeSpy = jest.spyOn(dynamoService, 'getRecipe');
  const okSpy = jest.spyOn(responseUtils, 'ok');
  const notFoundSpy = jest.spyOn(responseUtils, 'notFound');
  const internalErrorSpy = jest.spyOn(responseUtils, 'internalError');

  const event = {
    pathParameters: { id: 'mock-id' }
  } as unknown as APIGatewayProxyEvent;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy path', () => {
    beforeEach(async () => {
      getRecipeSpy.mockResolvedValue({ foo: 'jazz' } as any);
      await sut.handler(event);
    });

    it('fetches the recipe by id', () => {
      expect(getRecipeSpy).toHaveBeenCalledTimes(1);
      expect(getRecipeSpy).toHaveBeenCalledWith('mock-id');
    });

    it('returns the recipe', () => {
      expect(okSpy).toHaveBeenCalledTimes(1);
      expect(okSpy).toHaveBeenCalledWith({ foo: 'jazz' });
    });
  });

  describe('Sad Paths', () => {
    describe('recipe not found', () => {
      it('returns 404', async () => {
        getRecipeSpy.mockResolvedValue(null);
        await sut.handler(event);

        expect(notFoundSpy).toHaveBeenCalledTimes(1);
        expect(notFoundSpy).toHaveBeenCalledWith('No recipe found with id mock-id');
      });
    });

    it('when process fails - returns error response', async () => {
      getRecipeSpy.mockRejectedValue(Error('oh noes!'));
      await sut.handler(event);

      expect(internalErrorSpy).toHaveBeenCalledTimes(1);
      expect(internalErrorSpy).toHaveBeenCalledWith('oh noes!');
    });
  });
});
