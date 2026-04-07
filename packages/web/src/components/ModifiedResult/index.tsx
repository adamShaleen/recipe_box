import type { Recipe } from '@recipe-box/shared';
import type { FC } from 'react';
import { RecipeDetail } from '../RecipeDetail';
import { Button } from '../ui/Button';

interface ModifiedResultProps {
  recipe: Recipe;
  onBack: () => void;
}

export const ModifiedResult: FC<ModifiedResultProps> = ({ recipe, onBack }) => {
  return (
    <>
      <Button onClick={onBack}>Start Over</Button>
      <RecipeDetail recipe={recipe} />
    </>
  );
};
