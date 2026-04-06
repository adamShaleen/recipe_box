import { APIGatewayProxyEvent } from 'aws-lambda';
import * as sut from '../handlers/get-recipes';
import * as dynamoService from '../services/dynamo.service';
import * as responseUtils from '../utils/response';

describe('get-recipes', () => {
  const listRecipesSpy = jest.spyOn(dynamoService, 'listRecipes');
  const okSpy = jest.spyOn(responseUtils, 'ok');
  const internalErrorSpy = jest.spyOn(responseUtils, 'internalError');

  const event = {
    queryStringParameters: { cuisine: 'mexican', tag: 'mock tag' }
  } as unknown as APIGatewayProxyEvent;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy path', () => {
    beforeEach(async () => {
      listRecipesSpy.mockResolvedValue([{ foo: 'jazz' }] as any);
      await sut.handler(event);
    });

    it('fetches all the recipes by query', () => {
      expect(listRecipesSpy).toHaveBeenCalledTimes(1);
      expect(listRecipesSpy).toHaveBeenCalledWith({ cuisine: 'mexican', tag: 'mock tag' });
    });

    it('returns the recipes', () => {
      expect(okSpy).toHaveBeenCalledTimes(1);
      expect(okSpy).toHaveBeenCalledWith([{ foo: 'jazz' }]);
    });
  });

  describe('Sad Path', () => {
    it('when process fails - returns error response', async () => {
      listRecipesSpy.mockRejectedValue(Error('oh noes!'));
      await sut.handler(event);

      expect(internalErrorSpy).toHaveBeenCalledTimes(1);
      expect(internalErrorSpy).toHaveBeenCalledWith('oh noes!');
    });
  });
});
