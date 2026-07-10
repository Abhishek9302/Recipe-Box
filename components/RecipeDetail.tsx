'use client';

import { useState } from 'react';
import type { Recipe, Category } from '../src/types';

interface RecipeDetailProps {
  recipe: Recipe;
  isFavorite: boolean;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  canEdit: boolean;
  categories: Category[];
}

export function RecipeDetail({
  recipe,
  isFavorite,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
  canEdit,
}: RecipeDetailProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const instructions: string[] = (() => {
    if (Array.isArray(recipe.instructions)) return recipe.instructions;
    try { return JSON.parse(recipe.instructions as string); } catch { return [recipe.instructions as string]; }
  })();

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const getEmoji = () => {
    const name = (recipe.category_name || '').toLowerCase();
    if (name.includes('breakfast')) return '🥞';
    if (name.includes('dessert')) return '🍰';
    if (name.includes('soup')) return '🍲';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('seafood')) return '🦞';
    return '🍳';
  };

  return (
    <div className="recipe-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to recipes
      </button>

      {recipe.image_url ? (
        <img src={recipe.image_url} alt={recipe.title} className="recipe-detail-image"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="recipe-detail-image-placeholder">{getEmoji()}</div>
      )}

      <div className="detail-actions">
        <button
          className={`fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(recipe.id)}
        >
          {isFavorite ? '❤️ Saved' : '🤍 Save'}
        </button>
        {canEdit && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(recipe)}>
              ✏️ Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(true)}>
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      <div className="recipe-card-meta" style={{ marginBottom: '12px' }}>
        {recipe.difficulty && (
          <span className={`badge badge-${recipe.difficulty}`}>{recipe.difficulty}</span>
        )}
        {recipe.category_name && (
          <span className="badge badge-category">{recipe.category_name}</span>
        )}
      </div>

      <h1 className="recipe-detail-title">{recipe.title}</h1>
      {recipe.description && (
        <p className="recipe-detail-desc">{recipe.description}</p>
      )}

      <div className="recipe-stats-bar">
        {recipe.prep_time != null && recipe.prep_time > 0 && (
          <div className="recipe-stat-item">
            <span className="recipe-stat-value">{recipe.prep_time}</span>
            <span className="recipe-stat-label">Prep (min)</span>
          </div>
        )}
        {recipe.cook_time != null && recipe.cook_time > 0 && (
          <div className="recipe-stat-item">
            <span className="recipe-stat-value">{recipe.cook_time}</span>
            <span className="recipe-stat-label">Cook (min)</span>
          </div>
        )}
        {totalTime > 0 && (
          <div className="recipe-stat-item">
            <span className="recipe-stat-value">{totalTime}</span>
            <span className="recipe-stat-label">Total (min)</span>
          </div>
        )}
        {recipe.servings && (
          <div className="recipe-stat-item">
            <span className="recipe-stat-value">{recipe.servings}</span>
            <span className="recipe-stat-label">Servings</span>
          </div>
        )}
      </div>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="recipe-section">
          <h2 className="recipe-section-title">🧂 Ingredients</h2>
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="ingredient-item">
              <span className="ingredient-amount">{ing.amount}</span>
              <span className="ingredient-unit">{ing.unit}</span>
              <span>{ing.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="recipe-section">
        <h2 className="recipe-section-title">📋 Instructions</h2>
        {instructions.map((step, i) => (
          <div key={i} className="step-item">
            <div className="step-num">{i + 1}</div>
            <p className="step-text">{step}</p>
          </div>
        ))}
      </div>

      {/* Confirm Delete */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3 className="confirm-title">Delete Recipe?</h3>
            <p className="confirm-desc">
              Are you sure you want to delete &ldquo;{recipe.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { onDelete(recipe.id); setShowConfirm(false); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
