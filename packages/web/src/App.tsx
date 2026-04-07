import { useState, type FC } from 'react';
import { ModifiedResult } from './components/ModifiedResult';
import { RecipeBrowser } from './components/RecipeBrowser';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeModifier } from './components/RecipeModifier';
import { Button } from './components/ui/Button';
import { CardSkeleton } from './components/ui/CardSkeleton';
import { useModifyRecipe } from './hooks/useModifyRecipe';
import { useRecipe } from './hooks/useRecipe';
import styles from './App.module.css';

export const App: FC = () => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const { recipe, loading: recipeLoading, error: recipeError } = useRecipe(selectedRecipeId ?? '');
  const { modify, result, loading: modifyLoading, reset, error: modifyError } = useModifyRecipe();

  const handleBack = (): void => {
    reset();
    setSelectedRecipeId(null);
  };

  if (result && !modifyError) {
    return <ModifiedResult recipe={result.modifiedRecipe} onBack={handleBack} />;
  }

  if (selectedRecipeId && recipeLoading) return <CardSkeleton />;
  if (selectedRecipeId && recipeError) return <p>Error: {recipeError}</p>;
  if (selectedRecipeId && recipe !== null) {
    return (
      <div className={styles.page}>
        <RecipeDetail recipe={recipe} />
        {modifyError && <p>Error: {modifyError}</p>}
        <RecipeModifier recipe={recipe} onSubmit={modify} disabled={modifyLoading} />
        <Button className="destructiveButton" onClick={handleBack}>Start Over</Button>
      </div>
    );
  }

  return <RecipeBrowser onSelect={(recipe) => setSelectedRecipeId(recipe.id)} />;
};
