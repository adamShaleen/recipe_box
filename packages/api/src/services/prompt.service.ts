import type { ModificationRequest, Recipe } from '@recipe-box/shared';

export const buildModificationPrompt = (
  baseRecipe: Recipe,
  context: Recipe[],
  modificationRequest: ModificationRequest
): string => {
  const { name, cuisine, servings, ingredients, steps } = baseRecipe;

  return `
  You are a professional chef. Modify the following recipe according to the instructions below.

  # Base Recipe
  Name: ${name}
  Cuisine: ${cuisine}
  Servings: ${servings}
  Ingredients: ${ingredients.map(({ amount, unit, name }) => `${amount} ${unit} ${name}`).join('\n  ')}
  Steps: ${steps.map(({ order, instruction }) => `${order} ${instruction}`).join('\n  ')}

  ## Reference Recipes
  ${context.map(({ name, description }) => `${name}: ${description}`).join('\n  ')}

  ## Modifications
  ${[
    modificationRequest.modifications.dietaryFilters.length
      ? `Make this recipe: ${modificationRequest.modifications.dietaryFilters.join(', ')}.`
      : null,
    modificationRequest.modifications.ingredientSwaps.length
      ? modificationRequest.modifications.ingredientSwaps
          .map(({ from, to }) => `Swap ${from} for ${to}.`)
          .join('\n  ')
      : null,
    modificationRequest.modifications.ingredientRemovals.length
      ? `Remove the following ingredients: ${modificationRequest.modifications.ingredientRemovals.join(', ')}.`
      : null,
    modificationRequest.modifications.servingScale !== 1
      ? `Adjust the recipe to serve ${servings * modificationRequest.modifications.servingScale} (original: ${servings}).`
      : null,
    modificationRequest.modifications.cuisineShift
      ? `Restyle this dish as ${modificationRequest.modifications.cuisineShift} cuisine.`
      : null
  ]
    .filter(Boolean)
    .join('\n  ')}

  ## Output
  Return the modified recipe as a valid JSON object with this exact structure, and nothing else — no explanation, no markdown, no code fences:
  { "id": string, "name": string, "description": string, "cuisine": string, "protein": string, "tags": string[], "servings": number, "prepTimeMinutes": number, "cookTimeMinutes": number, "ingredients": [{ "id": string, "name": string, "amount": number, "unit": string, "category": string }], "steps": [{ "order": number, "instruction": string, "durationMinutes": number | null }] }
  `.trim();
};
