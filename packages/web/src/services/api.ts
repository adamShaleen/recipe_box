import type {
  ListRecipesQuery,
  RecipeMetadata,
  Recipe,
  ModifyRecipeRequest,
  ModifyRecipeResponse,
} from '@recipe-box/shared';

export const fetchRecipes = async (_query?: ListRecipesQuery): Promise<RecipeMetadata[]> => {
  throw new Error('Not implemented');
};

export const fetchRecipe = async (_id: string): Promise<Recipe> => {
  throw new Error('Not implemented');
};

export const modifyRecipe = async (_request: ModifyRecipeRequest): Promise<ModifyRecipeResponse> => {
  throw new Error('Not implemented');
};
