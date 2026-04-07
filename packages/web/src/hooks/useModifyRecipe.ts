import type { ModifyRecipeRequest, ModifyRecipeResponse } from '@recipe-box/shared';
import { useState } from 'react';
import { modifyRecipe } from '../services/api';

export interface UseModifyRecipeResult {
  modify: (request: ModifyRecipeRequest) => Promise<void>;
  reset: () => void;
  result: ModifyRecipeResponse | null;
  loading: boolean;
  error: string | null;
}

export const useModifyRecipe = (): UseModifyRecipeResult => {
  const [result, setResult] = useState<ModifyRecipeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = (): void => {
    setResult(null);
  };

  const modify = async (request: ModifyRecipeRequest): Promise<void> => {
    setLoading(true);

    try {
      const data = await modifyRecipe(request);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return { modify, result, loading, error, reset };
};
