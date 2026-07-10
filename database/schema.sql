-- Recipe Box Database Schema
-- Run this file to initialize the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  color      VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  image_url    TEXT,
  prep_time    INTEGER CHECK(prep_time >= 0),
  cook_time    INTEGER CHECK(cook_time >= 0),
  servings     INTEGER CHECK(servings > 0),
  difficulty   VARCHAR(10) CHECK(difficulty IN ('easy', 'medium', 'hard')),
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  instructions TEXT NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id         SERIAL PRIMARY KEY,
  recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name       VARCHAR(200) NOT NULL,
  amount     VARCHAR(50) DEFAULT '',
  unit       VARCHAR(50) DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_title_search ON recipes USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Seed categories
INSERT INTO categories (name, color) VALUES
  ('Breakfast', '#f59e0b'),
  ('Lunch', '#22c55e'),
  ('Dinner', '#6366f1'),
  ('Dessert', '#ec4899'),
  ('Snacks', '#f97316'),
  ('Soups & Stews', '#06b6d4'),
  ('Salads', '#84cc16'),
  ('Pasta & Noodles', '#a855f7'),
  ('Seafood', '#0ea5e9'),
  ('Vegetarian', '#10b981')
ON CONFLICT (name) DO NOTHING;

-- Seed demo user (password: demo1234)
INSERT INTO users (email, password_hash, display_name) VALUES
  ('demo@recipebox.app', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5udem', 'Demo Chef')
ON CONFLICT (email) DO NOTHING;

-- Seed recipes
INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Classic Spaghetti Carbonara',
  'A rich and creamy Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper. No cream needed — the magic is all in the technique.',
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
  15, 20, 4, 'medium',
  (SELECT id FROM categories WHERE name = 'Pasta & Noodles'),
  '["Bring a large pot of salted water to a boil and cook spaghetti until al dente.","While pasta cooks, cut guanciale into small cubes and fry in a pan over medium heat until crispy. Remove from heat.","In a bowl, whisk together egg yolks, whole egg, grated Pecorino Romano, and a generous amount of black pepper.","Reserve 1 cup of pasta cooking water before draining.","Add hot drained pasta to the pan with guanciale (off heat). Toss to coat.","Pour egg mixture over pasta, adding pasta water a little at a time, tossing vigorously to create a creamy sauce.","Serve immediately with extra Pecorino and black pepper."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Fluffy Buttermilk Pancakes',
  'Light, airy pancakes with a golden crust and tender interior. The secret is buttermilk and not over-mixing the batter.',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
  10, 20, 4, 'easy',
  (SELECT id FROM categories WHERE name = 'Breakfast'),
  '["Whisk together flour, sugar, baking powder, baking soda, and salt in a large bowl.","In another bowl, whisk buttermilk, eggs, and melted butter.","Pour wet ingredients into dry ingredients and stir until just combined — lumps are fine, do not overmix.","Heat a griddle or non-stick pan over medium heat and lightly grease with butter.","Pour 1/4 cup batter per pancake. Cook until bubbles form on surface and edges look set, about 2-3 minutes.","Flip and cook another 1-2 minutes until golden brown.","Serve with maple syrup, fresh berries, and a pat of butter."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Thai Green Curry',
  'Aromatic and creamy Thai green curry with tender chicken, vegetables, and fragrant coconut milk. Ready in 30 minutes.',
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
  15, 25, 4, 'medium',
  (SELECT id FROM categories WHERE name = 'Dinner'),
  '["Heat coconut oil in a wok or large pan over medium-high heat.","Add green curry paste and fry for 1-2 minutes until fragrant.","Add chicken pieces and stir-fry until sealed on all sides.","Pour in coconut milk and bring to a simmer.","Add fish sauce, palm sugar, kaffir lime leaves, and Thai basil.","Add vegetables (zucchini, bell peppers, baby corn) and simmer 10 minutes.","Taste and adjust seasoning. Serve over jasmine rice with fresh Thai basil and sliced red chili."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Chocolate Lava Cake',
  'Decadent individual chocolate cakes with a warm, gooey molten center. Impressive yet surprisingly simple to make.',
  'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800',
  15, 12, 4, 'medium',
  (SELECT id FROM categories WHERE name = 'Dessert'),
  '["Preheat oven to 425°F (220°C). Butter and flour four 6-oz ramekins.","Melt dark chocolate and butter together in a double boiler or microwave in 30-second intervals.","Whisk eggs, egg yolks, and sugar until pale and slightly thickened.","Fold chocolate mixture into egg mixture.","Sift in flour and fold until just combined.","Divide batter among prepared ramekins. Can refrigerate at this point for up to 24 hours.","Bake 10-12 minutes until edges are set but center still jiggles.","Let rest 1 minute, then invert onto plates. Serve immediately with vanilla ice cream."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Classic French Onion Soup',
  'A deeply savory, caramelized onion soup topped with crusty bread and melted Gruyère cheese. Worth every minute of slow cooking.',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
  20, 75, 6, 'hard',
  (SELECT id FROM categories WHERE name = 'Soups & Stews'),
  '["Slice 6 large onions into thin half-moons.","Melt butter with olive oil in a heavy-bottomed pot over medium-low heat.","Add onions with a pinch of salt and cook, stirring occasionally, for 45-60 minutes until deeply caramelized and golden brown.","Add garlic and thyme, cook 2 minutes. Deglaze with dry white wine.","Add beef broth and simmer 15 minutes. Season with salt and pepper.","Ladle soup into oven-safe bowls. Top with toasted baguette slices.","Cover generously with grated Gruyère cheese.","Broil until cheese is bubbly and golden brown. Serve immediately."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Avocado Toast with Poached Eggs',
  'The ultimate brunch staple — creamy avocado on sourdough toast topped with perfectly poached eggs and chili flakes.',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
  10, 10, 2, 'easy',
  (SELECT id FROM categories WHERE name = 'Breakfast'),
  '["Toast sourdough bread slices until golden and crispy.","Halve and pit avocados. Scoop flesh into a bowl.","Mash avocado with lemon juice, salt, and pepper to your preferred consistency.","Bring a pot of water to a gentle simmer. Add a splash of white vinegar.","Crack each egg into a small cup. Create a gentle whirlpool in the water and slide egg in.","Poach for 3-4 minutes for a runny yolk. Remove with a slotted spoon.","Spread avocado on toast. Top with poached egg, chili flakes, and flaky sea salt."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Grilled Salmon with Lemon Herb Butter',
  'Perfectly grilled salmon fillets with a bright, herby compound butter that melts into the fish. Ready in under 20 minutes.',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
  10, 12, 4, 'easy',
  (SELECT id FROM categories WHERE name = 'Seafood'),
  '["Make herb butter: mix softened butter with lemon zest, dill, parsley, garlic, salt and pepper. Roll in plastic wrap and refrigerate.","Pat salmon fillets dry and season generously with salt and pepper.","Brush with olive oil on both sides.","Heat grill or grill pan to medium-high. Oil the grates.","Grill salmon skin-side up for 4-5 minutes. Flip and cook another 3-4 minutes.","Salmon is done when it flakes easily and reaches 145°F internal temperature.","Top each fillet with a slice of herb butter and serve with roasted asparagus and lemon wedges."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
SELECT
  u.id,
  'Caesar Salad from Scratch',
  'The real deal — homemade Caesar dressing with anchovies, raw egg yolk, and Worcestershire sauce. Crispy romaine and golden croutons.',
  'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800',
  20, 15, 4, 'medium',
  (SELECT id FROM categories WHERE name = 'Salads'),
  '["Make croutons: cube day-old bread, toss with olive oil, garlic powder, salt. Bake at 375°F for 15 minutes until golden.","Make dressing: mince anchovies and garlic into a paste. Whisk with egg yolk, Dijon mustard, and lemon juice.","Slowly drizzle in olive oil while whisking constantly to emulsify.","Stir in grated Parmesan, Worcestershire sauce, salt and pepper.","Wash and dry romaine lettuce. Tear into bite-sized pieces.","Toss romaine with dressing until well coated.","Add croutons and shaved Parmesan. Toss gently and serve immediately."]"
FROM users u WHERE u.email = 'demo@recipebox.app'
ON CONFLICT DO NOTHING;

-- Seed ingredients for the first recipe (Carbonara)
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'spaghetti', '400', 'g', 0 FROM recipes r WHERE r.title = 'Classic Spaghetti Carbonara' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'guanciale or pancetta', '200', 'g', 1 FROM recipes r WHERE r.title = 'Classic Spaghetti Carbonara' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'egg yolks', '4', '', 2 FROM recipes r WHERE r.title = 'Classic Spaghetti Carbonara' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'whole egg', '1', '', 3 FROM recipes r WHERE r.title = 'Classic Spaghetti Carbonara' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'Pecorino Romano, finely grated', '100', 'g', 4 FROM recipes r WHERE r.title = 'Classic Spaghetti Carbonara' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'freshly ground black pepper', '2', 'tsp', 5 FROM recipes r WHERE r.title = 'Classic Spaghetti Carbonara' LIMIT 1
ON CONFLICT DO NOTHING;

-- Seed ingredients for Pancakes
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'all-purpose flour', '2', 'cups', 0 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'buttermilk', '2', 'cups', 1 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'eggs', '2', 'large', 2 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'unsalted butter, melted', '4', 'tbsp', 3 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'sugar', '2', 'tbsp', 4 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'baking powder', '2', 'tsp', 5 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'baking soda', '1/2', 'tsp', 6 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order)
SELECT r.id, 'salt', '1/2', 'tsp', 7 FROM recipes r WHERE r.title = 'Fluffy Buttermilk Pancakes' LIMIT 1
ON CONFLICT DO NOTHING;
