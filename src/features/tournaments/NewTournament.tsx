import { Navigate, useNavigate } from 'react-router-dom';
import { useRef, useState, type FormEvent } from 'react';
import { Check, Droplets, LoaderCircle, Minus, Plus, Swords } from 'lucide-react';
import { useTournaments } from '@/state/TournamentContext';
import { useAuth } from '@/state/AuthContext';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { tournamentLimitMessage } from '@/domain/tournamentLimits';
import {
  automaticTableCount,
  validateTournamentSetup,
  type TournamentSetupValidation,
} from '@/domain/tournamentSetup';
import { Notice } from '@/components/feedback/Notice';
import { Layout } from '@/components/layout/Layout';
import { field, panel, primary } from '@/components/ui/classes';
import i18n from '@/i18n';

type ActionFeedbackState = 'idle' | 'loading' | 'success';
type NumberField = 'rounds' | 'maxPlayers' | 'maxTables';

const limits: Record<NumberField, { min: number; max: number }> = {
  rounds: { min: 1, max: 15 },
  maxPlayers: { min: 3, max: 256 },
  maxTables: { min: 1, max: 64 },
};

function setupMessage(setup: TournamentSetupValidation, tables: number, players: number) {
  if (setup.valid) {
    const key = setup.low === setup.high ? 'tableSummaryEqual' : 'tableSummaryMixed';
    return i18n.t(`app.createTournament.${key}`, {
      count: tables,
      players,
      tables,
      low: setup.low,
      high: setup.high,
    });
  }
  if (setup.reason === 'limits') return i18n.t('app.createTournament.invalidLimits');
  if (setup.reason === 'fewPlayers')
    return i18n.t('app.createTournament.tooFewPlayersForTables', {
      tables,
      minimum: tables * 3,
    });
  return i18n.t('app.createTournament.tooManyPlayersForTables', {
    tables,
    maximum: tables * 5,
    minimumTables: setup.minimumTables,
  });
}

export function NewTournament() {
  const { createTournament } = useTournaments();
  const { isAdmin, isPlayer } = useAuth();
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement>(null);
  const [rounds, setRounds] = useState('3');
  const [maxPlayers, setMaxPlayers] = useState('32');
  const [maxTables, setMaxTables] = useState(String(automaticTableCount(32)));
  const [tablesEdited, setTablesEdited] = useState(false);
  const [tracksKills, setTracksKills] = useState(true);
  const [tracksFirstBlood, setTracksFirstBlood] = useState(false);
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [creationState, setCreationState] = useState<ActionFeedbackState>('idle');

  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isPlayer) return <Navigate to="/dashboard" replace />;

  const setup = validateTournamentSetup({
    rounds: Number(rounds),
    players: Number(maxPlayers),
    tables: Number(maxTables),
  });
  const setupHelp = setupMessage(setup, Number(maxTables), Number(maxPlayers));

  function setNumber(fieldName: NumberField, rawValue: string) {
    const value = rawValue.replace(/\D/g, '');
    if (fieldName === 'rounds') setRounds(value);
    if (fieldName === 'maxPlayers') {
      setMaxPlayers(value);
      if (!tablesEdited) setMaxTables(value ? String(automaticTableCount(Number(value))) : '');
    }
    if (fieldName === 'maxTables') {
      setMaxTables(value);
      setTablesEdited(true);
    }
  }

  function changeNumber(fieldName: NumberField, change: number) {
    const current =
      fieldName === 'rounds' ? rounds : fieldName === 'maxPlayers' ? maxPlayers : maxTables;
    const { min, max } = limits[fieldName];
    const next = Math.min(max, Math.max(min, (Number(current) || min) + change));
    setNumber(fieldName, String(next));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get('name') ?? '').trim();
    if (!name) {
      setNameError(i18n.t('app.createTournament.nameRequired'));
      nameRef.current?.focus();
      return;
    }
    if (!setup.valid) return;
    setError('');
    setBusy(true);
    setCreationState('loading');
    try {
      const tournament = await createTournament({
        name,
        format: String(values.get('format') ?? ''),
        plannedRounds: Number(rounds),
        maxPlayers: Number(maxPlayers),
        maxTables: Number(maxTables),
        tracksKills,
        tracksFirstBlood,
        isPublic: true,
      });
      const message = i18n.t('app.createTournament.created');
      setCreationState('success');
      showToast(message);
      window.setTimeout(() => navigate(`/tournaments/${tournament.id}`), 1200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tournamentLimitMessage);
      setCreationState('idle');
    } finally {
      setBusy(false);
    }
  }

  const numberInput = (fieldName: NumberField, label: string, value: string) => (
    <div className="new-tournament-form__stepper">
      <label htmlFor={fieldName}>{label}</label>
      <div>
        <Button
          type="button"
          variant="outline"
          className="new-tournament-form__stepper-button"
          onClick={() => changeNumber(fieldName, -1)}
          aria-label={i18n.t('app.createTournament.decrease', { label })}
        >
          <Minus aria-hidden size={16} />
        </Button>
        <input
          id={fieldName}
          name={fieldName}
          value={value}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={!setup.valid}
          aria-describedby="tournament-setup-help"
          onChange={(event) => setNumber(fieldName, event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          className="new-tournament-form__stepper-button"
          onClick={() => changeNumber(fieldName, 1)}
          aria-label={i18n.t('app.createTournament.increase', { label })}
        >
          <Plus aria-hidden size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-5 text-3xl font-black">{i18n.t('app.createTournament.title')}</h1>
        <form noValidate onSubmit={submit} className={`${panel} new-tournament-form`}>
          {error && <Notice error>{error}</Notice>}
          <div className="new-tournament-form__details">
            <label htmlFor="tournament-name">
              {i18n.t('app.common.name')}
              <input
                ref={nameRef}
                id="tournament-name"
                name="name"
                className={field}
                placeholder={i18n.t('app.createTournament.namePlaceholder')}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'tournament-name-error' : undefined}
                onInput={() => setNameError('')}
              />
              {nameError && (
                <p id="tournament-name-error" className="app-field-error">
                  {nameError}
                </p>
              )}
            </label>
            <label htmlFor="tournament-format">
              {i18n.t('app.createTournament.gameOrFormat')}
              <input
                id="tournament-format"
                name="format"
                defaultValue="Commander"
                className={field}
              />
            </label>
          </div>

          <section
            className="new-tournament-form__section"
            aria-labelledby="tournament-setup-title"
          >
            <h2 id="tournament-setup-title">{i18n.t('app.createTournament.configuration')}</h2>
            <p>{i18n.t('app.createTournament.configurationHelp')}</p>
            <div className="new-tournament-form__steppers">
              {numberInput('rounds', i18n.t('app.createTournament.rounds'), rounds)}
              {numberInput(
                'maxPlayers',
                i18n.t('app.createTournament.maxPlayersShort'),
                maxPlayers,
              )}
              {numberInput('maxTables', i18n.t('app.createTournament.maxTablesShort'), maxTables)}
            </div>
            <p
              id="tournament-setup-help"
              className={setup.valid ? 'new-tournament-form__help' : 'app-field-error'}
              aria-live="polite"
            >
              {setupHelp}
            </p>
          </section>

          <section
            className="new-tournament-form__section"
            aria-labelledby="tournament-rules-title"
          >
            <h2 id="tournament-rules-title">{i18n.t('app.createTournament.gameRules')}</h2>
            <p>{i18n.t('app.createTournament.gameRulesHelp')}</p>
            <div className="new-tournament-form__switches">
              <label className="tournament-rule tournament-rule--kills">
                <span className="tournament-rule__copy">
                  <Swords aria-hidden />
                  <strong>{i18n.t('app.common.kills')}</strong>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={tracksKills}
                  onChange={(event) => setTracksKills(event.target.checked)}
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
                  checked={tracksFirstBlood}
                  onChange={(event) => setTracksFirstBlood(event.target.checked)}
                />
              </label>
            </div>
            <div className="new-tournament-form__preview">
              <p>{i18n.t('app.createTournament.playerPreview')}</p>
              <div>
                <strong>{i18n.t('app.createTournament.previewPlayer')}</strong>
                <span>
                  {i18n.t('app.common.points')} <b>0</b>
                </span>
                {tracksKills && (
                  <span>
                    {i18n.t('app.common.kills')} <b>0</b>
                  </span>
                )}
                {tracksFirstBlood && (
                  <span>
                    {i18n.t('app.common.firstBlood')} <b>{i18n.t('app.common.no')}</b>
                  </span>
                )}
                <span>
                  {i18n.t('app.common.outcome')}{' '}
                  <b>{i18n.t('app.createTournament.previewOutcome')}</b>
                </span>
              </div>
            </div>
          </section>

          <div className="new-tournament-form__actions">
            <Button
              type="button"
              variant="outline"
              className="app-button app-button--secondary"
              onClick={() => navigate('/dashboard/tournaments')}
            >
              {i18n.t('app.common.cancel')}
            </Button>
            <Button
              disabled={busy || creationState === 'success' || !setup.valid}
              className={primary}
              aria-busy={creationState === 'loading'}
              aria-label={
                creationState === 'loading' ? i18n.t('app.createTournament.creating') : undefined
              }
            >
              {creationState === 'loading' ? (
                <LoaderCircle size={16} className="action-feedback-button__loader" aria-hidden />
              ) : creationState === 'success' ? (
                <>
                  <Check size={16} aria-hidden />
                  <span aria-live="polite">{i18n.t('app.createTournament.created')}</span>
                </>
              ) : (
                i18n.t('app.createTournament.create')
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
