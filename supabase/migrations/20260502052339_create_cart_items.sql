-- Cart items for both anonymous and registered shoppers.
--
-- Every visitor obtains an auth.users row (via anonymous sign-in for guests),
-- so user_id is never nullable and RLS reduces to user_id = auth.uid().
--
-- product_id / status_id / grade_id / warranty_id reference rows in the
-- catalog database (a separate database from this Supabase project), so
-- they cannot be enforced as foreign keys here.

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id int not null,
  status_id int not null,
  grade_id int not null,
  warranty_id int,
  quantity int not null check (quantity > 0),
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.cart_items.product_id is
  'Product primary key in the catalog database. No enforceable FK because the catalog lives in a separate database.';
comment on column public.cart_items.status_id is
  'Catalog status id (e.g. New, Open Box, Like New) from the catalog database. No enforceable FK across databases.';
comment on column public.cart_items.grade_id is
  'Catalog grade id (e.g. A, B, X) from the catalog database. No enforceable FK across databases.';
comment on column public.cart_items.warranty_id is
  'Optional warranty id from the catalog database. NULL means no warranty selected. No enforceable FK across databases.';

-- Uniqueness: one row per (user, product, status, grade, warranty).
-- Re-adding the same configuration increments quantity instead of inserting.
-- NULLS NOT DISTINCT (Postgres 15+) makes (..., warranty_id IS NULL) collide
-- with another (..., warranty_id IS NULL) row, which is what we want here.
create unique index cart_items_user_variant_uidx
  on public.cart_items (user_id, product_id, status_id, grade_id, warranty_id)
  nulls not distinct;

-- Cart-listing query path: most-recent items first for a given user.
create index cart_items_user_added_at_idx
  on public.cart_items (user_id, added_at desc);

-- Auto-maintain updated_at on UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- Row-level security.
--
-- Plain-English policy: a user (anonymous or registered) can only see and
-- modify cart rows whose user_id matches their own auth.uid(). Anonymous
-- users authenticated via signInAnonymously() arrive as the `authenticated`
-- role, so a single set of policies on `authenticated` covers both. The
-- `anon` role (no session at all) is intentionally excluded -- visitors must
-- have a session to touch the cart.
alter table public.cart_items enable row level security;

create policy "Users can read their own cart items"
  on public.cart_items
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own cart items"
  on public.cart_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own cart items"
  on public.cart_items
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own cart items"
  on public.cart_items
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Add-or-increment helper.
--
-- supabase-js's .upsert() generates INSERT ... ON CONFLICT DO UPDATE SET
-- <all columns> = EXCLUDED.<all columns>, which would replace quantity
-- instead of incrementing it. This RPC keeps the increment semantics
-- documented in the cart helpers module. SECURITY INVOKER (default) is
-- sufficient because RLS already allows the user to insert/select/update
-- their own rows.
create or replace function public.add_cart_item(
  p_product_id int,
  p_status_id int,
  p_grade_id int,
  p_warranty_id int,
  p_quantity int
)
returns public.cart_items
language plpgsql
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.cart_items;
begin
  if v_user_id is null then
    raise exception 'add_cart_item requires an authenticated session';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'add_cart_item requires quantity > 0';
  end if;

  insert into public.cart_items as ci
    (user_id, product_id, status_id, grade_id, warranty_id, quantity)
  values
    (v_user_id, p_product_id, p_status_id, p_grade_id, p_warranty_id, p_quantity)
  on conflict (user_id, product_id, status_id, grade_id, warranty_id)
  do update set
    quantity = ci.quantity + excluded.quantity,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_cart_item(int, int, int, int, int) from public;
grant execute on function public.add_cart_item(int, int, int, int, int) to authenticated;
