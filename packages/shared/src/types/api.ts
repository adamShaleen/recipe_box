import type { Recipe, RecipeMetadata } from './recipe';
import type { ModificationRequest } from './modification';

export interface ListRecipesQuery {
  cuisine?: string;
  protein?: string;
  tag?: string;
}

export interface ListRecipesResponse {
  recipes: RecipeMetadata[];
}

export interface GetRecipeResponse {
  recipe: Recipe;
}

export type ModifyRecipeRequest = ModificationRequest;

export interface ModifyRecipeResponse {
  modifiedRecipe: Recipe;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
