'use client';

import { useState, useEffect, useCallback } from 'react';
import { RecipeGrid } from '../components/RecipeGrid';
import { RecipeDetail } from '../components/RecipeDetail';
import { RecipeForm } from '../components/RecipeForm';
import { AuthModal } from '../components/AuthModal';
import { Toast } from '../components/Toast';
import { api } from '../src/api';
import type { Recipe, Category, ToastMessage, User } from '../src/types';

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [view, setView] = useState<'grid' | 'detail'>('grid');

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('rb_user');
    const token = localStorage.getItem('rb_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`rb_favs_${user.id}`);
      if (stored) {
        try { setFavorites(JSON.parse(stored)); } catch {}
      } else {
        loadFavorites();
      }
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const data = await api.getFavorites();
      const ids = data.map((f: { recipe_id: number }) => f.recipe_id);
      setFavorites(ids);
      localStorage.setItem(`rb_favs_${user.id}`, JSON.stringify(ids));
    } catch {}
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recipesData, categoriesData] = await Promise.all([
        api.getRecipes({ q: searchQuery, category: selectedCategory ?? undefined, difficulty: selectedDifficulty ?? undefined }),
        api.getCategories(),
      ]);
      setRecipes(recipesData.data || recipesData);
      setCategories(categoriesData);
    } catch (err) {
      addToast('Failed to load recipes. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedDifficulty, addToast]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSelectRecipe = async (recipe: Recipe) => {
    try {
      const full = await api.getRecipe(recipe.id);
      setSelectedRecipe(full);
      setView('detail');
    } catch {
      addToast('Failed to load recipe details', 'error');
    }
  };

  const handleBack = () => {
    setView('grid');
    setSelectedRecipe(null);
  };

  const handleCreateRecipe = async (data: Partial<Recipe>) => {
    try {
      const created = await api.createRecipe(data);
      addToast('Recipe created successfully! 🎉', 'success');
      setShowForm(false);
      loadData();
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create recipe';
      addToast(msg, 'error');
      throw err;
    }
  };

  const handleUpdateRecipe = async (id: number, data: Partial<Recipe>) => {
    try {
      const updated = await api.updateRecipe(id, data);
      addToast('Recipe updated! ✨', 'success');
      setEditingRecipe(null);
      setShowForm(false);
      if (selectedRecipe?.id === id) {
        const full = await api.getRecipe(id);
        setSelectedRecipe(full);
      }
      loadData();
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update recipe';
      addToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    try {
      await api.deleteRecipe(id);
      addToast('Recipe deleted', 'info');
      setView('grid');
      setSelectedRecipe(null);
      loadData();
    } catch {
      addToast('Failed to delete recipe', 'error');
    }
  };

  const handleToggleFavorite = async (recipeId: number) => {
    if (!user) { setShowAuth(true); return; }
    const isFav = favorites.includes(recipeId);
    try {
      if (isFav) {
        await api.removeFavorite(recipeId);
        const updated = favorites.filter(id => id !== recipeId);
        setFavorites(updated);
        localStorage.setItem(`rb_favs_${user.id}`, JSON.stringify(updated));
        addToast('Removed from favorites', 'info');
      } else {
        await api.addFavorite(recipeId);
        const updated = [...favorites, recipeId];
        setFavorites(updated);
        localStorage.setItem(`rb_favs_${user.id}`, JSON.stringify(updated));
        addToast('Added to favorites ❤️', 'success');
      }
    } catch {
      addToast('Failed to update favorites', 'error');
    }
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('rb_user', JSON.stringify(userData));
    localStorage.setItem('rb_token', token);
    setShowAuth(false);
    addToast(`Welcome back, ${userData.display_name || userData.email}! 👋`, 'success');
    loadFavorites();
  };

  const handleLogout = () => {
    setUser(null);
    setFavorites([]);
    localStorage.removeItem('rb_user');
    localStorage.removeItem('rb_token');
    addToast('Logged out', 'info');
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const displayedRecipes = showFavoritesOnly
    ? recipes.filter(r => favorites.includes(r.id))
    : recipes;

  const getCategoryName = (id: number | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id)?.name || null;
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <button className="logo" onClick={handleBack} style={{ background: 'none', border: 'none' }}>
              <span className="logo-icon">🍳</span>
              <span>Recipe Box</span>
            </button>

            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="header-actions">
              {user ? (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setEditingRecipe(null); setShowForm(true); }}
                  >
                    + Add Recipe
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    {user.display_name || user.email.split('@')[0]}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setEditingRecipe(null); setShowForm(true); }}
                  >
                    + Add Recipe
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAuth(true)}>
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Browse</div>
            <button
              className={`filter-btn ${!selectedCategory && !showFavoritesOnly ? 'active' : ''}`}
              onClick={() => { setSelectedCategory(null); setShowFavoritesOnly(false); }}
            >
              <span>🏠</span> All Recipes
              <span className="filter-count">{recipes.length}</span>
            </button>
            {user && (
              <button
                className={`filter-btn ${showFavoritesOnly ? 'active' : ''}`}
                onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSelectedCategory(null); }}
              >
                <span>❤️</span> Favorites
                <span className="filter-count">{favorites.length}</span>
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Categories</div>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); setShowFavoritesOnly(false); }}
              >
                <span className="filter-dot" style={{ background: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Difficulty</div>
            {['easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                className={`filter-btn ${selectedDifficulty === d ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
              >
                <span className={`badge badge-${d}`} style={{ padding: '2px 8px' }}>{d}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="content">
          {view === 'grid' ? (
            <>
              <div className="content-header">
                <div>
                  <h1 className="content-title">
                    {showFavoritesOnly ? 'My Favorites' :
                      selectedCategory ? getCategoryName(selectedCategory) :
                      searchQuery ? `Results for "${searchQuery}"` : 'All Recipes'}
                  </h1>
                  <p className="content-subtitle">
                    {displayedRecipes.length} recipe{displayedRecipes.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <RecipeGrid
                recipes={displayedRecipes}
                loading={loading}
                favorites={favorites}
                onSelect={handleSelectRecipe}
                onToggleFavorite={handleToggleFavorite}
                categories={categories}
              />
            </>
          ) : selectedRecipe ? (
            <RecipeDetail
              recipe={selectedRecipe}
              isFavorite={favorites.includes(selectedRecipe.id)}
              onBack={handleBack}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
              onToggleFavorite={handleToggleFavorite}
              canEdit={!!user}
              categories={categories}
            />
          ) : null}
        </main>
      </div>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          categories={categories}
          onSubmit={editingRecipe
            ? (data) => handleUpdateRecipe(editingRecipe.id, data)
            : handleCreateRecipe
          }
          onClose={() => { setShowForm(false); setEditingRecipe(null); }}
        />
      )}

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </div>
  );
}
