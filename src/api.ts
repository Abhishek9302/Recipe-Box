import type { Recipe, Category, RecipeListResponse, FavoriteEntry, AuthResponse } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rb_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errMsg = body.error || body.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // Auth
  signup: (email: string, password: string, display_name?: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Categories
  getCategories: () => request<Category[]>('/api/categories'),

  createCategory: (data: { name: string; color: string }) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),

  deleteCategory: (id: number) =>
    request<void>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Recipes
  getRecipes: (params: { q?: string; category?: number; difficulty?: string; page?: number; limit?: number } = {}) =>
    request<RecipeListResponse>(`/api/recipes${buildQuery(params as Record<string, string | number | undefined>)}`),

  getRecipe: (id: number) => request<Recipe>(`/api/recipes/${id}`),

  createRecipe: (data: Partial<Recipe>) =>
    request<Recipe>('/api/recipes', { method: 'POST', body: JSON.stringify(data) }),

  updateRecipe: (id: number, data: Partial<Recipe>) =>
    request<Recipe>(`/api/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteRecipe: (id: number) =>
    request<void>(`/api/recipes/${id}`, { method: 'DELETE' }),

  // Favorites
  getFavorites: () => request<FavoriteEntry[]>('/api/favorites'),

  addFavorite: (recipeId: number) =>
    request<FavoriteEntry>('/api/favorites', { method: 'POST', body: JSON.stringify({ recipe_id: recipeId }) }),

  removeFavorite: (recipeId: number) =>
    request<void>(`/api/favorites/${recipeId}`, { method: 'DELETE' }),
};
