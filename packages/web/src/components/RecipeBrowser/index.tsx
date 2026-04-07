import type { RecipeMetadata } from '@recipe-box/shared';
import type { FC } from 'react';
import { useRef } from 'react';
import { useRecipes } from '../../hooks/useRecipes';
import { CardSkeleton } from '../ui/CardSkeleton';
import { RecipeCard } from '../ui/RecipeCard';
import styles from './RecipeBrowser.module.css';

interface RecipeBrowserProps {
  onSelect: (recipe: RecipeMetadata) => void;
}

const DEFAULT_SKELETON_COUNT = 4;

export const RecipeBrowser: FC<RecipeBrowserProps> = ({ onSelect }) => {
  const { recipes, loading, error } = useRecipes();
  const lastCountRef = useRef(DEFAULT_SKELETON_COUNT);

  if (!loading && recipes.length > 0) {
    lastCountRef.current = recipes.length;
  }

  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: lastCountRef.current }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.grid}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onSelect(recipe)} />
      ))}
    </div>
  );
};
