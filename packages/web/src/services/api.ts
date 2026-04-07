import type {
  GetRecipeResponse,
  ListRecipesQuery,
  ModifyRecipeRequest,
  ModifyRecipeResponse,
  RecipeMetadata
} from '@recipe-box/shared';
import { API_KEY, API_URL } from '../config';

export const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}/${path}`, {
    ...options,
    headers: { ...options?.headers, 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
};

export const fetchRecipes = async (query?: ListRecipesQuery): Promise<RecipeMetadata[]> => {
  const params = Object.fromEntries(Object.entries(query ?? {}).filter(([, v]) => v !== undefined));
  const queryString = new URLSearchParams(params).toString();
  return apiFetch<RecipeMetadata[]>(queryString ? `recipes?${queryString}` : 'recipes');
};

export const fetchRecipe = async (id: string): Promise<GetRecipeResponse['recipe']> => {
  const { recipe } = await apiFetch<GetRecipeResponse>(`recipes/${id}`);
  return recipe;
};

export const modifyRecipe = async (request: ModifyRecipeRequest): Promise<ModifyRecipeResponse> => {
  return apiFetch<ModifyRecipeResponse>(`recipes/${request.baseRecipeId}/modify`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
};
