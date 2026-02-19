create table if not exists public.recipe_user_feedback (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id bigint not null references public.recipes (id) on delete cascade,
  is_cooked boolean not null default false,
  rating smallint not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id),
  constraint recipe_user_feedback_rating_range check (rating >= 0 and rating <= 5)
);

create index if not exists recipe_user_feedback_recipe_idx
  on public.recipe_user_feedback (recipe_id);

drop trigger if exists trg_recipe_user_feedback_updated_at on public.recipe_user_feedback;
create trigger trg_recipe_user_feedback_updated_at
before update on public.recipe_user_feedback
for each row
execute function public.set_updated_at_timestamp();

alter table public.recipe_user_feedback enable row level security;

grant select, insert, update, delete on table public.recipe_user_feedback to authenticated;

drop policy if exists "recipe_user_feedback_select_own" on public.recipe_user_feedback;
create policy "recipe_user_feedback_select_own"
on public.recipe_user_feedback
for select
using (auth.uid() = user_id);

drop policy if exists "recipe_user_feedback_insert_own" on public.recipe_user_feedback;
create policy "recipe_user_feedback_insert_own"
on public.recipe_user_feedback
for insert
with check (auth.uid() = user_id);

drop policy if exists "recipe_user_feedback_update_own" on public.recipe_user_feedback;
create policy "recipe_user_feedback_update_own"
on public.recipe_user_feedback
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "recipe_user_feedback_delete_own" on public.recipe_user_feedback;
create policy "recipe_user_feedback_delete_own"
on public.recipe_user_feedback
for delete
using (auth.uid() = user_id);
