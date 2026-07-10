export interface User {
  id: number;
  email: string;
  display_name: string | null;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at?: string;
}

export interface Ingredient {
  id?: number;
  recipe_id?: number;
  name: string;
  amount: string;
  unit: string;
  sort_order?: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  category_id: number | null;
  instructions: string[] | string;
  ingredients?: Ingredient[];
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  category_color?: string;
  user_id?: number;
}

export interface RecipeListResponse {
  data: Recipe[];
  total: number;
  page: number;
  limit: number;
}

export interface FavoriteEntry {
  recipe_id: number;
  user_id: number;
  created_at?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface RecipeFormData {
  title: string;
  description: string;
  image_url: string;
  prep_time: number | '';
  cook_time: number | '';
  servings: number | '';
  difficulty: 'easy' | 'medium' | 'hard';
  category_id: number | '';
  instructions: string[];
  ingredients: Ingredient[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
