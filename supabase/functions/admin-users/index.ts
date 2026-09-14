import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AssignableRole = 'organizer' | 'admin';
const validRole = (value: unknown): value is AssignableRole =>
  value === 'organizer' || value === 'admin';
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('No autorizado');

    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !caller) throw new Error('No autorizado');

    const adminClient = createClient(url, serviceKey);
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();
    if (profileError || callerProfile.role !== 'super_admin')
      throw new Error('Solo un super administrador puede gestionar cuentas');

    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;

    if (action === 'list') {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const ids = data.users.map((user) => user.id);
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, display_name, role, created_at')
        .in('id', ids);
      if (profilesError) throw profilesError;
      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
      return Response.json(
        {
          users: data.users.map((user) => {
            const profile = profileById.get(user.id);
            return {
              id: user.id,
              email: user.email ?? '',
              displayName: profile?.display_name ?? '',
              role: profile?.role ?? 'organizer',
              createdAt: profile?.created_at ?? user.created_at,
            };
          }),
        },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const id = text(body.id);
    const displayName = text(body.displayName);
    const email = text(body.email);
    const password = text(body.password);
    const role = body.role;

    if (action === 'create') {
      if (!displayName || !email || password.length < 6 || !validRole(role))
        throw new Error(
          'Nombre, correo, contraseña de al menos 6 caracteres y rol válido son obligatorios',
        );
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });
      if (error || !data.user) throw error ?? new Error('No se pudo crear la cuenta');
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ display_name: displayName, role })
        .eq('id', data.user.id);
      if (updateError) throw updateError;
      return Response.json(
        { ok: true },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'update') {
      if (!id || !displayName || !email || !validRole(role))
        throw new Error('Datos de cuenta inválidos');
      if (id === caller.id)
        throw new Error('No puedes modificar tu propia cuenta desde este panel');
      const attributes: {
        email: string;
        password?: string;
        user_metadata: { display_name: string };
      } = { email, user_metadata: { display_name: displayName } };
      if (password) {
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
        attributes.password = password;
      }
      const { error } = await adminClient.auth.admin.updateUserById(id, attributes);
      if (error) throw error;
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ display_name: displayName, role })
        .eq('id', id);
      if (updateError) throw updateError;
      return Response.json(
        { ok: true },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'delete') {
      if (!id) throw new Error('Cuenta inválida');
      if (id === caller.id) throw new Error('No puedes eliminar tu propia cuenta');
      const { error } = await adminClient.auth.admin.deleteUser(id);
      if (error) throw error;
      return Response.json(
        { ok: true },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    throw new Error('Acción no válida');
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
