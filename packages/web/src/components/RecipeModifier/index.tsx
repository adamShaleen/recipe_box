import type { FC } from 'react';
import type { Recipe, ModificationRequest } from '@recipe-box/shared';

interface RecipeModifierProps {
  recipe: Recipe;
  onSubmit: (request: ModificationRequest) => void;
}

export const RecipeModifier: FC<RecipeModifierProps> = (_props) => {
  throw new Error('Not implemented');
};
