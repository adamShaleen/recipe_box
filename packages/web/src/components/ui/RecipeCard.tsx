import type { RecipeMetadata } from '@recipe-box/shared';
import type { FC } from 'react';
import { Card } from './Card';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeMetadata;
  onClick: () => void;
}

export const RecipeCard: FC<RecipeCardProps> = ({ recipe, onClick }) => {
  return (
    <Card onClick={onClick}>
      <div className={styles.body}>
        <h3 className={styles.name}>{recipe.name}</h3>
        <p className={styles.description}>{recipe.description}</p>
        <div className={styles.meta}>
          <span className={styles.badge}>{recipe.cuisine}</span>
          <span className={styles.time}>{recipe.prepTime + recipe.cookTime} min</span>
        </div>
      </div>
    </Card>
  );
};
