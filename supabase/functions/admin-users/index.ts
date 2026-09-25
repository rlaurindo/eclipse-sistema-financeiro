import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.116.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) return json({ error: 'Configuração de autenticação inválida.' }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) return json({ error: 'Sessão inválida.' }, 401);

  const { data: membership, error: membershipError } = await adminClient
    .from('organization_members')
    .select('organization_id,role')
    .eq('user_id', callerData.user.id)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) return json({ error: 'Apenas administradores podem gerir utilizadores.' }, 403);

  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'list') {
    const { data: members, error } = await adminClient
      .from('organization_members')
      .select('user_id,role,created_at,profiles(name)')
      .eq('organization_id', membership.organization_id)
      .order('created_at');
    if (error) return json({ error: error.message }, 400);

    const users = [];
    for (const member of members || []) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(member.user_id);
      if (!authUser.user) continue;
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      users.push({
        id: member.user_id,
        email: authUser.user.email,
        name: profile?.name || authUser.user.user_metadata?.name || '',
        role: member.role,
        createdAt: authUser.user.created_at,
        lastLoginAt: authUser.user.last_sign_in_at,
      });
    }
    return json({ users });
  }

  if (action === 'create') {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role === 'admin' ? 'admin' : 'viewer';
    if (!name || !email || password.length < 8) return json({ error: 'Informe nome, email e uma palavra-passe com pelo menos 8 caracteres.' }, 400);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, first_access_completed: false },
    });
    if (createError || !created.user) return json({ error: createError?.message || 'Não foi possível criar o utilizador.' }, 400);

    const { error: profileError } = await adminClient.from('profiles').upsert({ id: created.user.id, name });
    const { error: memberError } = await adminClient.from('organization_members').upsert({
      organization_id: membership.organization_id,
      user_id: created.user.id,
      role,
    });
    if (profileError || memberError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError?.message || memberError?.message || 'Não foi possível atribuir o acesso.' }, 400);
    }
    return json({ id: created.user.id });
  }

  const userId = String(body.userId || '');
  if (!userId) return json({ error: 'Utilizador inválido.' }, 400);
  if (userId === callerData.user.id && action === 'delete') return json({ error: 'Não pode remover a própria conta.' }, 400);

  const { data: targetMembership } = await adminClient
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', membership.organization_id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!targetMembership) return json({ error: 'Utilizador não pertence a esta organização.' }, 404);

  if (action === 'update') {
    const role = body.role === 'admin' ? 'admin' : 'viewer';
    const { error } = await adminClient.from('organization_members').update({ role }).eq('organization_id', membership.organization_id).eq('user_id', userId);
    if (error) return json({ error: error.message }, 400);
    if (typeof body.name === 'string' && body.name.trim()) await adminClient.from('profiles').update({ name: body.name.trim() }).eq('id', userId);
    const authUpdates: Record<string, string> = {};
    if (typeof body.email === 'string' && body.email.trim()) authUpdates.email = body.email.trim().toLowerCase();
    if (Object.keys(authUpdates).length) await adminClient.auth.admin.updateUserById(userId, authUpdates);
    return json({ success: true });
  }

  if (action === 'delete') {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    return error ? json({ error: error.message }, 400) : json({ success: true });
  }

  return json({ error: 'Ação inválida.' }, 400);
});
