# ABH-10 Recipe Box — Architecture Plan

## Repository assessment

Current repo state is effectively a scaffold only:
- `README.md`
- `docs/`
- `memory-bank/`
- no frontend app
- no backend app
- no database package or migrations

This should be built as a real Railway-friendly monorepo with separate web, API, and database layers.

## Proposed monorepo structure

```text
.
├─ apps/
│  ├─ web/                  # Next.js + Tailwind frontend
│  └─ api/                  # Express + TypeScript REST API
├─ packages/
│  ├─ db/                   # Prisma schema, migrations, seed script
│  ├─ shared/               # shared TS types / DTOs / constants
│  └─ config/               # shared tsconfig/eslint presets if desired
├─ docs/
│  └─ ABH-10-architect-plan.md
├─ package.json
├─ pnpm-workspace.yaml
└─ railway.json             # optional if needed for multi-service deploy hints
```

Recommended tooling:
- package manager: `pnpm`
- frontend: Next.js App Router + Tailwind CSS
- backend: Express + TypeScript
- database ORM: Prisma with PostgreSQL
- validation: Zod on API request bodies/query params
- auth: JWT access tokens with bcrypt password hashing

## 1) Frontend pages and components

### Pages / routes

Use Next.js App Router under `apps/web/app`.

1. `/`
   - main recipe grid page
   - includes search, category filter, favorites toggle, empty states
2. `/recipes/[id]`
   - recipe detail page
   - shows image, description, ingredients, instructions, category, favorite button
3. `/recipes/new`
   - add recipe form
   - authenticated route
4. `/recipes/[id]/edit`
   - edit recipe form
   - authenticated route
5. `/login`
   - email/password login form
6. `/register`
   - email/password registration form
7. optional `/favorites`
   - filtered view of favorite recipes for signed-in user

### Core frontend components

- `RecipeGrid`
- `RecipeCard`
- `RecipeSearchBar`
- `CategoryFilter`
- `FavoriteToggle`
- `RecipeDetail`
- `RecipeForm`
- `FieldInput`, `FieldTextarea`, `FieldSelect`
- `Navbar`
- `AuthForm`
- `EmptyState`
- `LoadingSkeleton`
- `ToastProvider` / feedback UI

### Frontend state/data flow

- Use server components for page shells where useful, but fetch dynamic API data through client hooks for search/filter interactivity.
- Suggested client data layer: native `fetch` plus a small wrapper, or `@tanstack/react-query` if the implementer wants caching/mutation ergonomics.
- Centralize API base URL in `apps/web/lib/api.ts`.
- Use `NEXT_PUBLIC_API_URL` for all browser-side API calls.
- Store JWT in secure HTTP-only cookie if web and API are same-site behind Railway domains, otherwise fallback to in-memory/local storage plus Authorization header.
- Public reads can work without auth; write operations and favorites require auth.

### Frontend behavior details

- Recipe grid supports:
  - text search by title/description/ingredient keywords
  - category dropdown or pill filters
  - sort by newest/title
  - optional favorites-only filter
- Add/edit form fields:
  - title
  - slug (optional auto-generated backend-side)
  - description
  - imageUrl
  - prepTimeMinutes
  - cookTimeMinutes
  - servings
  - ingredients (textarea or dynamic list)
  - instructions (textarea or dynamic ordered steps)
  - categoryId
- Detail page should include edit/delete controls only when authenticated.

## 2) Backend REST endpoints, including auth

Base API lives in `apps/api`.

### Health

- `GET /health`
  - returns service health and DB connectivity summary

### Auth endpoints

These are needed for a real full-stack app, even though the business domain focuses on recipes.

- `POST /api/auth/register`
  - create user with email + password
- `POST /api/auth/login`
  - validate credentials and return JWT (or set cookie)
- `GET /api/auth/me`
  - return current authenticated user
- `POST /api/auth/logout`
  - clear cookie / invalidate client session

### Category endpoints

- `GET /api/categories`
  - list all categories
- `GET /api/categories/:id`
  - get one category with optional recipe count
- `POST /api/categories`
  - create category (auth required)
- `PATCH /api/categories/:id`
  - update category (auth required)
- `DELETE /api/categories/:id`
  - delete category if not referenced, or reject with validation error (auth required)

### Recipe endpoints

- `GET /api/recipes`
  - list recipes
  - query params:
    - `search`
    - `categoryId`
    - `favoriteOnly`
    - `page`
    - `pageSize`
    - `sort`
- `GET /api/recipes/:id`
  - get full recipe detail
- `POST /api/recipes`
  - create recipe (auth required)
- `PATCH /api/recipes/:id`
  - update recipe (auth required)
- `DELETE /api/recipes/:id`
  - delete recipe (auth required)

### Favorites endpoints

- `GET /api/favorites`
  - current user favorite recipes (auth required)
- `POST /api/favorites/:recipeId`
  - add recipe to favorites (auth required)
- `DELETE /api/favorites/:recipeId`
  - remove recipe from favorites (auth required)

### Backend module layout

```text
apps/api/src/
├─ server.ts
├─ app.ts
├─ config/
│  └─ env.ts
├─ middleware/
│  ├─ auth.ts
│  ├─ error-handler.ts
│  └─ validate.ts
├─ routes/
│  ├─ health.routes.ts
│  ├─ auth.routes.ts
│  ├─ category.routes.ts
│  ├─ recipe.routes.ts
│  └─ favorite.routes.ts
├─ controllers/
├─ services/
├─ repositories/
└─ lib/
   ├─ prisma.ts
   ├─ jwt.ts
   └─ password.ts
```

### Backend rules

- Controllers stay thin.
- Services own business logic.
- Prisma repositories own DB queries.
- Zod validates body/query/params.
- Auth middleware protects all mutating routes and favorites routes.
- CORS must allow the deployed frontend origin and local web dev origin.

## 3) Database tables / schema

Use PostgreSQL via Prisma in `packages/db/prisma/schema.prisma`.

### Core domain tables required by scope

#### `categories`
- `id` UUID PK
- `name` text unique not null
- `slug` text unique not null
- `created_at` timestamp
- `updated_at` timestamp

#### `recipes`
- `id` UUID PK
- `title` text not null
- `slug` text unique not null
- `description` text not null
- `image_url` text nullable
- `ingredients` jsonb not null
- `instructions` jsonb not null
- `prep_time_minutes` integer nullable
- `cook_time_minutes` integer nullable
- `servings` integer nullable
- `category_id` UUID FK -> `categories.id`
- `created_by` UUID FK -> `users.id` nullable or required if auth-first
- `created_at` timestamp
- `updated_at` timestamp

#### `favorites`
- `id` UUID PK
- `user_id` UUID FK -> `users.id`
- `recipe_id` UUID FK -> `recipes.id`
- `created_at` timestamp
- unique composite `(user_id, recipe_id)`

### Required support table for real auth

#### `users`
- `id` UUID PK
- `email` text unique not null
- `password_hash` text not null
- `name` text nullable
- `created_at` timestamp
- `updated_at` timestamp

### Prisma relationships

- category `hasMany recipes`
- recipe `belongsTo category`
- user `hasMany recipes` (created recipes)
- user `hasMany favorites`
- recipe `hasMany favorites`

### Seed data

Seed script should insert:
- 4–6 categories
  - Breakfast
  - Lunch
  - Dinner
  - Dessert
  - Vegetarian
- 8–12 recipes spread across categories
- 1 demo user for local/dev login
- a few starter favorites for demo UX

## 4) Wiring: frontend -> backend -> database

### Frontend to backend

`apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Frontend API helper example responsibilities:
- construct endpoint URLs from `NEXT_PUBLIC_API_URL`
- attach JWT/cookie credentials
- normalize errors for UI

Request flow:
1. user interacts with search/filter/form UI in Next.js
2. frontend calls `${NEXT_PUBLIC_API_URL}/recipes?...`
3. frontend renders returned JSON data
4. authenticated mutations include token/cookie

### Backend to database

`apps/api/.env`

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recipe_box
JWT_SECRET=change-me
CLIENT_ORIGIN=http://localhost:3000
```

Backend flow:
1. Express receives request
2. Zod validates params/body/query
3. auth middleware resolves current user when required
4. service layer calls Prisma client
5. Prisma uses `DATABASE_URL` to read/write PostgreSQL
6. JSON response returns to frontend

### Shared types

Useful shared package contents:
- `RecipeDto`
- `CategoryDto`
- `AuthUserDto`
- request payload schemas/types for create/update operations

This avoids frontend/backend drift.

## Railway deployment shape

Use monorepo with two deployable apps and one shared package tree.

### Railway services

1. `web`
   - root dir: `apps/web`
   - build: Next.js build
   - runtime env: `NEXT_PUBLIC_API_URL=<public-api-url>/api`
2. `api`
   - root dir: `apps/api`
   - runtime env:
     - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
     - `JWT_SECRET=...`
     - `CLIENT_ORIGIN=<public-web-url>`
3. `Postgres`
   - managed Railway PostgreSQL

### Build/deploy notes

- ensure shared packages build before app builds
- generate Prisma client from `packages/db`
- API should run migrations on deploy or through a release command
- web should never read `DATABASE_URL`; only API uses it

## Implementation order for Grunt

1. Scaffold pnpm workspace and root scripts.
2. Create `packages/db` with Prisma schema, migration, and seed.
3. Create shared package for DTO/types if needed.
4. Build Express API with health, auth, categories, recipes, favorites.
5. Add env parsing and Prisma wiring.
6. Build Next.js app with Tailwind.
7. Implement recipe list/search/filter/detail/create/edit flows.
8. Wire login/register and favorite actions.
9. Add Railway config/docs and local run instructions.
10. Verify end-to-end with seeded PostgreSQL data.

## Acceptance checkpoints

Grunt should be able to demonstrate:
- `GET /health` works
- recipes list/search/filter works against PostgreSQL
- categories CRUD works through API
- recipes CRUD works through API and UI
- register/login works
- favorite/unfavorite works per authenticated user
- `NEXT_PUBLIC_API_URL` is the only frontend API base config
- `DATABASE_URL` is the backend DB connection source
- app structure is monorepo-ready for Railway

## Handoff notes for next roles

### For Grunt
- Implement exactly this as a real app, not a static mock.
- Prioritize working API + DB before polishing UI.
- Keep public read endpoints simple; protect create/update/delete + favorites with auth.

### For Pedant
- Verify env wiring, auth guards, Prisma schema integrity, and CRUD/favorites behavior.
- Check that the frontend never accesses the DB directly.

ARCHITECT_DONE: plan ready for Grunt.
