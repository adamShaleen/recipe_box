import type { CuisineType, DietaryFilter } from '../constants/categories';

export interface IngredientSwap {
  from: string;
  to: string;
}

export interface ModificationRequest {
  baseRecipeId: string;
  modifications: {
    dietaryFilters: DietaryFilter[];
    ingredientSwaps: IngredientSwap[];
    ingredientRemovals: string[];
    servingScale: number;
    cuisineShift?: CuisineType;
  };
}
