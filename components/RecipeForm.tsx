'use client';

import { useState, useEffect } from 'react';
import type { Recipe, Category, Ingredient } from '../src/types';

interface RecipeFormProps {
  recipe?: Recipe | null;
  categories: Category[];
  onSubmit: (data: Partial<Recipe>) => Promise<unknown>;
  onClose: () => void;
}

const EMPTY_INGREDIENT: Ingredient = { name: '', amount: '', unit: '', sort_order: 0 };

export function RecipeForm({ recipe, categories, onSubmit, onClose }: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [prepTime, setPrepTime] = useState<string>('');
  const [cookTime, setCookTime] = useState<string>('');
  const [servings, setServings] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [categoryId, setCategoryId] = useState<string>('');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ...EMPTY_INGREDIENT }]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || '');
      setDescription(recipe.description || '');
      setImageUrl(recipe.image_url || '');
      setPrepTime(recipe.prep_time != null ? String(recipe.prep_time) : '');
      setCookTime(recipe.cook_time != null ? String(recipe.cook_time) : '');
      setServings(recipe.servings != null ? String(recipe.servings) : '');
      setDifficulty(recipe.difficulty || 'medium');
      setCategoryId(recipe.category_id != null ? String(recipe.category_id) : '');
      const instr = Array.isArray(recipe.instructions)
        ? recipe.instructions
        : (() => { try { return JSON.parse(recipe.instructions as string); } catch { return [recipe.instructions as string]; } })();
      setInstructions(instr.length > 0 ? instr : ['']);
      setIngredients(recipe.ingredients && recipe.ingredients.length > 0
        ? recipe.ingredients.map(i => ({ name: i.name, amount: i.amount || '', unit: i.unit || '', sort_order: i.sort_order || 0 }))
        : [{ ...EMPTY_INGREDIENT }]
      );
    }
  }, [recipe]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (instructions.filter(s => s.trim()).length === 0) e.instructions = 'At least one instruction step is required';
    if (ingredients.filter(i => i.name.trim()).length === 0) e.ingredients = 'At least one ingredient is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        difficulty,
        category_id: categoryId ? parseInt(categoryId) : null,
        instructions: instructions.filter(s => s.trim()),
        ingredients: ingredients.filter(i => i.name.trim()).map((ing, idx) => ({ ...ing, sort_order: idx })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addIngredient = () => setIngredients(prev => [...prev, { ...EMPTY_INGREDIENT }]);
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  };

  const addStep = () => setInstructions(prev => [...prev, '']);
  const removeStep = (i: number) => setInstructions(prev => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, value: string) => {
    setInstructions(prev => prev.map((s, idx) => idx === i ? value : s));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{recipe ? '✏️ Edit Recipe' : '🍳 New Recipe'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Classic Spaghetti Carbonara"
              />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief description of this recipe..."
                rows={2}
              />
            </div>

            {/* Image URL */}
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                className="form-input"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ marginTop: 8, height: 120, width: '100%', objectFit: 'cover', borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>

            {/* Meta row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">No category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-input" value={difficulty} onChange={e => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prep Time (min)</label>
                <input type="number" className="form-input" value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="15" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Cook Time (min)</label>
                <input type="number" className="form-input" value={cookTime} onChange={e => setCookTime(e.target.value)} placeholder="30" min="0" />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: 200 }}>
              <label className="form-label">Servings</label>
              <input type="number" className="form-input" value={servings} onChange={e => setServings(e.target.value)} placeholder="4" min="1" />
            </div>

            {/* Ingredients */}
            <div className="form-group">
              <label className="form-label">Ingredients *</label>
              {errors.ingredients && <p className="form-error" style={{ marginBottom: 8 }}>{errors.ingredients}</p>}
              <div style={{ marginBottom: 4, display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 4 }}>
                <span style={{ flex: '0 0 80px' }}>Amount</span>
                <span style={{ flex: '0 0 80px' }}>Unit</span>
                <span style={{ flex: 1 }}>Ingredient name</span>
              </div>
              {ingredients.map((ing, i) => (
                <div key={i} className="ingredient-row">
                  <input
                    className="form-input amount"
                    placeholder="2"
                    value={ing.amount}
                    onChange={e => updateIngredient(i, 'amount', e.target.value)}
                    style={{ flex: '0 0 80px' }}
                  />
                  <input
                    className="form-input unit"
                    placeholder="cups"
                    value={ing.unit}
                    onChange={e => updateIngredient(i, 'unit', e.target.value)}
                    style={{ flex: '0 0 80px' }}
                  />
                  <input
                    className="form-input"
                    placeholder="e.g. all-purpose flour"
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                  />
                  {ingredients.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeIngredient(i)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addIngredient}>+ Add Ingredient</button>
            </div>

            {/* Instructions */}
            <div className="form-group">
              <label className="form-label">Instructions *</label>
              {errors.instructions && <p className="form-error" style={{ marginBottom: 8 }}>{errors.instructions}</p>}
              {instructions.map((step, i) => (
                <div key={i} className="step-row">
                  <div className="step-number">{i + 1}</div>
                  <textarea
                    className="form-input"
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}...`}
                    rows={2}
                  />
                  {instructions.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeStep(i)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addStep}>+ Add Step</button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : recipe ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
