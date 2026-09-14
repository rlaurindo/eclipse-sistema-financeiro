-- Production schema for Sistema Financeiro v2.
-- Run in a new Supabase project before creating the first application user.

create extension if not exists pgcrypto;
create schema if not exists private;

create type public.app_role as enum ('admin', 'viewer');
create type public.period_type as enum ('mensal', 'trimestral', 'semestral', 'anual');
create type public.entry_status as enum ('pago', 'pendente', 'previsto');
create type public.category_type as enum ('entry', 'expense');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  currency text not null default 'EUR' check (length(currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.company_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  default_irc_rate numeric(5,2) not null default 21 check (default_irc_rate between 0 and 100),
  default_fund_reserve_percentage numeric(5,2) not null default 20 check (default_fund_reserve_percentage between 0 and 100),
  account_current_balance numeric(15,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.financial_periods (
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

create table public.categories (
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

create table public.revenues (
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

create table public.expenses (
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

create table public.fund_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_id uuid not null references public.financial_periods(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  amount numeric(15,2) not null check (amount >= 0),
  expense_date date,
  category text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_reconciliations (
  period_id uuid primary key references public.financial_periods(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_balance numeric(15,2) not null default 0,
  advances numeric(15,2) not null default 0,
  housing_costs numeric(15,2) not null default 0,
  fuel_costs numeric(15,2) not null default 0,
  other_diffs numeric(15,2) not null default 0,
  calculated_difference numeric(15,2) not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.partner_distributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_id uuid not null references public.financial_periods(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  amount numeric(15,2) not null default 0,
  unique (period_id, partner_id)
);

create table public.invoicing_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_name text not null,
  month text not null,
  company text not null,
  project text not null,
  amount numeric(15,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index financial_periods_org_year_idx on public.financial_periods(organization_id, year desc, month desc);
create index categories_organization_id_idx on public.categories(organization_id);
create index revenues_period_id_idx on public.revenues(period_id);
create index revenues_org_date_idx on public.revenues(organization_id, entry_date desc);
create index revenues_category_id_idx on public.revenues(category_id);
create index expenses_period_id_idx on public.expenses(period_id);
create index expenses_org_date_idx on public.expenses(organization_id, expense_date desc);
create index expenses_category_id_idx on public.expenses(category_id);
create index fund_expenses_period_id_idx on public.fund_expenses(period_id);
create index bank_reconciliations_organization_id_idx on public.bank_reconciliations(organization_id);
create index partners_organization_id_idx on public.partners(organization_id);
create index partner_distributions_period_id_idx on public.partner_distributions(period_id);
create index partner_distributions_partner_id_idx on public.partner_distributions(partner_id);
create index invoicing_cycles_organization_id_idx on public.invoicing_cycles(organization_id);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function private.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_org_admin(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.role = 'admin'::public.app_role
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke execute on function private.is_org_member(uuid) from public, anon;
revoke execute on function private.is_org_admin(uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'organizations','profiles','organization_members','company_settings','financial_periods',
    'categories','revenues','expenses','fund_expenses','bank_reconciliations','partners',
    'partner_distributions','invoicing_cycles','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy profiles_select_own on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_select_member on public.organizations for select to authenticated
using ((select private.is_org_member(id)));
create policy organizations_update_admin on public.organizations for update to authenticated
using ((select private.is_org_admin(id))) with check ((select private.is_org_admin(id)));

create policy members_select_member on public.organization_members for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy members_insert_admin on public.organization_members for insert to authenticated
with check ((select private.is_org_admin(organization_id)));
create policy members_update_admin on public.organization_members for update to authenticated
using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)));
create policy members_delete_admin on public.organization_members for delete to authenticated
using ((select private.is_org_admin(organization_id)));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'company_settings','financial_periods','categories','revenues','expenses','fund_expenses',
    'bank_reconciliations','partners','partner_distributions','invoicing_cycles'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_org_member(organization_id)))', table_name || '_select_member', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_org_admin(organization_id)))', table_name || '_insert_admin', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_org_admin(organization_id))) with check ((select private.is_org_admin(organization_id)))', table_name || '_update_admin', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_org_admin(organization_id)))', table_name || '_delete_admin', table_name);
  end loop;
end $$;

create policy audit_logs_select_member on public.audit_logs for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy audit_logs_insert_admin on public.audit_logs for insert to authenticated
with check ((select private.is_org_admin(organization_id)) and user_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

