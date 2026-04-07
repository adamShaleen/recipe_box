import type { Recipe } from '@recipe-box/shared';
import type { FC } from 'react';

interface RecipeDetailProps {
  recipe: Recipe;
}

export const RecipeDetail: FC<RecipeDetailProps> = ({ recipe }) => {
  return (
    <div>
      <h3>{recipe.name}</h3>
      <p>{recipe.description}</p>
      <ul>
        {recipe.ingredients.map((ingredient) => {
          return (
            <li key={ingredient.id}>
              {ingredient.name} {ingredient.amount} {ingredient.unit}
            </li>
          );
        })}
      </ul>
      <ol>
        {[...recipe.steps]
          .sort((a, b) => a.order - b.order)
          .map((step) => {
            return <li key={step.order}>{step.instruction}</li>;
          })}
      </ol>
    </div>
  );
};
