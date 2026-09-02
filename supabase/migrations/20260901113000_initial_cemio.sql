-- Cemio: secure multi-tenant calculation and quotation foundation.
-- Money is stored as exact numeric SEK; the web app calculates with integer öre.

create extension if not exists "pgcrypto";

create type public.company_role as enum ('owner', 'admin', 'member');
create type public.customer_type as enum ('private', 'company');
create type public.calculation_status as enum ('draft', 'reviewed', 'quote_created', 'archived');
create type public.calculation_item_type as enum ('labor', 'material', 'other');
create type public.quote_status as enum ('draft', 'generated', 'sent', 'accepted', 'declined', 'expired');
create type public.quote_detail_level as enum ('detailed', 'summary');
create type public.review_item_type as enum ('missing_item', 'quantity_check', 'potential_issue');
create type public.review_severity as enum ('info', 'warning', 'important');
create type public.review_item_status as enum ('pending', 'accepted', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  organization_number text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  logo_url text,
  default_vat_rate numeric(5, 2) not null default 25 check (default_vat_rate between 0 and 100),
  default_hourly_rate numeric(14, 2) not null default 0 check (default_hourly_rate >= 0),
  default_material_markup numeric(7, 2) not null default 0 check (default_material_markup between 0 and 10000),
  default_other_markup numeric(7, 2) not null default 0 check (default_other_markup between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.customer_type not null default 'private',
  name text not null check (char_length(name) between 2 and 160),
  organization_number text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.labor_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  unit text not null default 'hour',
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  sku text,
  unit text not null,
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  markup_percent numeric(7, 2) not null default 0 check (markup_percent between 0 and 10000),
  sale_price numeric(14, 2) not null default 0 check (sale_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null check (char_length(title) between 2 and 160),
  description text,
  source_input text,
  status public.calculation_status not null default 'draft',
  vat_rate numeric(5, 2) not null default 25 check (vat_rate between 0 and 100),
  subtotal_ex_vat numeric(14, 2) not null default 0 check (subtotal_ex_vat >= 0),
  vat_amount numeric(14, 2) not null default 0 check (vat_amount >= 0),
  total_inc_vat numeric(14, 2) not null default 0 check (total_inc_vat >= 0),
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calculation_items (
  id uuid primary key default gen_random_uuid(),
  calculation_id uuid not null references public.calculations(id) on delete cascade,
  type public.calculation_item_type not null,
  category text,
  name text not null check (char_length(name) between 1 and 180),
  description text,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null,
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  markup_percent numeric(7, 2) not null default 0 check (markup_percent between 0 and 10000),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  total_cost numeric(14, 2) not null default 0 check (total_cost >= 0),
  total_price numeric(14, 2) not null default 0 check (total_price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calculation_reviews (
  id uuid primary key default gen_random_uuid(),
  calculation_id uuid not null references public.calculations(id) on delete cascade,
  summary text not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table public.calculation_review_items (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.calculation_reviews(id) on delete cascade,
  type public.review_item_type not null,
  severity public.review_severity not null default 'info',
  title text not null,
  description text not null,
  suggested_action text,
  proposed_item jsonb,
  status public.review_item_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.quote_sequences (
  company_id uuid not null references public.companies(id) on delete cascade,
  year integer not null check (year between 2000 and 9999),
  next_value integer not null default 1 check (next_value > 0),
  primary key (company_id, year)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  calculation_id uuid not null references public.calculations(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  quote_number text not null,
  title text not null,
  intro_text text,
  terms text,
  detail_level public.quote_detail_level not null default 'detailed',
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  vat_amount numeric(14, 2) not null default 0 check (vat_amount >= 0),
  total numeric(14, 2) not null default 0 check (total >= 0),
  status public.quote_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quote_number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  type public.calculation_item_type not null,
  name text not null,
  description text,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  total_price numeric(14, 2) not null default 0 check (total_price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index customers_company_id_idx on public.customers(company_id);
create index labor_rates_company_id_idx on public.labor_rates(company_id);
create index materials_company_id_idx on public.materials(company_id);
create index calculations_company_id_updated_at_idx on public.calculations(company_id, updated_at desc);
create index calculation_items_calculation_id_sort_order_idx on public.calculation_items(calculation_id, sort_order);
create index quotes_company_id_created_at_idx on public.quotes(company_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger members_set_updated_at before update on public.company_members for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger labor_rates_set_updated_at before update on public.labor_rates for each row execute function public.set_updated_at();
create trigger materials_set_updated_at before update on public.materials for each row execute function public.set_updated_at();
create trigger calculations_set_updated_at before update on public.calculations for each row execute function public.set_updated_at();
create trigger calculation_items_set_updated_at before update on public.calculation_items for each row execute function public.set_updated_at();
create trigger quotes_set_updated_at before update on public.quotes for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- This function is invoked only by the Auth trigger, never by the Data API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Private functions prevent recursive RLS checks. They only answer questions
-- about the caller's own auth.uid(), and are not exposed in the public schema.
create schema if not exists app_private;

create or replace function app_private.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1 from public.company_members member
    where member.company_id = target_company_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.is_calculation_member(target_calculation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.calculations calculation
    join public.company_members member on member.company_id = calculation.company_id
    where calculation.id = target_calculation_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.is_review_member(target_review_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.calculation_reviews review
    join public.calculations calculation on calculation.id = review.calculation_id
    join public.company_members member on member.company_id = calculation.company_id
    where review.id = target_review_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.is_quote_member(target_quote_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.quotes quotation
    join public.company_members member on member.company_id = quotation.company_id
    where quotation.id = target_quote_id
      and member.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.create_company_with_owner(
  p_name text,
  p_organization_number text,
  p_email text,
  p_phone text,
  p_address text,
  p_postal_code text,
  p_city text,
  p_default_vat_rate numeric,
  p_default_hourly_rate numeric,
  p_default_material_markup numeric,
  p_default_other_markup numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  new_company_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  insert into public.companies (
    name, organization_number, email, phone, address, postal_code, city,
    default_vat_rate, default_hourly_rate, default_material_markup, default_other_markup
  ) values (
    p_name, nullif(p_organization_number, ''), nullif(p_email, ''), nullif(p_phone, ''),
    nullif(p_address, ''), nullif(p_postal_code, ''), nullif(p_city, ''),
    p_default_vat_rate, p_default_hourly_rate, p_default_material_markup, p_default_other_markup
  ) returning id into new_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (new_company_id, (select auth.uid()), 'owner');

  return new_company_id;
end;
$$;

create or replace function app_private.next_quote_number(target_company_id uuid, quote_year integer default extract(year from now())::integer)
returns text
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  issued_number integer;
begin
  if (select auth.uid()) is null or not app_private.is_company_member(target_company_id) then
    raise exception 'Not authorized';
  end if;

  insert into public.quote_sequences as sequence (company_id, year, next_value)
  values (target_company_id, quote_year, 2)
  on conflict (company_id, year)
  do update set next_value = sequence.next_value + 1
  returning next_value - 1 into issued_number;

  return quote_year::text || '-' || lpad(issued_number::text, 3, '0');
end;
$$;

revoke all on function app_private.is_company_member(uuid) from public;
revoke all on function app_private.is_calculation_member(uuid) from public;
revoke all on function app_private.is_review_member(uuid) from public;
revoke all on function app_private.is_quote_member(uuid) from public;
revoke all on function app_private.create_company_with_owner(text, text, text, text, text, text, text, numeric, numeric, numeric, numeric) from public;
revoke all on function app_private.next_quote_number(uuid, integer) from public;
grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

-- RPC entry points must be in the public API schema. They expose only the
-- narrowly scoped, auth-checked operations above; anon and PUBLIC have none.
create or replace function public.create_company_with_owner(
  p_name text,
  p_organization_number text,
  p_email text,
  p_phone text,
  p_address text,
  p_postal_code text,
  p_city text,
  p_default_vat_rate numeric,
  p_default_hourly_rate numeric,
  p_default_material_markup numeric,
  p_default_other_markup numeric
)
returns uuid
language sql
security invoker
set search_path = public, app_private, pg_catalog
as $$
  select app_private.create_company_with_owner(
    p_name, p_organization_number, p_email, p_phone, p_address, p_postal_code, p_city,
    p_default_vat_rate, p_default_hourly_rate, p_default_material_markup, p_default_other_markup
  );
$$;

create or replace function public.next_quote_number(target_company_id uuid, quote_year integer default extract(year from now())::integer)
returns text
language sql
security invoker
set search_path = public, app_private, pg_catalog
as $$
  select app_private.next_quote_number(target_company_id, quote_year);
$$;

revoke all on function public.create_company_with_owner(text, text, text, text, text, text, text, numeric, numeric, numeric, numeric) from public, anon;
revoke all on function public.next_quote_number(uuid, integer) from public, anon;
grant execute on function public.create_company_with_owner(text, text, text, text, text, text, text, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function public.next_quote_number(uuid, integer) to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.customers enable row level security;
alter table public.labor_rates enable row level security;
alter table public.materials enable row level security;
alter table public.calculations enable row level security;
alter table public.calculation_items enable row level security;
alter table public.calculation_reviews enable row level security;
alter table public.calculation_review_items enable row level security;
alter table public.quote_sequences enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select, insert, update, delete on public.profiles, public.companies, public.company_members, public.customers, public.labor_rates, public.materials, public.calculations, public.calculation_items, public.calculation_reviews, public.calculation_review_items, public.quotes, public.quote_items to authenticated;

create policy "Users manage their own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Members can view their companies" on public.companies for select to authenticated
  using (app_private.is_company_member(id));
create policy "Members can update their companies" on public.companies for update to authenticated
  using (app_private.is_company_member(id)) with check (app_private.is_company_member(id));
create policy "Members can view memberships" on public.company_members for select to authenticated
  using ((select auth.uid()) = user_id or app_private.is_company_member(company_id));

create policy "Members manage customers" on public.customers for all to authenticated
  using (app_private.is_company_member(company_id)) with check (app_private.is_company_member(company_id));
create policy "Members manage labor rates" on public.labor_rates for all to authenticated
  using (app_private.is_company_member(company_id)) with check (app_private.is_company_member(company_id));
create policy "Members manage materials" on public.materials for all to authenticated
  using (app_private.is_company_member(company_id)) with check (app_private.is_company_member(company_id));
create policy "Members manage calculations" on public.calculations for all to authenticated
  using (app_private.is_company_member(company_id)) with check (app_private.is_company_member(company_id));
create policy "Members manage calculation items" on public.calculation_items for all to authenticated
  using (app_private.is_calculation_member(calculation_id)) with check (app_private.is_calculation_member(calculation_id));
create policy "Members manage calculation reviews" on public.calculation_reviews for all to authenticated
  using (app_private.is_calculation_member(calculation_id)) with check (app_private.is_calculation_member(calculation_id));
create policy "Members manage review items" on public.calculation_review_items for all to authenticated
  using (app_private.is_review_member(review_id)) with check (app_private.is_review_member(review_id));
create policy "Members manage their quote sequences" on public.quote_sequences for all to authenticated
  using (app_private.is_company_member(company_id)) with check (app_private.is_company_member(company_id));
create policy "Members manage quotes" on public.quotes for all to authenticated
  using (app_private.is_company_member(company_id)) with check (app_private.is_company_member(company_id));
create policy "Members manage quote items" on public.quote_items for all to authenticated
  using (app_private.is_quote_member(quote_id)) with check (app_private.is_quote_member(quote_id));

-- Company logo bucket. The object key must begin with the member's company UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-assets', 'company-assets', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "Members read company assets" on storage.objects for select to authenticated
  using (bucket_id = 'company-assets' and app_private.is_company_member((storage.foldername(name))[1]::uuid));
create policy "Members upload company assets" on storage.objects for insert to authenticated
  with check (bucket_id = 'company-assets' and app_private.is_company_member((storage.foldername(name))[1]::uuid));
create policy "Members update company assets" on storage.objects for update to authenticated
  using (bucket_id = 'company-assets' and app_private.is_company_member((storage.foldername(name))[1]::uuid))
  with check (bucket_id = 'company-assets' and app_private.is_company_member((storage.foldername(name))[1]::uuid));
create policy "Members delete company assets" on storage.objects for delete to authenticated
  using (bucket_id = 'company-assets' and app_private.is_company_member((storage.foldername(name))[1]::uuid));
