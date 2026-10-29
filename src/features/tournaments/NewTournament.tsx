import { Navigate, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useTournaments } from '@/state/TournamentContext';
import { useAuth } from '@/state/AuthContext';
import { Check, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { tournamentLimitMessage } from '@/domain/tournamentLimits';
import { Notice } from '@/components/feedback/Notice';
import i18n from '@/i18n';

import { Layout } from '@/components/layout/Layout';
import { field, panel, primary } from '@/components/ui/classes';

type ActionFeedbackState = 'idle' | 'loading' | 'success';

export function NewTournament() {
  const { createTournament } = useTournaments();
  const { isAdmin, isPlayer } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [creationState, setCreationState] = useState<ActionFeedbackState>('idle');
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isPlayer) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const rounds = Number(values.get('rounds'));
    const maxPlayers = Number(values.get('maxPlayers'));
    const maxTables = Number(values.get('maxTables'));
    if (
      !Number.isInteger(rounds) ||
      rounds < 1 ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers < 3 ||
      !Number.isInteger(maxTables) ||
      maxTables < 1
    )
      return setError(i18n.t('app.createTournament.invalidLimits'));
    setBusy(true);
    setCreationState('loading');
    try {
      const tournament = await createTournament({
        name: String(values.get('name')),
        format: String(values.get('format')),
        plannedRounds: rounds,
        maxPlayers,
        maxTables,
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
  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-5 text-3xl font-black">{i18n.t('app.createTournament.title')}</h1>
        <form onSubmit={submit} className={`${panel} space-y-4`}>
          {error && <Notice error>{error}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              {i18n.t('app.common.name')}
              <input
                required
                name="name"
                className={field}
                placeholder={i18n.t('app.createTournament.namePlaceholder')}
              />
            </label>
            <label className="text-sm">
              {i18n.t('app.createTournament.gameOrFormat')}
              <input name="format" defaultValue="Commander" className={field} />
            </label>
            <label className="text-sm">
              {i18n.t('app.createTournament.plannedRounds')}
              <input
                required
                name="rounds"
                defaultValue="3"
                min="1"
                type="number"
                className={field}
              />
            </label>
            <label className="text-sm">
              {i18n.t('app.createTournament.maxPlayers')}
              <input
                required
                name="maxPlayers"
                defaultValue="32"
                min="3"
                type="number"
                className={field}
              />
            </label>
            <label className="text-sm">
              {i18n.t('app.createTournament.maxTables')}
              <input
                required
                name="maxTables"
                defaultValue="8"
                min="1"
                type="number"
                className={field}
              />
            </label>
          </div>
          <Button
            disabled={busy || creationState === 'success'}
            className={`${primary} create-tournament-button is-${creationState}`}
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
                <span className="action-feedback-button__result" aria-live="polite">
                  {i18n.t('app.createTournament.created')}
                </span>
              </>
            ) : (
              i18n.t('app.createTournament.create')
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
