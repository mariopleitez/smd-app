alter table if exists public.recipes
add column if not exists source_url text;
