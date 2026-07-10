import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';
import { authMiddleware } from '../middleware/auth';
import type { Category } from '../types';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await query<Category>(
      'SELECT id, name, color, created_at FROM categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color = '#6366f1' } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    if (!colorRegex.test(color)) {
      res.status(400).json({ error: 'Color must be a valid hex color (e.g. #6366f1)' });
      return;
    }

    const existing = await queryOne<Category>('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing) {
      res.status(409).json({ error: 'A category with this name already exists' });
      return;
    }

    const [category] = await query<Category>(
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING id, name, color, created_at',
      [name.trim(), color]
    );
    res.status(201).json(category);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const category = await queryOne<Category>('SELECT id FROM categories WHERE id = $1', [id]);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await query('UPDATE recipes SET category_id = NULL WHERE category_id = $1', [id]);
    await query('DELETE FROM categories WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
