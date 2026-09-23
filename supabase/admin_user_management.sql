-- Run once in the Supabase SQL Editor.
-- Existing Auth users become administrators. New users are created by the
-- admin-users Edge Function with the role selected in the control panel.

insert into public.profiles (id, name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role)
select o.id, u.id, 'admin'::public.app_role
from (
  select id
  from public.organizations
  order by created_at, id
  limit 1
) o
cross join auth.users u
on conflict (organization_id, user_id)
do update set role = 'admin'::public.app_role;

select
  u.email,
  m.role,
  m.organization_id
from public.organization_members m
join auth.users u on u.id = m.user_id
order by u.email;
