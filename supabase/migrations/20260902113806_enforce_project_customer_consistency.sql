create or replace function app_private.enforce_project_customer_consistency()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  customer_company_id uuid;
begin
  select company_id into customer_company_id
  from public.customers
  where id = new.customer_id;

  if customer_company_id is null or customer_company_id is distinct from new.company_id then
    raise exception 'Project customer must belong to the same company';
  end if;

  return new;
end;
$$;

create trigger projects_enforce_customer_company
  before insert or update of company_id, customer_id on public.projects
  for each row execute function app_private.enforce_project_customer_consistency();

create or replace function app_private.enforce_calculation_project_consistency()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  project_company_id uuid;
  project_customer_id uuid;
begin
  if new.project_id is null then
    return new;
  end if;

  select company_id, customer_id into project_company_id, project_customer_id
  from public.projects
  where id = new.project_id;

  if project_company_id is null
    or project_company_id is distinct from new.company_id
    or project_customer_id is distinct from new.customer_id then
    raise exception 'Calculation project, company, and customer must match';
  end if;

  return new;
end;
$$;

create trigger calculations_enforce_project_consistency
  before insert or update of company_id, customer_id, project_id on public.calculations
  for each row execute function app_private.enforce_calculation_project_consistency();

revoke all on function app_private.enforce_project_customer_consistency() from public, anon, authenticated;
revoke all on function app_private.enforce_calculation_project_consistency() from public, anon, authenticated;
