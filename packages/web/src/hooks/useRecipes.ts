import type { ListRecipesQuery, RecipeMetadata } from '@recipe-box/shared';

export interface UseRecipesResult {
  recipes: RecipeMetadata[];
  loading: boolean;
  error: string | null;
}

export const useRecipes = (_query?: ListRecipesQuery): UseRecipesResult => {
  throw new Error('Not implemented');
};
