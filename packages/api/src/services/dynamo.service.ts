import type { ListRecipesQuery, RecipeMetadata, Recipe } from '@recipe-box/shared';

export const listRecipes = async (_query: ListRecipesQuery): Promise<RecipeMetadata[]> => {
  throw new Error('Not implemented');
};

export const getRecipe = async (_id: string): Promise<Recipe | null> => {
  throw new Error('Not implemented');
};
