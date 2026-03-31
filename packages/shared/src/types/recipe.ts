export type IngredientCategory = 'protein' | 'produce' | 'dairy' | 'pantry' | 'seasoning';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  swappable: boolean;
}

export interface Step {
  order: number;
  instruction: string;
  durationMinutes: number | null;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  protein: string;
  tags: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  imageUrl?: string;
  ingredients: Ingredient[];
  steps: Step[];
}

export type RecipeMetadata = Omit<Recipe, 'ingredients' | 'steps'>;
