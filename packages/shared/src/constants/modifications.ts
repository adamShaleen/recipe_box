import type { IngredientCategory } from '../types/recipe';

export const INGREDIENT_SUBSTITUTIONS: Record<IngredientCategory, string[]> = {
  protein: ['chicken', 'beef', 'pork', 'fish', 'tofu', 'tempeh', 'lentils'],
  produce: ['spinach', 'kale', 'zucchini', 'cauliflower', 'broccoli', 'sweet potato'],
  dairy: ['almond milk', 'oat milk', 'coconut cream', 'cashew cheese', 'nutritional yeast'],
  pantry: ['olive oil', 'coconut oil', 'almond flour', 'quinoa', 'rice', 'pasta', 'zucchini noodles'],
  seasoning: ['salt', 'pepper', 'garlic powder', 'onion powder', 'paprika', 'cumin', 'oregano'],
};
