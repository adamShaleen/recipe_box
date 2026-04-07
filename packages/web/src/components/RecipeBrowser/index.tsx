import type { RecipeMetadata } from '@recipe-box/shared';
import { CUISINE_TYPES, DIETARY_FILTERS, PROTEIN_TYPES } from '@recipe-box/shared';
import type { FC } from 'react';
import { useState } from 'react';
import { useRecipes } from '../../hooks/useRecipes';

interface RecipeBrowserProps {
  onSelect: (recipe: RecipeMetadata) => void;
}

export const RecipeBrowser: FC<RecipeBrowserProps> = ({ onSelect }) => {
  const [cuisine, setCuisine] = useState<string | undefined>();
  const [protein, setProtein] = useState<string | undefined>();
  const [tag, setTag] = useState<string | undefined>();

  const { recipes, loading, error } = useRecipes({ cuisine, protein, tag });

  const toggle = (
    value: string,
    current: string | undefined,
    setter: (v: string | undefined) => void
  ): void => {
    setter(current === value ? undefined : value);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <div>
        {CUISINE_TYPES.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c, cuisine, setCuisine)}
            aria-pressed={cuisine === c}
          >
            {c}
          </button>
        ))}
      </div>
      <div>
        {PROTEIN_TYPES.map((p) => (
          <button
            key={p}
            onClick={() => toggle(p, protein, setProtein)}
            aria-pressed={protein === p}
          >
            {p}
          </button>
        ))}
      </div>
      <div>
        {DIETARY_FILTERS.map((t) => (
          <button key={t} onClick={() => toggle(t, tag, setTag)} aria-pressed={tag === t}>
            {t}
          </button>
        ))}
      </div>
      <div>
        {recipes.map((recipe) => (
          <div key={recipe.id} onClick={() => onSelect(recipe)}>
            <h3>{recipe.name}</h3>
            <p>{recipe.cuisine}</p>
            <p>{recipe.prepTime + recipe.cookTime} min</p>
          </div>
        ))}
      </div>
    </div>
  );
};
