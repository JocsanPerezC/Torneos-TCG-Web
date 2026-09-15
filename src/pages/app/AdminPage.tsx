import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Database, RefreshCw, ShieldCheck, Trophy, Users } from 'lucide-react';
import {
  createManagedUser,
  deleteManagedUser,
  listManagedUsers,
  updateManagedUser,
  type ManagedUser,
} from '../../data/adminUsersRepository';
import {
  loadAdminOverview,
  updateProfileRole,
  type AdminOverview,
  type AppRole,
  type AssignableRole,
} from '../../data/adminRepository';
import {
  insertPlayers,
  loadAllTournaments,
  persistPlayer,
  removeRemotePlayer,
} from '../../data/tournamentRepository';
import { uid, type Tournament } from '../../domain/types';
import { useAuth } from '../../state/AuthContext';
import { Modal } from '../../components/ui/modal';
import { Badge, field, Layout, panel, primary } from './shared';

export function AdminRoute() {
  const { configured, user, loading, isAdmin } = useAuth();

  if (!configured) return <Navigate to="/" replace />;
  if (loading)
    return (
      <Layout>
        <p className="text-sm text-slate-300">Verificando permisos de administración…</p>
      </Layout>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <AdminDashboard />;
}

const displayDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(date);
};
const roleLabel = (role: AppRole) =>
  role === 'super_admin'
    ? 'Super administrador'
    : role === 'admin'
      ? 'Administrador'
      : 'Organizador';

function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [overview, setOverview] = useState<AdminOverview>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [changingRole, setChangingRole] = useState<string>();
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [editingUser, setEditingUser] = useState<ManagedUser>();
  const [profileSearch, setProfileSearch] = useState('');
  const [tournamentSearch, setTournamentSearch] = useState('');
  const [adminTab, setAdminTab] = useState<'accounts' | 'tournaments' | 'players' | 'details'>(
    'accounts',
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      setOverview(await loadAdminOverview());
      setError(undefined);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudo cargar la información administrativa.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  const changeRole = async (profileId: string, role: AssignableRole) => {
    setChangingRole(profileId);
    try {
      await updateProfileRole(profileId, role);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cambiar el rol.');
    } finally {
      setChangingRole(undefined);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);
  const refreshManagedUsers = async () => {
    try {
      setManagedUsers(await listManagedUsers());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No se pudieron cargar los perfiles editables.',
      );
    }
  };
  useEffect(() => {
    if (isSuperAdmin) void refreshManagedUsers();
  }, [isSuperAdmin]);
  const removeProfile = async (target: ManagedUser) => {
    if (
      !window.confirm(
        `Eliminar la cuenta de ${target.displayName}? También se eliminarán sus torneos. Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await deleteManagedUser(target.id);
      await Promise.all([refresh(), refreshManagedUsers()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la cuenta.');
    }
  };

  const profilesById = new Map(overview?.profiles.map((profile) => [profile.id, profile]));
  const playerCount =
    overview?.tournaments.reduce((total, tournament) => total + tournament.playerCount, 0) ?? 0;
  const activeTournaments =
    overview?.tournaments.filter((tournament) => tournament.status === 'activo').length ?? 0;
  const accountProfiles =
    overview?.profiles.filter((profile) => isSuperAdmin || profile.role !== 'super_admin') ?? [];
  const visibleProfiles = accountProfiles.filter((profile) =>
    `${profile.displayName} ${profile.role}`
      .toLocaleLowerCase()
      .includes(profileSearch.toLocaleLowerCase()),
  );
  const visibleTournaments =
    overview?.tournaments.filter((tournament) =>
      `${tournament.name} ${tournament.format} ${profilesById.get(tournament.ownerId)?.displayName ?? ''}`
        .toLocaleLowerCase()
        .includes(tournamentSearch.toLocaleLowerCase()),
    ) ?? [];

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
            <ShieldCheck size={16} />
            ACCESO RESTRINGIDO
          </p>
          <h1 className="mt-1 text-3xl font-black">Administración</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Vista global de la aplicación. Solo un super admin puede cambiar roles.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>
      {error && (
        <section className="mb-5 rounded-xl border border-red-700 bg-red-950 p-4 text-sm text-red-300">
          {error}
        </section>
      )}
      <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric
          icon={<Users size={19} />}
          label="Cuentas"
          value={overview ? accountProfiles.length : '—'}
        />
        <AdminMetric
          icon={<ShieldCheck size={19} />}
          label="Acceso admin"
          value={overview?.profiles.filter((profile) => profile.role === 'admin').length ?? '—'}
        />
        <AdminMetric
          icon={<Trophy size={19} />}
          label="Torneos activos"
          value={overview ? activeTournaments : '—'}
        />
        <AdminMetric
          icon={<Database size={19} />}
          label="Jugadores registrados"
          value={overview ? playerCount : '—'}
        />
      </section>
      {!overview && !error && (
        <p className="text-sm text-slate-300">Cargando información de Supabase…</p>
      )}
      {overview && (
        <>
          <nav className="mb-7 flex gap-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-1">
            {(
              [
                ['accounts', 'Cuentas'],
                ['tournaments', 'Torneos'],
                ['players', 'Jugadores activos'],
                ['details', 'Datos completos'],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAdminTab(tab)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${adminTab === tab ? 'bg-amber-400 font-bold text-slate-950' : 'hover:bg-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className={adminTab === 'accounts' ? '' : 'hidden'}>
            <section className={`${panel} mb-7 overflow-hidden p-0`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4">
                <div>
                  <h2 className="text-xl font-black">Cuentas</h2>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={profileSearch}
                    onChange={(event) => setProfileSearch(event.target.value)}
                    className="w-52 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    placeholder="Buscar cuenta"
                  />
                  <span className="text-sm text-slate-400">{accountProfiles.length} en total</span>
                </div>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Organizador</th>
                      <th className="px-5 py-3 font-semibold">Rol</th>
                      <th className="px-5 py-3 font-semibold">Registro</th>
                      <th className="px-5 py-3 font-semibold">ID</th>
                      <th className="px-5 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProfiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-slate-700 last:border-0">
                        <td className="px-5 py-3 font-semibold">{profile.displayName}</td>
                        <td className="px-5 py-3">
                          {isSuperAdmin && profile.id !== user?.id ? (
                            <select
                              aria-label={`Cambiar rol de ${profile.displayName}`}
                              value={profile.role}
                              disabled={changingRole === profile.id}
                              onChange={(event) =>
                                void changeRole(profile.id, event.target.value as AssignableRole)
                              }
                              className="rounded-md border border-slate-500 bg-slate-950 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="organizer">Organizador</option>
                              <option value="admin">Administrador</option>
                            </select>
                          ) : (
                            <span
                              className={
                                profile.role !== 'organizer'
                                  ? 'rounded-md bg-amber-400 px-2 py-1 text-xs font-bold text-slate-950'
                                  : 'rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold'
                              }
                            >
                              {roleLabel(profile.role)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {displayDate(profile.createdAt)}
                        </td>
                        <td
                          className="max-w-44 truncate px-5 py-3 font-mono text-xs text-slate-400"
                          title={profile.id}
                        >
                          {profile.id}
                        </td>
                        <td className="px-5 py-3">
                          {isSuperAdmin &&
                          profile.id !== user?.id &&
                          managedUsers.find((managed) => managed.id === profile.id) ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold hover:bg-slate-800"
                                onClick={() =>
                                  setEditingUser(
                                    managedUsers.find((managed) => managed.id === profile.id),
                                  )
                                }
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-red-700 px-2 py-1 text-xs font-bold text-white hover:bg-red-600"
                                onClick={() =>
                                  void removeProfile(
                                    managedUsers.find((managed) => managed.id === profile.id)!,
                                  )
                                }
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleProfiles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-5 text-slate-400">
                          No hay perfiles registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            {isSuperAdmin && <SuperAdminUserManagement />}
          </div>
          <div className={adminTab === 'tournaments' ? '' : 'hidden'}>
            <section className={`${panel} overflow-hidden p-0`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4">
                <div>
                  <h2 className="text-xl font-black">Torneos</h2>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={tournamentSearch}
                    onChange={(event) => setTournamentSearch(event.target.value)}
                    className="w-52 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    placeholder="Buscar torneo"
                  />
                  <span className="text-sm text-slate-400">
                    {overview.tournaments.length} en total
                  </span>
                </div>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Torneo</th>
                      <th className="px-5 py-3 font-semibold">Organizador</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold">Participantes</th>
                      <th className="px-5 py-3 font-semibold">Rondas</th>
                      <th className="px-5 py-3 font-semibold">Visibilidad</th>
                      <th className="px-5 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTournaments.map((tournament) => (
                      <tr key={tournament.id} className="border-b border-slate-700 last:border-0">
                        <td className="px-5 py-3">
                          <strong className="block">{tournament.name}</strong>
                          <span className="text-xs text-slate-400">
                            {tournament.format} · {displayDate(tournament.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {profilesById.get(tournament.ownerId)?.displayName ??
                            'Organizador eliminado'}
                        </td>
                        <td className="px-5 py-3">
                          <Badge>{tournament.status}</Badge>
                        </td>
                        <td className="px-5 py-3 tabular-nums">{tournament.playerCount}</td>
                        <td className="px-5 py-3 tabular-nums">{tournament.roundCount}</td>
                        <td className="px-5 py-3">
                          <span
                            className={tournament.isPublic ? 'text-emerald-300' : 'text-slate-400'}
                          >
                            {tournament.isPublic ? 'Público' : 'Privado'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {isSuperAdmin ? (
                            <Link
                              to={`/tournaments/${tournament.id}`}
                              className="rounded-md border border-slate-500 px-2 py-1 text-xs font-semibold hover:bg-slate-800"
                            >
                              Gestionar
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleTournaments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-5 text-slate-400">
                          No hay torneos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <div className={adminTab === 'players' ? '' : 'hidden'}>
            <SuperAdminPlayerManagement />
          </div>
          <div className={adminTab === 'details' ? '' : 'hidden'}>
            <AdminDataInspector />
          </div>
          {editingUser && (
            <UserProfileModal
              user={editingUser}
              onClose={() => setEditingUser(undefined)}
              onSaved={() => {
                void refresh();
                void refreshManagedUsers();
                setEditingUser(undefined);
              }}
            />
          )}
        </>
      )}
    </Layout>
  );
}

function AdminMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <article className={panel}>
      <div className="flex items-center gap-2 text-amber-300">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <strong className="mt-3 block text-3xl font-black tabular-nums">{value}</strong>
    </article>
  );
}

function AdminDataInspector() {
  const [tournaments, setTournaments] = useState<Tournament[]>();
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    void loadAllTournaments()
      .then((data) => {
        if (active) setTournaments(data);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : 'No se pudo cargar el detalle de los torneos.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleTournaments = tournaments?.filter((tournament) =>
    `${tournament.name} ${tournament.format}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <section className={`${panel} mt-7`}>
      <div>
        <h2 className="text-xl font-black">Datos completos</h2>
        <p className="mt-1 text-sm text-slate-300">
          Consulta de solo lectura de cada torneo, con reglas, jugadores, rondas, mesas y
          resultados. No incluye credenciales ni datos de Authentication.
        </p>
      </div>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      {!tournaments && !error && <p className="mt-4 text-sm text-slate-300">Cargando detalle…</p>}
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        placeholder="Buscar detalle de torneo"
      />
      <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
        {visibleTournaments?.map((tournament) => (
          <details
            key={tournament.id}
            className="rounded-lg border border-slate-700 bg-slate-950 p-4"
          >
            <summary className="cursor-pointer font-semibold">
              <span>{tournament.name}</span>
              <span className="ml-2 text-sm font-normal text-slate-400">
                {tournament.players.length} jugadores · {tournament.rounds.length} rondas
              </span>
            </summary>
            <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-300">
              {JSON.stringify(tournament, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}

function SuperAdminUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const load = async () => {
    try {
      setUsers(await listManagedUsers());
      setError(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las cuentas.');
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const matchingUsers = users?.filter((managed) =>
    `${managed.displayName} ${managed.email} ${managed.role}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await createManagedUser({
        displayName: String(form.get('displayName')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        role: String(form.get('role')) as AssignableRole,
      });
      event.currentTarget.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };
  const update = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await updateManagedUser(id, {
        displayName: String(form.get('displayName')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')) || undefined,
        role: String(form.get('role')) as AssignableRole,
      });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la cuenta.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (target: ManagedUser) => {
    if (
      !window.confirm(
        `Eliminar la cuenta de ${target.displayName}? También se eliminarán sus torneos. Esta acción no se puede deshacer.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deleteManagedUser(target.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la cuenta.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={`${panel} mt-7`}>
      <div>
        <p className="text-sm font-semibold text-amber-300">SUPER ADMIN</p>
        <h2 className="mt-1 text-xl font-black">Gestión de usuarios</h2>
      </div>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <form
        onSubmit={create}
        className="mt-5 grid gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4 md:grid-cols-4"
      >
        <input required name="displayName" className={field} placeholder="Nombre" />
        <input
          required
          name="email"
          type="email"
          className={field}
          placeholder="correo@ejemplo.com"
        />
        <input
          required
          name="password"
          minLength={6}
          type="password"
          className={field}
          placeholder="Contraseña temporal"
        />
        <select name="role" defaultValue="organizer" className={field}>
          <option value="organizer">Organizador</option>
          <option value="admin">Administrador</option>
        </select>
        <button disabled={busy} className={`${primary} md:col-span-4`}>
          Crear usuario
        </button>
      </form>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        placeholder="Buscar usuario"
      />
      <div className="mt-3 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
        {matchingUsers?.map((managed) =>
          managed.id === user?.id ? (
            <article key={managed.id} className="rounded-lg border border-slate-700 p-4">
              <strong>{managed.displayName}</strong>
              <span className="ml-2 text-sm text-amber-300">Super admin protegido</span>
            </article>
          ) : (
            <form
              key={managed.id}
              onSubmit={(event) => void update(event, managed.id)}
              className="grid gap-3 rounded-lg border border-slate-700 p-4 md:grid-cols-5"
            >
              <input
                required
                name="displayName"
                defaultValue={managed.displayName}
                className={field}
              />
              <input
                required
                name="email"
                type="email"
                defaultValue={managed.email}
                className={field}
              />
              <input
                name="password"
                minLength={6}
                type="password"
                className={field}
                placeholder="Nueva contraseña (opcional)"
              />
              <select name="role" defaultValue={managed.role} className={field}>
                <option value="organizer">Organizador</option>
                <option value="admin">Administrador</option>
              </select>
              <div className="flex items-end gap-2">
                <button disabled={busy} className={primary}>
                  Guardar
                </button>
                <button
                  disabled={busy}
                  type="button"
                  className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                  onClick={() => void remove(managed)}
                >
                  Eliminar
                </button>
              </div>
            </form>
          ),
        )}
        {matchingUsers?.length === 0 && (
          <p className="text-sm text-slate-400">No hay cuentas que coincidan.</p>
        )}
      </div>
    </section>
  );
}

function SuperAdminPlayerManagement() {
  const { isSuperAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      setTournaments(await loadAllTournaments());
      setError(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los jugadores.');
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const players = (tournaments ?? [])
    .flatMap((tournament) =>
      tournament.players
        .filter((player) => player.active)
        .map((player) => ({ tournament, player })),
    )
    .filter(({ player, tournament }) =>
      `${player.name} ${tournament.name}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
  if (!isSuperAdmin)
    return (
      <section className={`${panel} mt-7`}>
        <div>
          <h2 className="text-xl font-black">Jugadores activos</h2>
          <p className="mt-1 text-sm text-slate-300">Consulta de jugadores activos por torneo.</p>
        </div>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${field} mt-4`}
          placeholder="Buscar jugador o torneo"
        />
        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
          {players.map(({ tournament, player }) => (
            <article
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 p-3"
            >
              <strong>{player.name}</strong>
              <span className="text-sm text-slate-400">{tournament.name}</span>
            </article>
          ))}
          {tournaments && players.length === 0 && (
            <p className="text-sm text-slate-400">No hay jugadores activos que coincidan.</p>
          )}
        </div>
      </section>
    );
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tournament = tournaments?.find((item) => item.id === String(form.get('tournamentId')));
    const name = String(form.get('name')).trim();
    if (!tournament || !name) return;
    setBusy(true);
    try {
      await insertPlayers(tournament.id, [
        {
          id: uid(),
          name,
          active: true,
          tieBreaker: tournament.players.length + 1,
        },
      ]);
      event.currentTarget.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el jugador.');
    } finally {
      setBusy(false);
    }
  };
  const update = async (
    event: FormEvent<HTMLFormElement>,
    player: Tournament['players'][number],
  ) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name')).trim();
    if (!name) return;
    setBusy(true);
    try {
      await persistPlayer({ ...player, name });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el jugador.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (player: Tournament['players'][number]) => {
    if (!window.confirm(`Eliminar a ${player.name}?`)) return;
    setBusy(true);
    try {
      await removeRemotePlayer(player.id);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se puede eliminar un jugador con participaciones registradas.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={`${panel} mt-7`}>
      <div>
        <p className="text-sm font-semibold text-amber-300">SUPER ADMIN</p>
        <h2 className="mt-1 text-xl font-black">Jugadores activos</h2>
        <p className="mt-1 text-sm text-slate-300">
          Crea cada jugador dentro de un torneo y administra sus datos desde aquí.
        </p>
      </div>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <form
        onSubmit={create}
        className="mt-4 grid gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4 md:grid-cols-3"
      >
        <select required name="tournamentId" className={field} defaultValue="">
          <option value="" disabled>
            Selecciona un torneo
          </option>
          {tournaments?.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
        <input required name="name" className={field} placeholder="Nombre del jugador" />
        <button disabled={busy} className={primary}>
          Crear jugador
        </button>
      </form>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={`${field} mt-4`}
        placeholder="Buscar jugador o torneo"
      />
      <div className="mt-3 max-h-96 space-y-3 overflow-y-auto pr-1">
        {players.map(({ tournament, player }) => (
          <form
            key={player.id}
            onSubmit={(event) => void update(event, player)}
            className="grid gap-3 rounded-lg border border-slate-700 p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <span className="block text-xs text-slate-400">{tournament.name}</span>
              <input required name="name" defaultValue={player.name} className={field} />
            </div>
            <span className="self-end text-sm text-emerald-300">Activo</span>
            <div className="flex items-end gap-2">
              <button disabled={busy} className={primary}>
                Guardar
              </button>
              <button
                disabled={busy}
                type="button"
                className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
                onClick={() => void remove(player)}
              >
                Eliminar
              </button>
            </div>
          </form>
        ))}
        {tournaments && players.length === 0 && (
          <p className="text-sm text-slate-400">No hay jugadores activos que coincidan.</p>
        )}
      </div>
    </section>
  );
}

function UserProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: ManagedUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await updateManagedUser(user.id, {
        displayName: String(form.get('displayName')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')) || undefined,
        role: String(form.get('role')) as AssignableRole,
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el perfil.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={`Editar perfil: ${user.displayName}`}
      description="Deja la contraseña vacía para conservarla."
      onClose={onClose}
    >
      <form onSubmit={save} className="space-y-4">
        {error && <p className="text-sm text-red-300">{error}</p>}
        <label className="block text-sm font-medium">
          Nombre
          <input required name="displayName" defaultValue={user.displayName} className={field} />
        </label>
        <label className="block text-sm font-medium">
          Correo
          <input required name="email" type="email" defaultValue={user.email} className={field} />
        </label>
        <label className="block text-sm font-medium">
          Nueva contraseña
          <input name="password" minLength={6} type="password" className={field} />
        </label>
        <label className="block text-sm font-medium">
          Rol
          <select
            name="role"
            defaultValue={user.role === 'admin' ? 'admin' : 'organizer'}
            className={field}
          >
            <option value="organizer">Organizador</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button disabled={busy} className={primary}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
