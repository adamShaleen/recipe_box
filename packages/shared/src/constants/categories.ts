export const CUISINE_TYPES = [
  'italian',
  'mexican',
  'thai',
  'japanese',
  'indian',
  'american',
  'french',
  'mediterranean',
  'chinese',
  'greek',
  'vietnamese'
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

export const DIETARY_FILTERS = [
  'keto',
  'vegan',
  'vegetarian',
  'gluten-free',
  'dairy-free',
  'paleo',
  'whole30',
  'low-carb'
] as const;

export type DietaryFilter = (typeof DIETARY_FILTERS)[number];

export const PROTEIN_TYPES = [
  'chicken',
  'beef',
  'pork',
  'fish',
  'shrimp',
  'tofu',
  'lamb',
  'turkey',
  'eggs',
  'beans',
  'none'
] as const;

export type ProteinType = (typeof PROTEIN_TYPES)[number];
