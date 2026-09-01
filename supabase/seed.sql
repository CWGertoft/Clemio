-- Optional local development data. Run after a developer has created at least
-- one Supabase Auth user. The first Auth user becomes owner of the demo company.
do $$
declare
  demo_owner uuid;
  demo_company uuid;
  customer_one uuid;
begin
  select id into demo_owner from auth.users order by created_at asc limit 1;
  if demo_owner is null then
    raise notice 'No Auth user found. Create a user, then run seed.sql again.';
    return;
  end if;

  insert into public.companies (
    name, organization_number, email, phone, address, postal_code, city,
    default_vat_rate, default_hourly_rate, default_material_markup, default_other_markup
  ) values (
    'Cemio Demo Construction AB', '556000-0000', 'kontakt@cemiobygg.se', '08-555 00 00',
    'Byggvägen 8', '111 22', 'Stockholm', 25, 650, 15, 0
  ) returning id into demo_company;

  insert into public.company_members (company_id, user_id, role) values (demo_company, demo_owner, 'owner');
  insert into public.labor_rates (company_id, name, unit, unit_price) values
    (demo_company, 'Snickare', 'tim', 650), (demo_company, 'Målare', 'tim', 620),
    (demo_company, 'Elektriker', 'tim', 790);
  insert into public.materials (company_id, name, unit, cost_price, markup_percent, sale_price) values
    (demo_company, 'Trall 28x120', 'm²', 240, 15, 276), (demo_company, 'Regel 45x95', 'm', 32, 15, 36.80),
    (demo_company, 'Gipsskiva', 'st', 99, 15, 113.85), (demo_company, 'Färg', 'l', 89, 15, 102.35);
  insert into public.customers (company_id, type, name, email, phone, address, postal_code, city)
    values (demo_company, 'private', 'Anna Andersson', 'anna@example.com', '070-123 45 67', 'Björkvägen 12', '114 42', 'Stockholm')
    returning id into customer_one;
  insert into public.calculations (company_id, customer_id, title, status, vat_rate, subtotal_ex_vat, vat_amount, total_inc_vat, ai_generated)
    values (demo_company, customer_one, 'Altan – Andersson', 'draft', 25, 19175, 4793.75, 23968.75, true);
end $$;
