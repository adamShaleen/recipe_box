import { useState, type FC } from 'react';
import { ModifiedResult } from './components/ModifiedResult';
import { RecipeBrowser } from './components/RecipeBrowser';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeModifier } from './components/RecipeModifier';
import { Button } from './components/ui/Button';
import { useModifyRecipe } from './hooks/useModifyRecipe';
import { useRecipe } from './hooks/useRecipe';

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

  if (selectedRecipeId && recipeLoading) return <p>Loading...</p>;
  if (selectedRecipeId && recipeError) return <p>Error: {recipeError}</p>;
  if (selectedRecipeId && recipe !== null) {
    return (
      <>
        <Button onClick={handleBack}>Start Over</Button>
        <RecipeDetail recipe={recipe} />
        {modifyError && <p>Error: {modifyError}</p>}
        <RecipeModifier recipe={recipe} onSubmit={modify} disabled={modifyLoading} />
      </>
    );
  }

  return <RecipeBrowser onSelect={(recipe) => setSelectedRecipeId(recipe.id)} />;
};
