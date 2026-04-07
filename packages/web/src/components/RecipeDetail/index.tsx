import type { Recipe } from '@recipe-box/shared';
import type { FC } from 'react';
import { Card } from '../ui/Card';
import styles from './RecipeDetail.module.css';

interface RecipeDetailProps {
  recipe: Recipe;
}

export const RecipeDetail: FC<RecipeDetailProps> = ({ recipe }) => {
  return (
    <Card>
      <div className={styles.body}>
        <div className={styles.header}>
          <h1 className={styles.name}>{recipe.name}</h1>
          <div className={styles.meta}>
            <span className={styles.badge}>{recipe.cuisine}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.timeStat}>Prep {recipe.prepTime} min</span>
            <span className={styles.dot}>·</span>
            <span className={styles.timeStat}>Cook {recipe.cookTime} min</span>
            <span className={styles.dot}>·</span>
            <span className={styles.timeStat}>Serves {recipe.servings}</span>
          </div>
          <p className={styles.description}>{recipe.description}</p>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className={styles.ingredient}>
                <span className={styles.ingredientName}>{ingredient.name}</span>
                <span className={styles.ingredientAmount}>
                  {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <hr className={styles.divider} style={{ marginTop: 24 }} />

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Instructions</h2>
          <ol className={styles.stepList}>
            {[...recipe.steps]
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <li key={step.order} className={styles.step}>
                  <span className={styles.stepNumber}>{step.order}</span>
                  <p className={styles.stepText}>{step.instruction}</p>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </Card>
  );
};
