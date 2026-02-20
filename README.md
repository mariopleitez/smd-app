# SaveMyDish (`smd-app`)

SaveMyDish is an Expo + React Native app backed by Supabase.  
Current scope: auth, recipe management, private cookbooks, shopping list, and weekly meal planning.

## Features

- Email/password auth with Supabase (`signUp`, `signInWithPassword`, `signOut`).
- Password recovery flow with Supabase:
  - Request reset link from Login (`resetPasswordForEmail`).
  - Open recovery link and set a new password (`updateUser`).
  - Password visibility toggle (`eye/eye-off`) in Login, Registro, and reset screen.
- Cookbook management (`cookbooks` and `cookbook_recipes`) with private visibility per owner.
- Recipe management (`recipes`): create, edit, delete, public/private toggle, source URL, step photos, and step reorder.
- Recipe import from:
  - URL (`import-recipe-from-url`)
  - Pasted text (`import-recipe-from-text`)
  - Image/OCR (`import-recipe-from-image`)
  - Voice dictation (web speech on web + audio transcription in mobile via `transcribe-recipe-audio`)
- AI language detection + translation in recipe detail:
  - Detects recipe language with ChatGPT
  - Shows `Traducir al espanol` only when the recipe is in English
  - Translates title, description, ingredients, and steps (`translate-recipe-content`)
- Top header notifications:
  - Bell icon in the top card with unread badge
  - Notification list panel
  - Individual dismiss per notification
  - Current default notification: `Tienes n recetas sin preparar...`
- Shopping list per user (`shopping_items`), including recipe-origin metadata.
- Weekly meal plan per user/day (`meal_plans`) with `breakfast_recipe_id`, `snack_recipe_id`, `lunch_recipe_id`, and `dinner_recipe_id`.
- Per-user recipe feedback (`recipe_user_feedback`): cooked toggle, rating (0-5), and notes.
- Account closure flow:
  - Available from `Perfil` while editing profile
  - Confirmation popup with irreversible warning
  - Deletes user-owned data and user account, then logs out

## Screens and Functions (Main App)

The main app is orchestrated by `screens/PrincipalScreen.js`, with tab views split into:

- `screens/main-tabs/RecetasTabScreen.js`
- `screens/main-tabs/ListaTabScreen.js`
- `screens/main-tabs/PlanTabScreen.js`
- `screens/main-tabs/PerfilTabScreen.js`

### `Auth` (Comenzar / Login / Registro / Recuperar)

- `Comenzar`: entry point with actions for Login and Registro.
- `Login`: email/password sign-in, inline password visibility toggle, and `Olvidaste tu contrasena?`.
- `Registro`: account creation (name/email/password) with field validation and password visibility toggle.
- `RecuperarContrasenaScreen`: sends recovery email link.
- `RestablecerContrasenaScreen`: sets the new password after opening the recovery link.

### `Recetas`

- Private cookbook list and cookbook cards with prioritized image previews.
- Search with scope filters:
  - `Mis recetas`
  - `SaveMyDish` (public recipes)
  - `Todo` (own + public)
- Recipe detail view:
  - View/edit modes with cookbook-style visual card.
  - Public/private toggle.
  - Source link display (`source_url`) when available.
  - “Cooked”, rating stars, and personal notes persisted per user.
  - Step-level photo support (`additional_photos`) and step reorder.
  - Add to cookbook, add ingredients to shopping list, add recipe to meal plan.
  - More menu (`...`) with export PDF and delete.
  - Translation CTA below `...` when ChatGPT detects English content.
- Recipe create/import sheet:
  - Browser URL import
  - Camera/image OCR import
  - Paste-text import
  - Manual creation/edit form

### `Lista`

- Add/check/uncheck list items.
- Clear completed / clear all.
- Recipe-origin labels on shopping items when available.

### `Plan`

- Week navigation.
- Per-day meal slots (breakfast/snack/lunch/dinner).
- Assign/remove recipes from slots.
- “Add to plan” form:
  - Recipe picker with recent recipes and search.
  - Date modes: `Hoy`, `Mañana`, `Seleccionar cuándo` (future-only validation).
  - Meal type selector.

### `Perfil`

- Shows signed-in user name/email.
- Logout action.
- Edit profile (name/photo).
- `Cerrar Cuenta` action visible in edit mode, with destructive confirmation.

### `Top Card / Header`

- Greets user with first name (`Hola, <nombre>`).
- Uses app logo (`public/logo.png`) on the left side.
- Shows notifications bell with unread count.
- Opens a notifications panel with dismiss action per item.

## Tech Stack

- Expo `^51`
- React `18`
- React Native `0.74`
- Supabase JS `^2`
- Supabase Postgres + RLS + Edge Functions

## Project Structure

- `App.js`: root navigation/auth flow.
- `screens/`: app screens (`Login`, `Registro`, `RecuperarContrasena`, `RestablecerContrasena`, `Principal`, etc.).
- `screens/main-tabs/`: tab components rendered by `PrincipalScreen`.
- `lib/supabase.js`: Supabase client setup.
- `supabase/sql/`: SQL migrations to create tables, indexes, triggers, and RLS policies.
- `supabase/functions/import-recipe-from-url/`: import recipe from webpage URL.
- `supabase/functions/import-recipe-from-text/`: import recipe from pasted text.
- `supabase/functions/import-recipe-from-image/`: import recipe from image/OCR.
- `supabase/functions/transcribe-recipe-audio/`: transcribe recorded audio dictation to text.
- `supabase/functions/translate-recipe-content/`: detect recipe language and translate to Spanish when source is English.
- `supabase/functions/delete-user-account/`: delete user-owned data + auth user account.

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
# Optional override for auth recovery links:
# EXPO_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL=https://smd-app-seven.vercel.app
```

3. Start the app (web):

```bash
npm run start
```

Open in Chrome:

```bash
open -a "Google Chrome" http://localhost:8081
```

If port `8081` is already in use, Expo will suggest another one (for example `8082`).

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
5. In Supabase Auth settings, configure URLs:
   - `Site URL`: `https://smd-app-seven.vercel.app`
   - `Redirect URLs` (allow list):
     - `https://smd-app-seven.vercel.app`
     - `http://localhost:8081` (or your active local Expo port)

Configured values:

- Build command: `npm run build:web`
- Output directory: `dist`

Optional CLI deploy:

```bash
npx vercel
npx vercel --prod
```

## Supabase Auth URL Setup (Recovery Link)

To make "Recuperar contrasena" links work end-to-end:

1. In Supabase Dashboard -> Authentication -> URL Configuration:
   - Set `Site URL` to `https://smd-app-seven.vercel.app`.
2. Add redirect allow-list entries:
   - `https://smd-app-seven.vercel.app`
   - local URL used during development (`http://localhost:8081`, `http://localhost:8082`, etc).
3. In this app, recovery redirect resolves in this order:
   - `EXPO_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL` (if set)
   - current web origin (if not localhost)
   - fallback default: `https://smd-app-seven.vercel.app`

## Welcome Email (Signup)

To send your custom welcome email using your own SMTP (from `ana@savemydish.com`) on signup:

1. In Supabase Dashboard -> Authentication -> Email -> SMTP Settings:
   - Enable custom SMTP.
   - Set sender email to `ana@savemydish.com`.
2. In Supabase Dashboard -> Authentication -> Email Templates -> Confirm signup:
   - Subject: `Bienvenid@ a SAVE MY DISH`
   - Paste HTML from `supabase/email-templates/confirm-signup-welcome.html`
3. Keep "Confirm email" enabled in Supabase Auth so this template is sent on each new signup.

Note:
- This template includes `{{ .ConfirmationURL }}` so users can verify their email and complete account activation.

## Supabase Database Setup

Run SQL files in this order:

1. `supabase/sql/001_shopping_items.sql`
2. `supabase/sql/002_cookbooks_and_recipes.sql`
3. `supabase/sql/003_meal_plans.sql`
4. `supabase/sql/004_cookbooks_private_policies.sql`
5. `supabase/sql/005_fix_unsplash_recipe_image_urls.sql`
6. `supabase/sql/006_add_recipe_source_url.sql`
7. `supabase/sql/007_recipe_user_feedback.sql`

These scripts create tables, triggers, indexes, grants, and row-level-security policies.

## Edge Function Setup

Deploy:

```bash
supabase functions deploy import-recipe-from-url --project-ref <your-project-ref>
supabase functions deploy import-recipe-from-text --project-ref <your-project-ref>
supabase functions deploy import-recipe-from-image --project-ref <your-project-ref>
supabase functions deploy transcribe-recipe-audio --project-ref <your-project-ref>
supabase functions deploy translate-recipe-content --project-ref <your-project-ref>
supabase functions deploy delete-user-account --project-ref <your-project-ref>
```

Optional AI-assisted extraction:

```bash
supabase secrets set OPENAI_API_KEY=<your-openai-key> --project-ref <your-project-ref>
supabase secrets set OPENAI_RECIPE_MODEL=gpt-4.1-mini --project-ref <your-project-ref>
supabase secrets set OPENAI_TRANSCRIBE_MODEL=whisper-1 --project-ref <your-project-ref>
supabase secrets set OPENAI_TRANSLATE_MODEL=gpt-4.1-mini --project-ref <your-project-ref>
```

Notes:

- `OPENAI_API_KEY` is optional. Without it, extraction may be reduced depending on source quality.
- `SUPABASE_SERVICE_ROLE_KEY` is reserved by Supabase and available in Edge Functions runtime.
- Do not run `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` (CLI blocks `SUPABASE_*` names).
- The app invokes:
  - `supabase.functions.invoke('import-recipe-from-url', ...)`
  - `supabase.functions.invoke('import-recipe-from-text', ...)`
  - `supabase.functions.invoke('import-recipe-from-image', ...)`
  - `supabase.functions.invoke('transcribe-recipe-audio', ...)`
  - `supabase.functions.invoke('translate-recipe-content', ...)`
  - `supabase.functions.invoke('delete-user-account', ...)`

## Security Model

- Supabase RLS is enabled on app tables.
- Policies enforce per-user ownership on mutable records.
- Recipes can be public (`is_public = true`) or private to owner.
- Meal-plan recipe assignments are constrained so users can only assign visible recipes.

## Current Gaps

- No automated test suite is configured yet.
- No CI workflow is configured yet.
