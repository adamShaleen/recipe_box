import type { ListRecipesQuery } from '@recipe-box/shared';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecipes } from '../src/hooks/useRecipes';
import * as api from '../src/services/api';

jest.mock('../src/services/api');
jest.mock('../src/config', () => ({
  API_URL: 'https://mock-api.com',
  API_KEY: 'mock-key'
}));

describe('useRecipes', () => {
  const fetchRecipesSpy = jest.spyOn(api, 'fetchRecipes');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('fetches and returns recipes', async () => {
      fetchRecipesSpy.mockResolvedValue([{ id: 'mock-id' }] as any);

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchRecipesSpy).toHaveBeenCalledTimes(1);
      expect(result.current.recipes).toEqual([{ id: 'mock-id' }]);
      expect(result.current.error).toBeNull();
    });

    it('passes query to fetchRecipes', async () => {
      fetchRecipesSpy.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipes({ cuisine: 'italian' }));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchRecipesSpy).toHaveBeenCalledWith({ cuisine: 'italian' });
    });

    it('re-fetches when query changes', async () => {
      fetchRecipesSpy.mockResolvedValue([]);

      const { result, rerender } = renderHook(
        ({ query }: { query?: ListRecipesQuery }) => useRecipes(query),
        { initialProps: { query: { cuisine: 'italian' } } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchRecipesSpy).toHaveBeenCalledTimes(1);

      rerender({ query: { cuisine: 'mexican' } });

      await waitFor(() => expect(fetchRecipesSpy).toHaveBeenCalledTimes(2));
    });
  });

  describe('Sad Path', () => {
    it('sets error on failure', async () => {
      fetchRecipesSpy.mockRejectedValue(new Error('oh noes!'));

      const { result } = renderHook(() => useRecipes());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('oh noes!');
      expect(result.current.recipes).toEqual([]);
    });
  });
});
