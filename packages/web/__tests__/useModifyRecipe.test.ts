import type { ModifyRecipeRequest } from '@recipe-box/shared';
import { act, renderHook } from '@testing-library/react';
import { useModifyRecipe } from '../src/hooks/useModifyRecipe';
import * as api from '../src/services/api';

jest.mock('../src/services/api');
jest.mock('../src/config', () => ({
  API_URL: 'https://mock-api.com',
  API_KEY: 'mock-key'
}));

const mockRequest: ModifyRecipeRequest = {
  baseRecipeId: 'mock-id',
  modifications: {
    dietaryFilters: ['keto'],
    ingredientSwaps: [],
    ingredientRemovals: [],
    servingScale: 2
  }
};

describe('useModifyRecipe', () => {
  const modifyRecipeSpy = jest.spyOn(api, 'modifyRecipe');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initial state', () => {
    const { result } = renderHook(() => useModifyRecipe());

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  describe('Happy Path', () => {
    it('calls modifyRecipe with the request', async () => {
      modifyRecipeSpy.mockResolvedValue({ modifiedRecipe: { id: 'mock-id' } } as any);

      const { result } = renderHook(() => useModifyRecipe());

      await act(async () => {
        await result.current.modify(mockRequest);
      });

      expect(modifyRecipeSpy).toHaveBeenCalledTimes(1);
      expect(modifyRecipeSpy).toHaveBeenCalledWith(mockRequest);
    });

    it('sets result on success', async () => {
      modifyRecipeSpy.mockResolvedValue({ modifiedRecipe: { id: 'mock-id' } } as any);

      const { result } = renderHook(() => useModifyRecipe());

      await act(async () => {
        await result.current.modify(mockRequest);
      });

      expect(result.current.result).toEqual({ modifiedRecipe: { id: 'mock-id' } });
      expect(result.current.error).toBeNull();
    });

    it('reset clears result', async () => {
      modifyRecipeSpy.mockResolvedValue({ modifiedRecipe: { id: 'mock-id' } } as any);

      const { result } = renderHook(() => useModifyRecipe());

      await act(async () => {
        await result.current.modify(mockRequest);
      });

      expect(result.current.result).toEqual({ modifiedRecipe: { id: 'mock-id' } });

      act(() => {
        result.current.reset();
      });

      expect(result.current.result).toBeNull();
    });
  });

  describe('Sad Path', () => {
    it('sets error on failure', async () => {
      modifyRecipeSpy.mockRejectedValue(new Error('oh noes!'));

      const { result } = renderHook(() => useModifyRecipe());

      await act(async () => {
        await result.current.modify(mockRequest);
      });

      expect(result.current.error).toBe('oh noes!');
      expect(result.current.result).toBeNull();
    });
  });
});
