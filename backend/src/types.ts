export interface User {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: Date;
}

export interface Ingredient {
  id: number;
  recipe_id: number;
  name: string;
  amount: string;
  unit: string;
  sort_order: number;
}

export interface Recipe {
  id: number;
  user_id: number | null;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  category_id: number | null;
  instructions: string;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  category_color?: string;
  ingredients?: Ingredient[];
}

export interface Favorite {
  id: number;
  user_id: number;
  recipe_id: number;
  created_at: Date;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
