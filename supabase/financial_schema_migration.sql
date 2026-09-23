-- Financial tables required by the production frontend and historical import.
-- Safe to run after admin_user_management.sql. Does not insert demo data.

do $$ begin
  create type public.period_type as enum ('mensal', 'trimestral', 'semestral', 'anual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_status as enum ('pago', 'pendente', 'previsto');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.category_type as enum ('entry', 'expense');
exception when duplicate_object then null;
end $$;

create table if not exists public.company_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  default_irc_rate numeric(5,2) not null default 21 check (default_irc_rate between 0 and 100),
  default_fund_reserve_percentage numeric(5,2) not null default 20 check (default_fund_reserve_percentage between 0 and 100),
  account_current_balance numeric(15,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  period_type public.period_type not null default 'mensal',
  year integer not null check (year between 2000 and 2200),
  month smallint check (month between 1 and 12),
  company_account_fund_balance numeric(15,2) not null default 0,
  fund_value_reserve numeric(15,2) not null default 0,
  consignation_reserve_note text,
  irc_estimated_tax numeric(15,2),
  compensation_difference numeric(15,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, period_type, year, month)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  type public.category_type not null,
  color text,
  icon text,
  description text,
  created_at timestamptz not null default now(),
  unique (organization_id, type, name)
);

create table if not exists public.revenues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_id uuid not null references public.financial_periods(id) on delete cascade,
  entry_date date,
  client text not null check (length(trim(client)) > 0),
  project text,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  amount numeric(15,2) not null check (amount >= 0),
  status public.entry_status not null default 'previsto',
  payment_method text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_id uuid not null references public.financial_periods(id) on delete cascade,
  expense_date date,
  category_id uuid references public.categories(id) on delete set null,
  subcategory text,
  name text not null check (length(trim(name)) > 0),
  amount numeric(15,2) not null check (amount >= 0),
  payment_method text,
  note text,
  paid_from_fund boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists financial_periods_org_year_idx on public.financial_periods(organization_id, year desc, month desc);
create index if not exists categories_organization_id_idx on public.categories(organization_id);
create index if not exists revenues_period_id_idx on public.revenues(period_id);
create index if not exists revenues_org_date_idx on public.revenues(organization_id, entry_date desc);
create index if not exists revenues_category_id_idx on public.revenues(category_id);
create index if not exists expenses_period_id_idx on public.expenses(period_id);
create index if not exists expenses_org_date_idx on public.expenses(organization_id, expense_date desc);
create index if not exists expenses_category_id_idx on public.expenses(category_id);
create index if not exists partners_organization_id_idx on public.partners(organization_id);

alter table public.company_settings enable row level security;
alter table public.financial_periods enable row level security;
alter table public.categories enable row level security;
alter table public.revenues enable row level security;
alter table public.expenses enable row level security;
alter table public.partners enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['company_settings','financial_periods','categories','revenues','expenses','partners'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = table_name || '_select_member') then
      execute format('create policy %I on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name || '_select_member', table_name);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = table_name || '_insert_admin') then
      execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_org_admin(organization_id)))', table_name || '_insert_admin', table_name);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = table_name || '_update_admin') then
      execute format('create policy %I on public.%I for update to authenticated using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)))', table_name || '_update_admin', table_name);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = table_name and policyname = table_name || '_delete_admin') then
      execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_org_admin(organization_id)))', table_name || '_delete_admin', table_name);
    end if;
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.company_settings, public.financial_periods, public.categories, public.revenues, public.expenses, public.partners to authenticated;
