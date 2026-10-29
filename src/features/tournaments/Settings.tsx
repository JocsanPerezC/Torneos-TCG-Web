import { useParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useTournaments } from '@/state/TournamentContext';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { TournamentJoinLink } from '@/features/tournaments/components/TournamentJoinLink';
import { Notice } from '@/components/feedback/Notice';
import { ConfirmModal } from '@/components/feedback/ConfirmModal';
import i18n from '@/i18n';

import { Current } from '@/features/tournaments/currentTournament';
import { field, primary } from '@/components/ui/classes';

export function Settings() {
  const tournament = Current();
  const { id } = useParams();
  const { updateTournament } = useTournaments();
  const [message, setMessage] = useState('');
  const [finishing, setFinishing] = useState(false);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plannedRounds = Number(form.get('rounds'));
    const maxPlayers = Number(form.get('maxPlayers'));
    const maxTables = Number(form.get('maxTables'));
    if (
      !Number.isInteger(plannedRounds) ||
      plannedRounds < tournament.rounds.length ||
      plannedRounds < 1
    )
      return setMessage(i18n.t('app.createTournament.invalidLimits'));
    if (
      !Number.isInteger(maxPlayers) ||
      maxPlayers < tournament.players.length ||
      !Number.isInteger(maxTables) ||
      maxTables < 1
    )
      return setMessage(i18n.t('app.createTournament.invalidLimits'));
    updateTournament(id!, {
      name: String(form.get('name')).trim(),
      format: String(form.get('format')).trim(),
      plannedRounds,
      maxPlayers,
      maxTables,
      isPublic: true,
    });
    setMessage('');
    showToast(i18n.t('app.tournament.settingsSaved'));
  }
  const canFinish = !tournament.rounds.some((round) => round.status !== 'completada');
  return (
    <section className="settings-desk">
      <div className="min-w-0">
        <form onSubmit={save} className="settings-desk__form">
          <header>
            <p>{i18n.t('app.tournament.settings')}</p>
            <h2>{i18n.t('app.tournament.settingsTitle')}</h2>
          </header>
          {message && <Notice error>{message}</Notice>}
          <div className="settings-desk__fields">
            <label>
              {i18n.t('app.common.name')}
              <input required name="name" defaultValue={tournament.name} className={field} />
            </label>
            <label>
              {i18n.t('app.createTournament.format')}
              <input required name="format" defaultValue={tournament.format} className={field} />
            </label>
            <label>
              {i18n.t('app.tournament.plannedRounds')}
              <input
                required
                type="number"
                min="1"
                name="rounds"
                defaultValue={tournament.plannedRounds}
                className={field}
              />
            </label>
            <label>
              {i18n.t('app.createTournament.maxPlayers')}
              <input
                required
                type="number"
                min="3"
                name="maxPlayers"
                defaultValue={tournament.maxPlayers}
                className={field}
              />
            </label>
            <label>
              {i18n.t('app.tournament.maxTablesPerRound')}
              <input
                required
                type="number"
                min="1"
                name="maxTables"
                defaultValue={tournament.maxTables}
                className={field}
              />
            </label>
          </div>
          <p className="settings-desk__hint">{i18n.t('app.tournament.pointsManual')}</p>
          <div className="flex justify-end">
            <Button disabled={tournament.status === 'finalizado'} className={primary}>
              {i18n.t('app.tournament.saveChanges')}
            </Button>
          </div>
        </form>
        <TournamentJoinLink tournamentId={tournament.id} />
      </div>
      <aside className="settings-desk__danger">
        <span aria-hidden>!</span>
        <h2>{i18n.t('app.common.status')}</h2>
        <p>{i18n.t('app.tournament.finishHelp')}</p>
        {tournament.status === 'finalizado' ? (
          <Button
            className="app-button app-button--secondary"
            onClick={() => {
              updateTournament(id!, { status: 'activo' });
              showToast(i18n.t('app.tournament.tournamentReopened'));
            }}
          >
            {i18n.t('app.tournament.reopenTournament')}
          </Button>
        ) : (
          <Button
            disabled={!canFinish}
            variant="outline"
            className="app-button app-button--danger"
            onClick={() => setFinishing(true)}
          >
            {i18n.t('app.tournament.finishTournament')}
          </Button>
        )}
      </aside>
      {finishing && (
        <ConfirmModal
          title={i18n.t('app.tournament.finishTournament')}
          description={i18n.t('app.tournament.finishHelp')}
          confirmLabel={i18n.t('app.tournament.finishTournament')}
          destructive
          onClose={() => setFinishing(false)}
          onConfirm={() => {
            updateTournament(id!, { status: 'finalizado' });
            showToast(i18n.t('app.tournament.tournamentFinished'));
            setFinishing(false);
          }}
        />
      )}
    </section>
  );
}
