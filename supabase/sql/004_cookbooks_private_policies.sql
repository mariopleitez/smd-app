-- Cookbooks must be private: only owner can read them.
drop policy if exists "cookbooks_select_public" on public.cookbooks;
drop policy if exists "cookbooks_select_own" on public.cookbooks;
create policy "cookbooks_select_own"
on public.cookbooks
for select
using (auth.uid() = owner_user_id);

-- Cookbook links should also be private to cookbook owner.
drop policy if exists "cookbook_recipes_select_visible" on public.cookbook_recipes;
drop policy if exists "cookbook_recipes_select_owner" on public.cookbook_recipes;
create policy "cookbook_recipes_select_owner"
on public.cookbook_recipes
for select
using (
  exists (
    select 1
    from public.cookbooks c
    where c.id = cookbook_id
      and c.owner_user_id = auth.uid()
  )
);
