import {
  CUISINE_TYPES,
  DIETARY_FILTERS,
  INGREDIENT_SUBSTITUTIONS,
  type CuisineType,
  type DietaryFilter,
  type IngredientSwap,
  type ModificationRequest,
  type Recipe
} from '@recipe-box/shared';
import { useState, type FC } from 'react';
import { Button } from '../ui/Button';

interface RecipeModifierProps {
  recipe: Recipe;
  onSubmit: (request: ModificationRequest) => void;
  disabled: boolean;
}

export const RecipeModifier: FC<RecipeModifierProps> = ({ recipe, onSubmit, disabled }) => {
  const [ingredientRemovals, setIngredientRemovals] = useState<string[]>([]);
  const [ingredientSwaps, setIngredientSwaps] = useState<IngredientSwap[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryFilter[]>([]);
  const [servingScale, setServingScale] = useState<number>(recipe.servings);
  const [cuisineShift, setCuisineShift] = useState<CuisineType | undefined>(undefined);

  const toggleRemoval = (id: string): void => {
    if (ingredientRemovals.includes(id)) {
      setIngredientRemovals(ingredientRemovals.filter((ingredient) => ingredient !== id));
    } else {
      setIngredientRemovals([...ingredientRemovals, id]);
    }
  };

  const setSwap = (ingredientName: string, to: string): void => {
    if (ingredientSwaps.some((swap) => swap.from === ingredientName)) {
      setIngredientSwaps(
        ingredientSwaps.map((swap) =>
          swap.from === ingredientName ? { from: ingredientName, to } : swap
        )
      );
    } else {
      setIngredientSwaps([...ingredientSwaps, { from: ingredientName, to }]);
    }
  };

  const toggleDietaryFilter = (filter: DietaryFilter): void => {
    if (dietaryFilters.includes(filter)) {
      setDietaryFilters(dietaryFilters.filter((df) => df !== filter));
    } else {
      setDietaryFilters([...dietaryFilters, filter]);
    }
  };

  const handleSubmit = (): void => {
    onSubmit({
      baseRecipeId: recipe.id,
      modifications: {
        dietaryFilters,
        ingredientSwaps,
        ingredientRemovals,
        servingScale: servingScale / recipe.servings,
        cuisineShift
      }
    });
  };

  return (
    <div>
      <div>
        <h4>Ingredients</h4>
        {recipe.ingredients.map((ingredient) => {
          const isRemoved = ingredientRemovals.includes(ingredient.id);
          const currentSwap = ingredientSwaps.find((s) => s.from === ingredient.name);
          const substitutions = INGREDIENT_SUBSTITUTIONS[ingredient.category].filter(
            (s) => s !== ingredient.name
          );
          return (
            <div key={ingredient.id}>
              <label>
                <input
                  type="checkbox"
                  checked={!isRemoved}
                  onChange={() => toggleRemoval(ingredient.id)}
                />
                {ingredient.name}
              </label>
              <select
                disabled={isRemoved}
                value={currentSwap?.to ?? ''}
                onChange={(e) => setSwap(ingredient.name, e.target.value)}
              >
                <option value="">no swap</option>
                {substitutions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div>
        <h4>Dietary Filters</h4>
        {DIETARY_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => toggleDietaryFilter(filter)}
            aria-pressed={dietaryFilters.includes(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div>
        <h4>Servings</h4>
        <input
          type="number"
          min={1}
          value={servingScale}
          onChange={(e) => setServingScale(Number(e.target.value))}
        />
      </div>

      <div>
        <h4>Cuisine Shift</h4>
        <select
          value={cuisineShift ?? ''}
          onChange={(e) =>
            setCuisineShift(e.target.value === '' ? undefined : (e.target.value as CuisineType))
          }
        >
          <option value="">none</option>
          {CUISINE_TYPES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Button onClick={handleSubmit} disabled={disabled}>
        Modify Recipe
      </Button>
    </div>
  );
};
