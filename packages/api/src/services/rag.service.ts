import type { Recipe } from '@recipe-box/shared';

export const retrieveContext = async (
  _embedding: number[],
  _topK: number,
): Promise<Recipe[]> => {
  throw new Error('Not implemented');
};
