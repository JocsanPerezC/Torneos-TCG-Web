import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const unavailableLocation = 'Ubicación no disponible';

type AssignableRole = 'player' | 'organizer' | 'admin';
type LoginAccessRow = {
  account_id: string;
  accessed_at: string;
  ip_address: string | null;
  country: string;
  city: string;
  browser: string;
  operating_system: string;
  device_type: string;
};
type LoginAccess = {
  accessedAt: string;
  location: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  maskedIp: string;
};

const validRole = (value: unknown): value is AssignableRole =>
  value === 'player' || value === 'organizer' || value === 'admin';
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function clientIp(headers: Headers) {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  );
}

function isPrivateIp(ip: string) {
  return (
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
}

async function approximateLocation(ip: string | null) {
  if (!ip || isPrivateIp(ip)) return { country: unavailableLocation, city: unavailableLocation };
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2_500),
    });
    const data = (await response.json()) as {
      success?: boolean;
      city?: string;
      country_code?: string;
    };
    if (!response.ok || !data.success || !text(data.city) || !text(data.country_code))
      throw new Error();
    return { country: text(data.country_code), city: text(data.city) };
  } catch {
    return { country: unavailableLocation, city: unavailableLocation };
  }
}

function userAgentDetails(userAgent: string | null) {
  const value = userAgent ?? '';
  const browser = /Edg\//.test(value)
    ? 'Microsoft Edge'
    : /OPR\//.test(value)
      ? 'Opera'
      : /Firefox\//.test(value)
        ? 'Firefox'
        : /Chrome\//.test(value)
          ? 'Chrome'
          : /Safari\//.test(value)
            ? 'Safari'
            : 'Navegador no disponible';
  const operatingSystem = /Windows NT/.test(value)
    ? 'Windows'
    : /Android/.test(value)
      ? 'Android'
      : /iPhone|iPad|iPod/.test(value)
        ? 'iOS'
        : /Mac OS X/.test(value)
          ? 'macOS'
          : /Linux/.test(value)
            ? 'Linux'
            : 'Sistema operativo no disponible';
  const deviceType = /iPad|Tablet/.test(value)
    ? 'Tableta'
    : /Mobi|Android/.test(value)
      ? 'Móvil'
      : value
        ? 'Escritorio'
        : 'Dispositivo no disponible';
  return { browser, operatingSystem, deviceType };
}

function maskedIp(ip: string | null) {
  if (!ip) return 'IP no disponible';
  const ipv4 = ip.split('.');
  if (ipv4.length === 4) return `${ipv4[0]}.${ipv4[1]}.xxx.xxx`;
  const ipv6 = ip.split(':').filter(Boolean);
  return ipv6.length ? `${ipv6.slice(0, 2).join(':')}:xxxx:xxxx` : 'IP no disponible';
}

function serializeLoginAccess(access: LoginAccessRow): LoginAccess {
  const location =
    access.city === unavailableLocation || access.country === unavailableLocation
      ? unavailableLocation
      : `${access.city}, ${access.country}`;
  return {
    accessedAt: access.accessed_at,
    location,
    browser: access.browser,
    operatingSystem: access.operating_system,
    deviceType: access.device_type,
    maskedIp: maskedIp(access.ip_address),
  };
}

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
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;

    if (action === 'log-login') {
      const ip = clientIp(request.headers);
      const [location, device] = await Promise.all([
        approximateLocation(ip),
        Promise.resolve(userAgentDetails(request.headers.get('user-agent'))),
      ]);
      const { error } = await adminClient.from('login_accesses').insert({
        account_id: caller.id,
        ip_address: ip,
        country: location.country,
        city: location.city,
        browser: device.browser,
        operating_system: device.operatingSystem,
        device_type: device.deviceType,
      });
      if (error) throw error;
      return Response.json(
        { ok: true },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();
    if (profileError || callerProfile.role !== 'super_admin')
      throw new Error('Solo un super administrador puede gestionar cuentas');

    if (action === 'list') {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const ids = data.users.map((user) => user.id);
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, display_name, role, created_at')
        .in('id', ids);
      if (profilesError) throw profilesError;
      const { data: accessRows, error: accessError } = ids.length
        ? await adminClient
            .from('latest_login_accesses')
            .select(
              'account_id, accessed_at, ip_address, country, city, browser, operating_system, device_type',
            )
            .in('account_id', ids)
        : { data: [], error: null };
      if (accessError) throw accessError;
      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
      const latestAccessByAccount = new Map<string, LoginAccess>();
      for (const access of (accessRows ?? []) as LoginAccessRow[]) {
        if (!latestAccessByAccount.has(access.account_id))
          latestAccessByAccount.set(access.account_id, serializeLoginAccess(access));
      }
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
              lastAccess: latestAccessByAccount.get(user.id) ?? null,
            };
          }),
        },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const id = text(body.id);
    if (action === 'history') {
      if (!id) throw new Error('Cuenta inválida');
      const { data, error } = await adminClient
        .from('login_accesses')
        .select(
          'account_id, accessed_at, ip_address, country, city, browser, operating_system, device_type',
        )
        .eq('account_id', id)
        .order('accessed_at', { ascending: false });
      if (error) throw error;
      return Response.json(
        { accesses: ((data ?? []) as LoginAccessRow[]).map(serializeLoginAccess) },
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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
