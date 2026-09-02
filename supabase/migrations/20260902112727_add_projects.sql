create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_company_id_updated_at_idx on public.projects(company_id, updated_at desc);
create index projects_customer_id_idx on public.projects(customer_id);

alter table public.calculations
  add column project_id uuid references public.projects(id) on delete restrict;

create index calculations_project_id_updated_at_idx
  on public.calculations(project_id, updated_at desc)
  where project_id is not null;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

grant select, insert, update, delete on public.projects to authenticated;

create policy "Members manage projects" on public.projects for all to authenticated
  using (app_private.is_company_member(company_id))
  with check (app_private.is_company_member(company_id));
