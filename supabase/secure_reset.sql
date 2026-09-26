-- Secure organization reset. Keeps Supabase users, profiles, memberships and the organization.
create table if not exists private.organization_security (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  reset_pin_hash text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table private.organization_security enable row level security;

revoke all on private.organization_security from public, anon, authenticated;

create or replace function public.set_financial_reset_pin(new_pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target_org uuid;
begin
  if new_pin !~ '^[0-9]{4,8}$' then
    raise exception 'O PIN deve conter entre 4 e 8 algarismos.';
  end if;
  select m.organization_id into target_org
  from public.organization_members m
  where m.user_id = (select auth.uid()) and m.role = 'admin'::public.app_role
  order by m.created_at limit 1;
  if target_org is null then raise exception 'Apenas administradores podem definir o PIN.'; end if;
  insert into private.organization_security (organization_id, reset_pin_hash, updated_by, updated_at)
  values (target_org, extensions.crypt(new_pin, extensions.gen_salt('bf')), (select auth.uid()), now())
  on conflict (organization_id) do update
  set reset_pin_hash = excluded.reset_pin_hash, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.reset_financial_data(reset_pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target_org uuid; stored_hash text;
begin
  select m.organization_id into target_org
  from public.organization_members m
  where m.user_id = (select auth.uid()) and m.role = 'admin'::public.app_role
  order by m.created_at limit 1;
  if target_org is null then raise exception 'Apenas administradores podem restaurar a base.'; end if;
  select s.reset_pin_hash into stored_hash from private.organization_security s where s.organization_id = target_org;
  if stored_hash is null then raise exception 'Defina primeiro o PIN de segurança.'; end if;
  if extensions.crypt(reset_pin, stored_hash) <> stored_hash then raise exception 'PIN de segurança incorreto.'; end if;

  delete from public.financial_periods where organization_id = target_org;
  delete from public.categories where organization_id = target_org;
  delete from public.partners where organization_id = target_org;
  delete from public.company_settings where organization_id = target_org;
end;
$$;

revoke execute on function public.set_financial_reset_pin(text) from public, anon;
revoke execute on function public.reset_financial_data(text) from public, anon;
grant execute on function public.set_financial_reset_pin(text) to authenticated;
grant execute on function public.reset_financial_data(text) to authenticated;

-- Atualiza imediatamente o cache de funções exposto pela API REST.
notify pgrst, 'reload schema';
