import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { Favorite } from '../types';

const router = Router();

// GET /api/favorites
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const favorites = await query<Favorite>(
      'SELECT id, user_id, recipe_id, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(favorites);
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/favorites
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { recipe_id } = req.body;

    if (!recipe_id || isNaN(parseInt(recipe_id))) {
      res.status(400).json({ error: 'Valid recipe_id is required' });
      return;
    }

    const recipeId = parseInt(recipe_id);

    const existing = await queryOne<Favorite>(
      'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    if (existing) {
      res.status(409).json({ error: 'Recipe already in favorites' });
      return;
    }

    const [favorite] = await query<Favorite>(
      'INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2) RETURNING id, user_id, recipe_id, created_at',
      [userId, recipeId]
    );

    res.status(201).json(favorite);
  } catch (err) {
    console.error('Add favorite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/favorites/:recipeId
router.delete('/:recipeId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const recipeId = parseInt(req.params.recipeId);

    if (isNaN(recipeId)) {
      res.status(400).json({ error: 'Invalid recipe ID' });
      return;
    }

    const existing = await queryOne<Favorite>(
      'SELECT id FROM favorites WHERE user_id = $1 AND recipe_id = $2',
      [userId, recipeId]
    );

    if (!existing) {
      res.status(404).json({ error: 'Favorite not found' });
      return;
    }

    await query('DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2', [userId, recipeId]);
    res.status(204).send();
  } catch (err) {
    console.error('Remove favorite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
