import type { Recipe } from '@recipe-box/shared';
import type { FC } from 'react';
import { RecipeDetail } from '../RecipeDetail';
import { Button } from '../ui/Button';
import styles from './ModifiedResult.module.css';

interface ModifiedResultProps {
  recipe: Recipe;
  onBack: () => void;
}

export const ModifiedResult: FC<ModifiedResultProps> = ({ recipe, onBack }) => {
  return (
    <div className={styles.page}>
      <RecipeDetail recipe={recipe} />
      <Button className="destructiveButton" onClick={onBack}>Start Over</Button>
    </div>
  );
};
