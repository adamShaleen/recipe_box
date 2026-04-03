import { ModificationRequest, Recipe } from '@recipe-box/shared';
import * as sut from '../services/prompt.service';

describe('buildModificationPrompt', () => {
  const baseRecipe: Recipe = {
    id: 'mock-recipe-id',
    name: 'mock-name',
    description: 'mock-description',
    cuisine: 'mock-cuisine',
    protein: 'mock-protein',
    tags: ['mock-tag-1', 'mock-tag-2'],
    servings: 4,
    prepTimeMinutes: 25,
    cookTimeMinutes: 45,
    ingredients: [
      {
        id: 'mock-ingredient-id-1',
        name: 'mock-ingredient-1',
        amount: 1,
        unit: 'mock-unit',
        category: 'produce'
      },
      {
        id: 'mock-ingredient-id-2',
        name: 'mock-ingredient-2',
        amount: 1,
        unit: 'mock-unit',
        category: 'produce'
      }
    ],
    steps: [
      { order: 1, instruction: 'mock-instruction-1', durationMinutes: 10 },
      { order: 2, instruction: 'mock-instruction-2', durationMinutes: 10 }
    ]
  };

  const context = [
    { name: 'mock-context-name-1', description: 'mock-context-description-1' },
    { name: 'mock-context-name-2', description: 'mock-context-description-2' }
  ] as Recipe[];

  const modificationRequest: ModificationRequest = {
    baseRecipeId: 'mock-recipe-id',
    modifications: {
      dietaryFilters: ['keto'],
      ingredientSwaps: [{ from: 'mock-ingredient-swap-from', to: 'mock-ingredient-swap-to' }],
      ingredientRemovals: ['mock-ingredient-removal-1'],
      servingScale: 1,
      cuisineShift: 'american'
    }
  };

  it('creates the prompt', () => {
    expect(sut.buildModificationPrompt(baseRecipe, context, modificationRequest))
      .toEqual(`You are a professional chef. Modify the following recipe according to the instructions below.

  # Base Recipe
  Name: mock-name
  Cuisine: mock-cuisine
  Servings: 4
  Ingredients: 1 mock-unit mock-ingredient-1
  1 mock-unit mock-ingredient-2
  Steps: 1 mock-instruction-1
  2 mock-instruction-2

  ## Reference Recipes
  mock-context-name-1: mock-context-description-1
  mock-context-name-2: mock-context-description-2

  ## Modifications
  Make this recipe: keto.
  Swap mock-ingredient-swap-from for mock-ingredient-swap-to.
  Remove the following ingredients: mock-ingredient-removal-1.
  Restyle this dish as american cuisine.

  ## Output
  Return the modified recipe as a valid JSON object with this exact structure, and nothing else — no explanation, no markdown, no code fences:
  { "id": string, "name": string, "description": string, "cuisine": string, "protein": string, "tags": string[], "servings": number, "prepTimeMinutes": number, "cookTimeMinutes": number, "ingredients": [{ "id": string, "name": string, "amount": number, "unit": string, "category": string }], "steps": [{ "order": number, "instruction": string, "durationMinutes": number | null }] }`);
  });
});
