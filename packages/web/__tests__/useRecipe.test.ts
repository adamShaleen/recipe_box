import { renderHook, waitFor } from '@testing-library/react';
import { useRecipe } from '../src/hooks/useRecipe';
import * as api from '../src/services/api';

jest.mock('../src/services/api');
jest.mock('../src/config', () => ({
  API_URL: 'https://mock-api.com',
  API_KEY: 'mock-key'
}));

describe('useRecipe', () => {
  const fetchRecipeSpy = jest.spyOn(api, 'fetchRecipe');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('fetches and returns recipe', async () => {
      fetchRecipeSpy.mockResolvedValue({ id: 'mock-id' } as any);

      const { result } = renderHook(() => useRecipe('mock-id'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchRecipeSpy).toHaveBeenCalledTimes(1);
      expect(result.current.recipe).toEqual({ id: 'mock-id' });
      expect(result.current.error).toBeNull();
    });

    it('re-fetches when id changes', async () => {
      fetchRecipeSpy.mockResolvedValue({ id: 'mock-id' } as any);

      const { result, rerender } = renderHook(({ id }: { id: string }) => useRecipe(id), {
        initialProps: { id: 'mock-id' }
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(fetchRecipeSpy).toHaveBeenCalledTimes(1);

      rerender({ id: 'other-id' });

      await waitFor(() => expect(fetchRecipeSpy).toHaveBeenCalledTimes(2));
    });
  });

  describe('Sad Path', () => {
    it('sets error on failure', async () => {
      fetchRecipeSpy.mockRejectedValue(new Error('oh noes!'));

      const { result } = renderHook(() => useRecipe('mock-id'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('oh noes!');
      expect(result.current.recipe).toEqual(null);
    });
  });
});
