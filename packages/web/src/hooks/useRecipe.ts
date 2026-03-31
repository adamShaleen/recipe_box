import type { Recipe } from '@recipe-box/shared';

export interface UseRecipeResult {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
}

export const useRecipe = (_id: string): UseRecipeResult => {
  throw new Error('Not implemented');
};
