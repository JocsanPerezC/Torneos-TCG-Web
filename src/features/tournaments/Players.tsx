import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTournaments } from '@/state/TournamentContext';
import type { Tournament } from '@/domain/types';
import { BadgeCheck, Plus, RefreshCw, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/feedback/Notice';
import { ConfirmModal } from '@/components/feedback/ConfirmModal';
import { Avatar } from '@/components/ui/Avatar';
import i18n from '@/i18n';

import { Current } from '@/features/tournaments/currentTournament';
import { field, primary } from '@/components/ui/classes';

export function Players() {
  const tournament = Current();
  const { id } = useParams();
  const { addPlayers, togglePlayer, removePlayer, renamePlayer, refreshTournaments } =
    useTournaments();
  // Cada aviso lleva su propio id para que un mismo texto repetido vuelva a mostrar el toast.
  const [message, setMessageState] = useState({ text: '', id: 0 });
  const setMessage = (text: string) => setMessageState((current) => ({ text, id: current.id + 1 }));
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tournament['players'][number]>();
  const [playerToToggle, setPlayerToToggle] = useState<Tournament['players'][number]>();
  const [playerToDelete, setPlayerToDelete] = useState<Tournament['players'][number]>();
  const [refreshing, setRefreshing] = useState(false);
  const [recentlyAddedPlayerIds, setRecentlyAddedPlayerIds] = useState<string[]>([]);
  const addedPlayersTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      if (addedPlayersTimer.current) window.clearTimeout(addedPlayersTimer.current);
    },
    [],
  );
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addPlayers(
      id!,
      String(new FormData(event.currentTarget).get('names')).split('\n'),
    );
    setMessage(
      result.error ??
        (result.added
          ? i18n.t('app.tournament.playersAdded', { count: result.added })
          : i18n.t('app.tournament.noPlayers')),
    );
    if (result.addedIds.length) {
      setRecentlyAddedPlayerIds(result.addedIds);
      if (addedPlayersTimer.current) window.clearTimeout(addedPlayersTimer.current);
      addedPlayersTimer.current = window.setTimeout(() => setRecentlyAddedPlayerIds([]), 360);
    }
    setAdding(false);
  }
  function edit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const result = renamePlayer(
      id!,
      editing.id,
      String(new FormData(event.currentTarget).get('name')),
    );
    setMessage(result ?? i18n.t('app.tournament.playerUpdated'));
    if (!result) setEditing(undefined);
  }
  async function refreshPlayers() {
    setRefreshing(true);
    await refreshTournaments();
    setRefreshing(false);
  }
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredPlayers = tournament.players.filter((player) =>
    player.name.toLocaleLowerCase().includes(normalizedSearch),
  );
  return (
    <section className="players-ledger">
      <header>
        <div>
          <p>
            {i18n.t('app.tournament.activeCount', {
              count: tournament.players.filter((player) => player.active).length,
            })}
          </p>
          <h2>{i18n.t('app.tournament.players')}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="app-button app-button--secondary"
            disabled={refreshing}
            onClick={() => void refreshPlayers()}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden />
            {refreshing
              ? i18n.t('app.tournament.refreshingPlayers')
              : i18n.t('app.tournament.refreshPlayers')}
          </Button>
          <Button
            disabled={tournament.status === 'finalizado'}
            className={primary}
            onClick={() => setAdding(true)}
          >
            <Plus size={16} aria-hidden />
            {i18n.t('app.tournament.addPlayers')}
          </Button>
        </div>
      </header>
      <div className="players-ledger__sheet">
        {message.text && <Notice key={message.id}>{message.text}</Notice>}
        <label className="players-ledger__search">
          <span className="sr-only">{i18n.t('app.tournament.searchPlayers')}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={i18n.t('app.tournament.searchPlayers')}
            className={field}
          />
        </label>
        <div className="players-ledger__list">
          {filteredPlayers.map((player) => (
            <article
              key={player.id}
              className={`player-slip ${player.active ? '' : 'is-withdrawn'} ${
                recentlyAddedPlayerIds.includes(player.id) ? 'player-slip--added' : ''
              }`}
            >
              <Avatar name={player.name} src={player.avatarUrl} className="player-slip__avatar" />
              <div>
                <strong>{player.name}</strong>
                {player.profileId && (
                  <span
                    className="player-slip__verified"
                    role="img"
                    aria-label={i18n.t('app.tournament.verifiedParticipant')}
                    title={i18n.t('app.tournament.verifiedParticipant')}
                  >
                    <BadgeCheck size={16} aria-hidden />
                  </span>
                )}
                <span className={`player-slip__status ${player.active ? 'is-active' : ''}`}>
                  {player.active ? i18n.t('app.common.active') : i18n.t('app.common.withdrawn')}
                </span>
              </div>
              <div className="player-slip__actions">
                {!player.profileId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="app-action-edit"
                    onClick={() => setEditing(player)}
                  >
                    {i18n.t('app.common.edit')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="app-action-muted"
                  onClick={() => setPlayerToToggle(player)}
                >
                  {player.active
                    ? i18n.t('app.tournament.retire')
                    : i18n.t('app.tournament.activate')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="app-action-delete"
                  onClick={() => setPlayerToDelete(player)}
                >
                  {i18n.t('app.common.delete')}
                </Button>
              </div>
            </article>
          ))}
          {!filteredPlayers.length && (
            <div className="app-empty-state">
              <span>
                <Users aria-hidden />
              </span>
              <p>
                {search
                  ? i18n.t('app.tournament.noPlayersFound')
                  : i18n.t('app.tournament.noPlayers')}
              </p>
            </div>
          )}
        </div>
      </div>
      {adding && (
        <Modal
          title={i18n.t('app.tournament.addPlayersTitle')}
          description={i18n.t('app.tournament.addPlayersDescription')}
          onClose={() => setAdding(false)}
        >
          <form className="space-y-4" onSubmit={add}>
            <textarea
              required
              name="names"
              className={field}
              rows={7}
              placeholder={i18n.t('app.tournament.playerNames')}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="app-button app-button--secondary"
                onClick={() => setAdding(false)}
              >
                {i18n.t('app.common.cancel')}
              </Button>
              <Button className={primary}>{i18n.t('app.tournament.addPlayers')}</Button>
            </div>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal
          title={i18n.t('app.tournament.editPlayer')}
          description={i18n.t('app.tournament.updatePlayer')}
          onClose={() => setEditing(undefined)}
        >
          <form className="space-y-4" onSubmit={edit}>
            <label className="block text-sm">
              {i18n.t('app.common.name')}
              <input autoFocus required name="name" defaultValue={editing.name} className={field} />
            </label>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="app-button app-button--secondary"
                onClick={() => setEditing(undefined)}
              >
                {i18n.t('app.common.cancel')}
              </Button>
              <Button className={primary}>{i18n.t('app.common.save')}</Button>
            </div>
          </form>
        </Modal>
      )}
      {playerToToggle && (
        <ConfirmModal
          title={
            playerToToggle.active
              ? i18n.t('app.tournament.retire')
              : i18n.t('app.tournament.activate')
          }
          description={
            playerToToggle.active
              ? i18n.t('app.tournament.retirePlayerDescription', { name: playerToToggle.name })
              : i18n.t('app.tournament.activatePlayerDescription', { name: playerToToggle.name })
          }
          confirmLabel={
            playerToToggle.active
              ? i18n.t('app.tournament.retire')
              : i18n.t('app.tournament.activate')
          }
          onClose={() => setPlayerToToggle(undefined)}
          onConfirm={() => {
            togglePlayer(id!, playerToToggle.id);
            setPlayerToToggle(undefined);
          }}
        />
      )}
      {playerToDelete && (
        <ConfirmModal
          title={i18n.t('app.tournament.deletePlayer')}
          description={i18n.t('app.tournament.deletePlayerDescription', {
            name: playerToDelete.name,
          })}
          confirmLabel={i18n.t('app.common.delete')}
          destructive
          onClose={() => setPlayerToDelete(undefined)}
          onConfirm={() => {
            const error = removePlayer(id!, playerToDelete.id);
            setMessage(error ?? i18n.t('app.tournament.playerDeleted'));
            setPlayerToDelete(undefined);
          }}
        />
      )}
    </section>
  );
}
