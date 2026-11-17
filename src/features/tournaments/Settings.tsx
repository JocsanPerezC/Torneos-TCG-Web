import { useParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { CircleAlert, Droplets, Minus, Plus, Swords } from 'lucide-react';
import { useTournaments } from '@/state/TournamentContext';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { TournamentJoinLink } from '@/features/tournaments/components/TournamentJoinLink';
import { Notice } from '@/components/feedback/Notice';
import { ConfirmModal } from '@/components/feedback/ConfirmModal';
import i18n from '@/i18n';

import { Current } from '@/features/tournaments/currentTournament';
import { field, primary } from '@/components/ui/classes';

type SettingsNumberField = 'rounds' | 'maxPlayers' | 'maxTables';

export function Settings() {
  const tournament = Current();
  const { id } = useParams();
  const { updateTournament } = useTournaments();
  const [message, setMessage] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [rounds, setRounds] = useState(String(tournament.plannedRounds));
  const [maxPlayers, setMaxPlayers] = useState(String(tournament.maxPlayers));
  const [maxTables, setMaxTables] = useState(String(tournament.maxTables));
  const limits = {
    rounds: Math.max(1, tournament.rounds.length),
    maxPlayers: Math.max(3, tournament.players.length),
    maxTables: 1,
  } as const;
  const values = { rounds, maxPlayers, maxTables } as const;

  function setNumber(fieldName: SettingsNumberField, rawValue: string) {
    const value = rawValue.replace(/\D/g, '');
    if (fieldName === 'rounds') setRounds(value);
    if (fieldName === 'maxPlayers') setMaxPlayers(value);
    if (fieldName === 'maxTables') setMaxTables(value);
  }

  function changeNumber(fieldName: SettingsNumberField, change: number) {
    const minimum = limits[fieldName];
    const next = Math.max(minimum, (Number(values[fieldName]) || minimum) + change);
    setNumber(fieldName, String(next));
  }

  function numberInput(fieldName: SettingsNumberField, label: string) {
    return (
      <div className="settings-desk__stepper">
        <label htmlFor={`settings-${fieldName}`}>{label}</label>
        <div>
          <Button
            type="button"
            variant="outline"
            className="settings-desk__stepper-button"
            onClick={() => changeNumber(fieldName, -1)}
            aria-label={i18n.t('app.createTournament.decrease', { label })}
          >
            <Minus aria-hidden size={16} />
          </Button>
          <input
            required
            id={`settings-${fieldName}`}
            name={fieldName}
            value={values[fieldName]}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => setNumber(fieldName, event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            className="settings-desk__stepper-button"
            onClick={() => changeNumber(fieldName, 1)}
            aria-label={i18n.t('app.createTournament.increase', { label })}
          >
            <Plus aria-hidden size={16} />
          </Button>
        </div>
      </div>
    );
  }

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
      tracksKills: form.get('tracksKills') === 'on',
      tracksFirstBlood: form.get('tracksFirstBlood') === 'on',
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
            <h2>{i18n.t('app.tournament.settingsTitle')}</h2>
          </header>
          {message && <Notice error>{message}</Notice>}
          <section className="settings-desk__section" aria-labelledby="settings-details-title">
            <h3 id="settings-details-title">{i18n.t('app.tournament.settingsDetails')}</h3>
            <div className="settings-desk__fields">
              <label>
                {i18n.t('app.common.name')}
                <input required name="name" defaultValue={tournament.name} className={field} />
              </label>
              <label>
                {i18n.t('app.createTournament.gameOrFormat')}
                <input required name="format" defaultValue={tournament.format} className={field} />
              </label>
            </div>
          </section>
          <section className="settings-desk__section" aria-labelledby="settings-size-title">
            <h3 id="settings-size-title">{i18n.t('app.tournament.settingsSize')}</h3>
            <div className="settings-desk__steppers">
              {numberInput('rounds', i18n.t('app.createTournament.rounds'))}
              {numberInput('maxPlayers', i18n.t('app.createTournament.maxPlayersShort'))}
              {numberInput('maxTables', i18n.t('app.createTournament.maxTablesShort'))}
            </div>
          </section>
          <fieldset className="settings-desk__rules" disabled={tournament.status === 'finalizado'}>
            <legend>{i18n.t('app.createTournament.gameRules')}</legend>
            <p>{i18n.t('app.createTournament.gameRulesHelp')}</p>
            <div className="settings-desk__switches">
              <label className="tournament-rule tournament-rule--kills">
                <span className="tournament-rule__copy">
                  <Swords aria-hidden />
                  <strong>{i18n.t('app.common.kills')}</strong>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  name="tracksKills"
                  defaultChecked={tournament.tracksKills !== false}
                />
              </label>
              <label className="tournament-rule tournament-rule--first-blood">
                <span className="tournament-rule__copy">
                  <Droplets aria-hidden />
                  <strong>{i18n.t('app.common.firstBlood')}</strong>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  name="tracksFirstBlood"
                  defaultChecked={tournament.tracksFirstBlood === true}
                />
              </label>
            </div>
            <p className="settings-desk__hint">{i18n.t('app.tournament.pointsManual')}</p>
          </fieldset>
          <div className="settings-desk__actions">
            <Button disabled={tournament.status === 'finalizado'} className={primary}>
              {i18n.t('app.tournament.saveChanges')}
            </Button>
          </div>
        </form>
        <TournamentJoinLink tournamentId={tournament.id} />
      </div>
      <aside className="settings-desk__finish">
        <CircleAlert aria-hidden />
        <div>
          <h2>{i18n.t('app.tournament.settingsFinish')}</h2>
          <p>{i18n.t('app.tournament.settingsFinishHelp')}</p>
        </div>
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
