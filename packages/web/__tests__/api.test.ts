import * as sut from '../src/services/api';

jest.mock('../src/config', () => ({
  API_URL: 'https://mock-api.com',
  API_KEY: 'mock-key'
}));

describe('api', () => {
  const fetchSpy = jest.fn();
  globalThis.fetch = fetchSpy;

  const apiFetchSpy = jest.spyOn(sut, 'apiFetch');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apiFetch', () => {
    it('throws when the response is not OK', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as any);
      await expect(sut.apiFetch('mock-path')).rejects.toThrow('HTTP 404');
    });

    describe('Happy Path', () => {
      let result: any;

      beforeEach(async () => {
        fetchSpy.mockResolvedValue({ ok: true, json: async () => 'good' });
        result = await sut.apiFetch('mock-path', { headers: { foo: 'jazz' } });
      });

      it('invokes fetch', () => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('https://mock-api.com/mock-path', {
          headers: { 'Content-Type': 'application/json', foo: 'jazz', 'x-api-key': 'mock-key' }
        });
      });

      it('returns the response', () => {
        expect(result).toEqual('good');
      });
    });
  });

  describe('fetchRecipes', () => {
    describe('query', () => {
      let result: any;

      beforeEach(async () => {
        apiFetchSpy.mockResolvedValue([{ sure: 'yeah' }]);
        result = await sut.fetchRecipes({
          cuisine: 'american',
          protein: 'chicken',
          tag: 'mock-tag'
        });
      });

      it('invokes the endpoint', () => {
        expect(apiFetchSpy).toHaveBeenCalledTimes(1);
        expect(apiFetchSpy).toHaveBeenCalledWith(
          'recipes?cuisine=american&protein=chicken&tag=mock-tag'
        );
      });

      it('returns the recipes', () => {
        expect(result).toEqual([{ sure: 'yeah' }]);
      });
    });

    describe('no query', () => {
      it('does not include query', async () => {
        await sut.fetchRecipes();

        expect(apiFetchSpy).toHaveBeenCalledTimes(1);
        expect(apiFetchSpy).toHaveBeenCalledWith('recipes');
      });
    });
  });

  describe('fetchRecipe', () => {
    let result: any;

    beforeEach(async () => {
      apiFetchSpy.mockResolvedValue({ yep: 'kewl' });
      result = await sut.fetchRecipe('mock-id');
    });

    it('invokes the endpoint', () => {
      expect(apiFetchSpy).toHaveBeenCalledTimes(1);
      expect(apiFetchSpy).toHaveBeenCalledWith('recipes/mock-id');
    });

    it('returns the recipe', () => {
      expect(result).toEqual({ yep: 'kewl' });
    });
  });

  describe('modifyRecipe', () => {
    let result: any;

    beforeEach(async () => {
      apiFetchSpy.mockResolvedValue({ whoa: 'ooh' });
      result = await sut.modifyRecipe({
        baseRecipeId: 'mock-id',
        modifications: {
          dietaryFilters: ['dairy-free'],
          ingredientSwaps: [],
          ingredientRemovals: [],
          servingScale: 3,
          cuisineShift: 'american'
        }
      });
    });

    it('invokes the endpoint', () => {
      expect(apiFetchSpy).toHaveBeenCalledTimes(1);
      expect(apiFetchSpy).toHaveBeenCalledWith('recipes/mock-id/modify', {
        body: '{"baseRecipeId":"mock-id","modifications":{"dietaryFilters":["dairy-free"],"ingredientSwaps":[],"ingredientRemovals":[],"servingScale":3,"cuisineShift":"american"}}',
        method: 'POST'
      });
    });

    it('returns the modified response', () => {
      expect(result).toEqual({ whoa: 'ooh' });
    });
  });
});
