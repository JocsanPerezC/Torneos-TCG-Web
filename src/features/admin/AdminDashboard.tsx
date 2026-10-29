import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/state/AuthContext';
import { deleteRemoteTournament } from '@/data/tournamentRepository';
import { loadAdminOverview, type AdminOverview } from '@/data/adminRepository';
import { deleteManagedUser, listManagedUsers, type ManagedUser } from '@/data/adminUsersRepository';
import { Database, RefreshCw, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/Badge';
import { AdminMetric } from '@/features/admin/components/AdminMetric';
import i18n from '@/i18n';

import { Layout } from '@/components/layout/Layout';
import {
  accessOrigin,
  displayDate,
  displayDateTime,
  roleLabel,
} from '@/features/admin/adminFormat';
import { AdminDataInspector } from '@/features/admin/AdminDataInspector';
import { SuperAdminPlayerManagement } from '@/features/admin/SuperAdminPlayerManagement';
import { UserProfileModal } from '@/features/admin/UserProfileModal';
import { field, panel } from '@/components/ui/classes';

export function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [overview, setOverview] = useState<AdminOverview>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [deletingTournament, setDeletingTournament] = useState<string>();
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
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.loadOverviewFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);
  const refreshManagedUsers = async () => {
    try {
      setManagedUsers(await listManagedUsers());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.loadProfilesFailed'));
    }
  };
  useEffect(() => {
    if (isSuperAdmin) void refreshManagedUsers();
  }, [isSuperAdmin]);
  const removeProfile = async (target: ManagedUser) => {
    if (!window.confirm(i18n.t('app.admin.deleteAccountConfirm', { name: target.displayName })))
      return;
    try {
      await deleteManagedUser(target.id);
      await Promise.all([refresh(), refreshManagedUsers()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.deleteAccountFailed'));
    }
  };
  const removeAdminTournament = async (target: AdminOverview['tournaments'][number]) => {
    if (!window.confirm(i18n.t('app.admin.deleteTournamentConfirm', { name: target.name }))) return;
    setDeletingTournament(target.id);
    try {
      await deleteRemoteTournament(target.id);
      await refresh();
      showToast(i18n.t('app.tournament.tournamentDeleted'));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : i18n.t('app.admin.deleteTournamentFailed'),
      );
    } finally {
      setDeletingTournament(undefined);
    }
  };

  const profilesById = new Map(overview?.profiles.map((profile) => [profile.id, profile]));
  const playerCount =
    overview?.tournaments.reduce((total, tournament) => total + tournament.playerCount, 0) ?? 0;
  const activeTournaments =
    overview?.tournaments.filter((tournament) => tournament.status === 'activo').length ?? 0;
  const accountProfiles =
    overview?.profiles.filter((profile) => isSuperAdmin || profile.role !== 'super_admin') ?? [];
  const managedUsersById = new Map(managedUsers.map((managed) => [managed.id, managed]));
  const visibleProfiles = accountProfiles.filter((profile) =>
    `${profile.displayName} ${profile.role} ${managedUsersById.get(profile.id)?.email ?? ''}`
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
    <Layout wide>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <ShieldCheck size={16} />
            {i18n.t('app.admin.restrictedAccess')}
          </p>
          <h1 className="mt-1 text-3xl font-black">{i18n.t('app.admin.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {i18n.t('app.admin.description')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="app-button app-button--secondary"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? i18n.t('app.admin.refreshing') : i18n.t('app.admin.refresh')}
        </Button>
      </div>
      {error && (
        <section className="mb-5 rounded-xl border border-red-700 bg-red-950 p-4 text-sm text-red-300">
          {error}
        </section>
      )}
      <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric
          icon={<Users size={19} />}
          label={i18n.t('app.admin.metrics.accounts')}
          value={overview ? accountProfiles.length : '—'}
        />
        <AdminMetric
          icon={<ShieldCheck size={19} />}
          label={i18n.t('app.admin.metrics.adminAccess')}
          value={overview?.profiles.filter((profile) => profile.role === 'admin').length ?? '—'}
        />
        <AdminMetric
          icon={<Trophy size={19} />}
          label={i18n.t('app.admin.metrics.activeTournaments')}
          value={overview ? activeTournaments : '—'}
        />
        <AdminMetric
          icon={<Database size={19} />}
          label={i18n.t('app.admin.metrics.registeredPlayers')}
          value={overview ? playerCount : '—'}
        />
      </section>
      {!overview && !error && (
        <p className="text-sm text-muted-foreground">{i18n.t('app.admin.loadingOverview')}</p>
      )}
      {overview && (
        <>
          <nav className="mb-7 flex gap-2 overflow-x-auto p-1">
            {(
              [
                ['accounts', i18n.t('app.admin.tabs.accounts')],
                ['tournaments', i18n.t('app.admin.tabs.tournaments')],
                ['players', i18n.t('app.admin.tabs.players')],
                ['details', i18n.t('app.admin.tabs.details')],
              ] as const
            ).map(([tab, label]) => (
              <Button
                key={tab}
                type="button"
                onClick={() => setAdminTab(tab)}
                variant="outline"
                className={`app-button whitespace-nowrap ${adminTab === tab ? 'app-button--primary' : 'app-button--secondary'}`}
              >
                {label}
              </Button>
            ))}
          </nav>
          <div className={adminTab === 'accounts' ? '' : 'hidden'}>
            <section className={`${panel} overflow-hidden p-0`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4">
                <div>
                  <h2 className="text-xl font-black">{i18n.t('app.admin.tabs.accounts')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={profileSearch}
                    onChange={(event) => setProfileSearch(event.target.value)}
                    className={`${field} w-52`}
                    placeholder={i18n.t('app.admin.accounts.search')}
                  />
                  <span className="text-sm text-muted-foreground">
                    {i18n.t('app.admin.total', { count: accountProfiles.length })}
                  </span>
                </div>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.accounts.organizer')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.accounts.email')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.accounts.role')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.accounts.registeredAt')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.accounts.lastAccess')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.accounts.origin')}
                      </th>
                      <th className="px-5 py-3 font-semibold">{i18n.t('app.admin.accounts.id')}</th>
                      <th className="px-5 py-3 font-semibold">{i18n.t('app.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProfiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-slate-700 last:border-0">
                        <td className="px-5 py-3 font-semibold">{profile.displayName}</td>
                        <td
                          className="max-w-56 truncate px-5 py-3 text-slate-300"
                          title={managedUsersById.get(profile.id)?.email}
                        >
                          {managedUsersById.get(profile.id)?.email ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              profile.role !== 'organizer'
                                ? 'rounded-md bg-amber-400 px-2 py-1 text-xs font-bold text-slate-950'
                                : 'rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold'
                            }
                          >
                            {roleLabel(profile.role)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {displayDate(profile.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-300">
                          {!isSuperAdmin
                            ? i18n.t('app.admin.restricted')
                            : managedUsersById.get(profile.id)?.lastAccess
                              ? displayDateTime(
                                  managedUsersById.get(profile.id)!.lastAccess!.accessedAt,
                                )
                              : i18n.t('app.admin.noRecords')}
                        </td>
                        <td
                          className="max-w-64 truncate px-5 py-3 text-slate-300"
                          title={
                            !isSuperAdmin
                              ? i18n.t('app.admin.restricted')
                              : managedUsersById.get(profile.id)?.lastAccess
                                ? `${accessOrigin(managedUsersById.get(profile.id)!.lastAccess!)} · ${managedUsersById.get(profile.id)!.lastAccess!.deviceType}`
                                : i18n.t('app.admin.noRecords')
                          }
                        >
                          {!isSuperAdmin
                            ? i18n.t('app.admin.restricted')
                            : managedUsersById.get(profile.id)?.lastAccess
                              ? accessOrigin(managedUsersById.get(profile.id)!.lastAccess!)
                              : i18n.t('app.admin.noRecords')}
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
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="app-button app-button--secondary"
                                onClick={() =>
                                  setEditingUser(
                                    managedUsers.find((managed) => managed.id === profile.id),
                                  )
                                }
                              >
                                {i18n.t('app.common.edit')}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="app-button app-button--danger"
                                onClick={() =>
                                  void removeProfile(
                                    managedUsers.find((managed) => managed.id === profile.id)!,
                                  )
                                }
                              >
                                {i18n.t('app.common.delete')}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleProfiles.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-5 text-slate-400">
                          {i18n.t('app.admin.accounts.empty')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <div className={adminTab === 'tournaments' ? '' : 'hidden'}>
            <section className={`${panel} overflow-hidden p-0`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-5 py-4">
                <div>
                  <h2 className="text-xl font-black">{i18n.t('app.admin.tabs.tournaments')}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={tournamentSearch}
                    onChange={(event) => setTournamentSearch(event.target.value)}
                    className={`${field} w-52`}
                    placeholder={i18n.t('app.admin.tournaments.search')}
                  />
                  <span className="text-sm text-slate-400">
                    {i18n.t('app.admin.total', { count: overview.tournaments.length })}
                  </span>
                </div>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.tournaments.tournament')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.tournaments.organizer')}
                      </th>
                      <th className="px-5 py-3 font-semibold">{i18n.t('app.common.status')}</th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.tournaments.participants')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.tournaments.rounds')}
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        {i18n.t('app.admin.tournaments.visibility')}
                      </th>
                      <th className="px-5 py-3 font-semibold">{i18n.t('app.common.actions')}</th>
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
                            i18n.t('app.admin.organizerRemoved')}
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
                            {tournament.isPublic
                              ? i18n.t('app.admin.public')
                              : i18n.t('app.admin.private')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {isSuperAdmin ? (
                            <div className="flex gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="app-button app-button--secondary"
                              >
                                <Link to={`/tournaments/${tournament.id}`}>
                                  {i18n.t('app.admin.manage')}
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                disabled={deletingTournament === tournament.id}
                                variant="outline"
                                size="sm"
                                className="app-button app-button--danger"
                                onClick={() => void removeAdminTournament(tournament)}
                              >
                                {deletingTournament === tournament.id
                                  ? i18n.t('app.admin.deleting')
                                  : i18n.t('app.common.delete')}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleTournaments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-5 text-slate-400">
                          {i18n.t('app.admin.tournaments.empty')}
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
