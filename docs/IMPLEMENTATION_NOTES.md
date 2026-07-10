# ABH-10 Implementation Notes

This document is the deployment/reviewer handoff for the Recipe Box implementation.

## Summary

Recipe Box was implemented as a split full-stack repository:
- a Next.js frontend at the repository root
- an Express + TypeScript backend in `backend/`
- a PostgreSQL schema + seed script in `database/schema.sql`

The feature is centered around a single primary frontend route with modal-driven create/edit/auth flows and a REST API that serves recipe, category, auth, and favorite operations.

## Frontend architecture

### Entry point
- `app/page.tsx`

### Key UI components
- `components/RecipeGrid.tsx`
- `components/RecipeDetail.tsx`
- `components/RecipeForm.tsx`
- `components/AuthModal.tsx`
- `components/Toast.tsx`

### Frontend behavior
- Loads categories and recipes from the API
- Supports search, category filter, and difficulty filter
- Switches between grid and detail views in the main page state
- Uses modal flows for auth and recipe create/edit
- Stores JWT and basic user state in local storage
- Stores favorite ids per user in local storage and syncs with the backend

### API client
- `src/api.ts`
- Expects `NEXT_PUBLIC_API_URL` to point at the backend base URL
- Sends `Authorization: Bearer <token>` automatically when a token is present

## Backend architecture

### Entry point
- `backend/src/index.ts`

### Route modules
- `backend/src/routes/auth.ts`
- `backend/src/routes/categories.ts`
- `backend/src/routes/recipes.ts`
- `backend/src/routes/favorites.ts`

### Middleware
- `backend/src/middleware/auth.ts`

### Backend behavior
- Connects to PostgreSQL through `pg`
- Exposes `/health` for service health
- Exposes auth routes at `/auth`
- Exposes domain routes under `/api/*`
- Uses JWT authentication middleware for protected operations
- Handles recipe create/update transactions with ingredient writes inside DB transactions

## Data model

The database implementation includes the requested core entities and one additional supporting table:

### Core tables
- `users`
- `categories`
- `recipes`
- `favorites`

### Supporting table
- `ingredients`

### Notable storage decisions
- Recipe instructions are stored in the `recipes.instructions` column as JSON text
- Ingredients are normalized into a dedicated `ingredients` table ordered by `sort_order`
- Categories are color-coded for UI display

## Auth and permissions

- Signup and login return a JWT plus user payload
- Favorites require authentication
- Category create/delete require authentication
- Recipe update/delete require authentication
- Recipe create currently allows optional authentication and will attach `user_id` only when a token is present

## Seed data

`database/schema.sql` seeds:
- 10 categories
- demo user: `demo@recipebox.app`
- multiple starter recipes
- starter ingredient rows for at least the first seeded recipes

## Deployment handoff

### Frontend service
- directory: repo root
- env: `NEXT_PUBLIC_API_URL`

### Backend service
- directory: `backend/`
- env:
  - `DATABASE_URL`
  - `PORT`
  - `JWT_SECRET`
  - `FRONTEND_URL`

### Database
- run `database/schema.sql` after provisioning PostgreSQL

## Reviewer checklist

- Confirm frontend can reach backend using `NEXT_PUBLIC_API_URL`
- Confirm backend starts with a valid `DATABASE_URL`
- Confirm `/health` returns success
- Confirm demo login works
- Confirm recipe list, detail, create, update, delete, and favorites flows behave as expected
- Confirm schema/seed file has been applied in the target database

## Release readiness notes

From a documentation perspective, the ABH-10 implementation is ready for automated PR completion provided the environment variables and database seed step are handled in the target environment.
