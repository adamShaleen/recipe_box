import type { Recipe } from '@recipe-box/shared';
import { useEffect, useState } from 'react';
import { fetchRecipe } from '../services/api';

export interface UseRecipeResult {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
}

export const useRecipe = (id: string): UseRecipeResult => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const load = async (): Promise<void> => {
      try {
        const data = await fetchRecipe(id);
        setRecipe(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return { recipe, loading, error };
};
