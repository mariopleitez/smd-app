# SaveMyDish (`smd-app`)

SaveMyDish is an Expo + React Native app backed by Supabase.  
Current scope: auth, recipe management, cookbooks, shopping list, and weekly meal planning.

## Features

- Email/password auth with Supabase (`signUp`, `signInWithPassword`, `signOut`).
- Cookbook management (`cookbooks` and `cookbook_recipes`).
- Recipe management (`recipes`), including manual creation and editing.
- URL-based import through the `import-recipe-from-url` Supabase Edge Function.
- Shopping list per user (`shopping_items`).
- Weekly meal plan per user/day (`meal_plans`) with `breakfast_recipe_id`, `snack_recipe_id`, `lunch_recipe_id`, and `dinner_recipe_id`.

## Tech Stack

- Expo `^51`
- React `18`
- React Native `0.74`
- Supabase JS `^2`
- Supabase Postgres + RLS + Edge Functions

## Project Structure

- `App.js`: root navigation/auth flow.
- `screens/`: app screens (`Login`, `Registro`, `Principal`, etc.).
- `lib/supabase.js`: Supabase client setup.
- `supabase/sql/`: SQL migrations to create tables, indexes, triggers, and RLS policies.
- `supabase/functions/import-recipe-from-url/`: Edge Function for recipe import from URLs.

## Prerequisites

- Node.js 18+ (recommended: current LTS)
- npm
- Supabase project

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

3. Start the app (web):

```bash
npm run start
```

Other scripts:

- `npm run web`
- `npm run start:clear`
- `npm run web:clear`
- `npm run android`
- `npm run ios`
- `npm run build:web`

## Deploy on Vercel

This repo is configured for Vercel static deployment using `vercel.json`.

1. Push your branch to GitHub/GitLab/Bitbucket.
2. In Vercel, create a new project and import this repo.
3. Set environment variables in Vercel Project Settings -> Environment Variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

4. Deploy.
5. In Supabase Auth settings, set your Vercel URL as `Site URL` (for example `https://<your-project>.vercel.app`).

Configured values:

- Build command: `npm run build:web`
- Output directory: `dist`

Optional CLI deploy:

```bash
npx vercel
npx vercel --prod
```

## Supabase Database Setup

Run SQL files in this order:

1. `supabase/sql/001_shopping_items.sql`
2. `supabase/sql/002_cookbooks_and_recipes.sql`
3. `supabase/sql/003_meal_plans.sql`

These scripts create tables, triggers, indexes, grants, and row-level-security policies.

## Edge Function Setup (Recipe Import)

Deploy:

```bash
supabase functions deploy import-recipe-from-url --project-ref <your-project-ref>
```

Optional AI-assisted extraction:

```bash
supabase secrets set OPENAI_API_KEY=<your-openai-key> --project-ref <your-project-ref>
supabase secrets set OPENAI_RECIPE_MODEL=gpt-4.1-mini --project-ref <your-project-ref>
```

Notes:

- `OPENAI_API_KEY` is optional. Without it, the function still attempts structured HTML extraction.
- The app calls this function with `supabase.functions.invoke('import-recipe-from-url', ...)`.

## Security Model

- Supabase RLS is enabled on app tables.
- Policies enforce per-user ownership on mutable records.
- Recipes can be public (`is_public = true`) or private to owner.
- Meal-plan recipe assignments are constrained so users can only assign visible recipes.

## Current Gaps

- No automated test suite is configured yet.
- No CI workflow is configured yet.
