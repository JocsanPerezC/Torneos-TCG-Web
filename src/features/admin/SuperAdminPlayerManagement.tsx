import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/state/AuthContext';
import {
  insertPlayers,
  loadAllTournaments,
  persistPlayer,
  removeRemotePlayer,
} from '@/data/tournamentRepository';
import type { Tournament } from '@/domain/types';
import { Button } from '@/components/ui/button';
import { uid } from '@/domain/types';
import i18n from '@/i18n';
import { field, panel, primary } from '@/components/ui/classes';

export function SuperAdminPlayerManagement() {
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
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.players.loadFailed'));
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const activePlayers = (tournaments ?? []).flatMap((tournament) =>
    tournament.players.filter((player) => player.active).map((player) => ({ tournament, player })),
  );
  const playersByTournament = new Map(
    tournaments?.map((tournament) => [
      tournament.id,
      tournament.players.filter((player) => player.active).length,
    ]),
  );
  const players = activePlayers.filter(({ player, tournament }) =>
    `${player.name} ${tournament.name}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  if (!isSuperAdmin)
    return (
      <section className={`${panel} mt-7`}>
        <div>
          <h2 className="text-xl font-black">{i18n.t('app.admin.tabs.players')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {i18n.t('app.admin.players.description')}
          </p>
        </div>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${field} mt-4`}
          placeholder={i18n.t('app.admin.players.search')}
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
            <p className="text-sm text-muted-foreground">{i18n.t('app.admin.players.empty')}</p>
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
        { id: uid(), name, active: true, tieBreaker: tournament.players.length + 1 },
      ]);
      event.currentTarget.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.players.createFailed'));
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
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.players.updateFailed'));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (player: Tournament['players'][number]) => {
    if (!window.confirm(i18n.t('app.admin.players.deleteConfirm', { name: player.name }))) return;
    setBusy(true);
    try {
      await removeRemotePlayer(player.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.t('app.admin.players.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={[panel, 'mt-7 overflow-hidden p-0'].join(' ')}>
      <div className="px-5 pt-5">
        <p className="text-sm font-semibold text-accent">{i18n.t('app.admin.roles.super_admin')}</p>
        <h2 className="mt-1 text-xl font-black">{i18n.t('app.admin.tabs.players')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {i18n.t('app.admin.players.createDescription')}
        </p>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <form
          onSubmit={create}
          className="mt-4 grid gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4 md:grid-cols-3"
        >
          <select required name="tournamentId" className={field} defaultValue="">
            <option value="" disabled>
              {i18n.t('app.admin.players.selectTournament')}
            </option>
            {tournaments?.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
          <input
            required
            name="name"
            className={field}
            placeholder={i18n.t('app.admin.players.playerName')}
          />
          <Button disabled={busy} className={primary}>
            {i18n.t('app.admin.players.create')}
          </Button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y border-slate-700 px-5 py-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${field} w-64`}
          placeholder={i18n.t('app.admin.players.search')}
        />
        <span className="text-sm text-muted-foreground">
          {i18n.t('app.admin.total', { count: players.length })}
        </span>
      </div>
      <div className="max-h-[34rem] overflow-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">{i18n.t('app.common.name')}</th>
              <th className="px-5 py-3 font-semibold">
                {i18n.t('app.admin.tournaments.tournament')}
              </th>
              <th className="px-5 py-3 font-semibold">{i18n.t('app.common.status')}</th>
              <th className="px-5 py-3 font-semibold">{i18n.t('app.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {players.map(({ tournament, player }) => (
              <tr key={player.id} className="border-b border-slate-700 last:border-0">
                <td className="px-5 py-3">
                  <form id={'player-' + player.id} onSubmit={(event) => void update(event, player)}>
                    <input required name="name" defaultValue={player.name} className={field} />
                  </form>
                </td>
                <td className="px-5 py-3">
                  <strong className="block">{tournament.name}</strong>
                  <span className="text-xs text-slate-400">
                    {i18n.t('app.admin.players.activeCount', {
                      count: playersByTournament.get(tournament.id) ?? 0,
                    })}
                  </span>
                </td>
                <td className="px-5 py-3 text-emerald-300">{i18n.t('app.common.active')}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <Button disabled={busy} form={'player-' + player.id} className={primary}>
                      {i18n.t('app.common.save')}
                    </Button>
                    <Button
                      disabled={busy}
                      type="button"
                      variant="outline"
                      className="app-button app-button--danger"
                      onClick={() => void remove(player)}
                    >
                      {i18n.t('app.common.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {tournaments && players.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-5 text-slate-400">
                  {i18n.t('app.admin.players.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
