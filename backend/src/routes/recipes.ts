import { Router, Request, Response } from 'express';
import { pool, query, queryOne } from '../db';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import type { Recipe, Ingredient } from '../types';

const router = Router();

// GET /api/recipes
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, difficulty, page = '1', limit = '12' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (q && q.trim()) {
      conditions.push(`(r.title ILIKE $${paramIdx} OR r.description ILIKE $${paramIdx})`);
      params.push(`%${q.trim()}%`);
      paramIdx++;
    }

    if (category && !isNaN(parseInt(category))) {
      conditions.push(`r.category_id = $${paramIdx}`);
      params.push(parseInt(category));
      paramIdx++;
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      conditions.push(`r.difficulty = $${paramIdx}`);
      params.push(difficulty);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM recipes r ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    const recipes = await query<Recipe>(
      `SELECT r.id, r.title, r.description, r.image_url, r.prep_time, r.cook_time,
              r.servings, r.difficulty, r.category_id, r.created_at, r.updated_at,
              c.name as category_name, c.color as category_color
       FROM recipes r
       LEFT JOIN categories c ON r.category_id = c.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: recipes,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('Get recipes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/recipes/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid recipe ID' });
      return;
    }

    const recipe = await queryOne<Recipe>(
      `SELECT r.id, r.user_id, r.title, r.description, r.image_url, r.prep_time, r.cook_time,
              r.servings, r.difficulty, r.category_id, r.instructions, r.created_at, r.updated_at,
              c.name as category_name, c.color as category_color
       FROM recipes r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.id = $1`,
      [id]
    );

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const ingredients = await query<Ingredient>(
      'SELECT id, recipe_id, name, amount, unit, sort_order FROM ingredients WHERE recipe_id = $1 ORDER BY sort_order ASC, id ASC',
      [id]
    );

    let parsedInstructions: string[];
    try {
      parsedInstructions = JSON.parse(recipe.instructions);
    } catch {
      parsedInstructions = [recipe.instructions];
    }

    res.json({ ...recipe, instructions: parsedInstructions, ingredients });
  } catch (err) {
    console.error('Get recipe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recipes
router.post('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const {
      title, description, image_url, prep_time, cook_time,
      servings, difficulty, category_id, instructions, ingredients,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (!instructions || (Array.isArray(instructions) && instructions.length === 0)) {
      res.status(400).json({ error: 'At least one instruction step is required' });
      return;
    }

    const instructionsJson = JSON.stringify(
      Array.isArray(instructions) ? instructions.filter((s: string) => s.trim()) : [instructions]
    );

    await client.query('BEGIN');

    const recipeResult = await client.query(
      `INSERT INTO recipes (user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, title, description, image_url, prep_time, cook_time, servings, difficulty, category_id, instructions, created_at, updated_at`,
      [
        req.user?.userId || null,
        title.trim(),
        description || null,
        image_url || null,
        prep_time || null,
        cook_time || null,
        servings || null,
        difficulty || null,
        category_id || null,
        instructionsJson,
      ]
    );

    const recipe = recipeResult.rows[0] as Recipe;

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i] as Ingredient;
        if (ing.name && ing.name.trim()) {
          await client.query(
            'INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES ($1, $2, $3, $4, $5)',
            [recipe.id, ing.name.trim(), ing.amount || '', ing.unit || '', ing.sort_order ?? i]
          );
        }
      }
    }

    await client.query('COMMIT');

    const fullRecipe = await queryOne<Recipe>(
      `SELECT r.*, c.name as category_name, c.color as category_color
       FROM recipes r LEFT JOIN categories c ON r.category_id = c.id WHERE r.id = $1`,
      [recipe.id]
    );

    const savedIngredients = await query<Ingredient>(
      'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY sort_order ASC',
      [recipe.id]
    );

    let parsedInstructions: string[];
    try {
      parsedInstructions = JSON.parse(fullRecipe!.instructions);
    } catch {
      parsedInstructions = [fullRecipe!.instructions];
    }

    res.status(201).json({ ...fullRecipe, instructions: parsedInstructions, ingredients: savedIngredients });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create recipe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/recipes/:id
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid recipe ID' });
      return;
    }

    const existing = await queryOne<Recipe>('SELECT id, user_id FROM recipes WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const {
      title, description, image_url, prep_time, cook_time,
      servings, difficulty, category_id, instructions, ingredients,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const instructionsJson = JSON.stringify(
      Array.isArray(instructions) ? instructions.filter((s: string) => s.trim()) : [instructions]
    );

    await client.query('BEGIN');

    await client.query(
      `UPDATE recipes SET
        title = $1, description = $2, image_url = $3, prep_time = $4, cook_time = $5,
        servings = $6, difficulty = $7, category_id = $8, instructions = $9, updated_at = NOW()
       WHERE id = $10`,
      [
        title.trim(),
        description || null,
        image_url || null,
        prep_time || null,
        cook_time || null,
        servings || null,
        difficulty || null,
        category_id || null,
        instructionsJson,
        id,
      ]
    );

    await client.query('DELETE FROM ingredients WHERE recipe_id = $1', [id]);

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i] as Ingredient;
        if (ing.name && ing.name.trim()) {
          await client.query(
            'INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES ($1, $2, $3, $4, $5)',
            [id, ing.name.trim(), ing.amount || '', ing.unit || '', ing.sort_order ?? i]
          );
        }
      }
    }

    await client.query('COMMIT');

    const fullRecipe = await queryOne<Recipe>(
      `SELECT r.*, c.name as category_name, c.color as category_color
       FROM recipes r LEFT JOIN categories c ON r.category_id = c.id WHERE r.id = $1`,
      [id]
    );

    const savedIngredients = await query<Ingredient>(
      'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    let parsedInstructions: string[];
    try {
      parsedInstructions = JSON.parse(fullRecipe!.instructions);
    } catch {
      parsedInstructions = [fullRecipe!.instructions];
    }

    res.json({ ...fullRecipe, instructions: parsedInstructions, ingredients: savedIngredients });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update recipe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid recipe ID' });
      return;
    }

    const existing = await queryOne<Recipe>('SELECT id FROM recipes WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    await query('DELETE FROM favorites WHERE recipe_id = $1', [id]);
    await query('DELETE FROM ingredients WHERE recipe_id = $1', [id]);
    await query('DELETE FROM recipes WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete recipe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
