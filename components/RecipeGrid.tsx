'use client';

import type { Recipe, Category } from '../src/types';

interface RecipeGridProps {
  recipes: Recipe[];
  loading: boolean;
  favorites: number[];
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite: (id: number) => void;
  categories: Category[];
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton skeleton-line" style={{ width: '90%' }} />
        <div className="skeleton skeleton-line" style={{ width: '75%' }} />
      </div>
    </div>
  );
}

function RecipeCard({
  recipe,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const getEmoji = () => {
    const name = (recipe.category_name || '').toLowerCase();
    if (name.includes('breakfast')) return '🥞';
    if (name.includes('lunch')) return '🥗';
    if (name.includes('dinner')) return '🍽️';
    if (name.includes('dessert')) return '🍰';
    if (name.includes('snack')) return '🍿';
    if (name.includes('soup')) return '🍲';
    if (name.includes('salad')) return '🥗';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('seafood')) return '🦞';
    return '🍳';
  };

  return (
    <div className="recipe-card" onClick={onSelect}>
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="recipe-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="recipe-card-image-placeholder">{getEmoji()}</div>
      )}
      <div className="recipe-card-body">
        <div className="recipe-card-meta">
          {recipe.difficulty && (
            <span className={`badge badge-${recipe.difficulty}`}>{recipe.difficulty}</span>
          )}
          {recipe.category_name && (
            <span className="badge badge-category">{recipe.category_name}</span>
          )}
        </div>
        <h3 className="recipe-card-title">{recipe.title}</h3>
        {recipe.description && (
          <p className="recipe-card-desc">{recipe.description}</p>
        )}
        <div className="recipe-card-footer">
          {totalTime > 0 && (
            <span className="recipe-stat">⏱️ {totalTime} min</span>
          )}
          {recipe.servings && (
            <span className="recipe-stat">👥 {recipe.servings}</span>
          )}
          <button
            className={`fav-btn btn-sm ${isFavorite ? 'active' : ''}`}
            style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '13px' }}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecipeGrid({ recipes, loading, favorites, onSelect, onToggleFavorite }: RecipeGridProps) {
  if (loading) {
    return (
      <div className="recipe-grid">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🍽️</div>
        <h3 className="empty-title">No recipes found</h3>
        <p className="empty-desc">Try adjusting your search or filters, or add a new recipe to get started.</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          isFavorite={favorites.includes(recipe.id)}
          onSelect={() => onSelect(recipe)}
          onToggleFavorite={() => onToggleFavorite(recipe.id)}
        />
      ))}
    </div>
  );
}
