import type { ModifyRecipeRequest, ModifyRecipeResponse } from '@recipe-box/shared';

export interface UseModifyRecipeResult {
  modify: (request: ModifyRecipeRequest) => Promise<void>;
  result: ModifyRecipeResponse | null;
  loading: boolean;
  error: string | null;
}

export const useModifyRecipe = (): UseModifyRecipeResult => {
  throw new Error('Not implemented');
};
