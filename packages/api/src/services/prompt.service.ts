import type { Recipe, ModificationRequest } from '@recipe-box/shared';

export const buildModificationPrompt = (
  _baseRecipe: Recipe,
  _context: Recipe[],
  _request: ModificationRequest,
): string => {
  throw new Error('Not implemented');
};
