import type { ListRecipesQuery, RecipeMetadata } from '@recipe-box/shared';
import { useEffect, useState } from 'react';
import { fetchRecipes } from '../services/api';

export interface UseRecipesResult {
  recipes: RecipeMetadata[];
  loading: boolean;
  error: string | null;
}

export const useRecipes = (query?: ListRecipesQuery): UseRecipesResult => {
  const [recipes, setRecipes] = useState<RecipeMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const load = async (): Promise<void> => {
      try {
        const data = await fetchRecipes(query);
        setRecipes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [query?.cuisine, query?.protein, query?.tag]);

  return { recipes, loading, error };
};
