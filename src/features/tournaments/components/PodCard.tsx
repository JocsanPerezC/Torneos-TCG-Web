import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTournaments } from '../../../state/TournamentContext';
import type { Pod } from '../../../domain/types';
import { Button } from '../../../components/ui/button';
import { showToast } from '../../../components/ui/toast';
import { OutcomeButtons } from './OutcomeButtons';
import { outcomeLabel } from './outcomeLabel';
import i18n from '../../../i18n';
import { field, primary } from '@/components/ui/classes';

export function PodCard({
  tournamentId,
  roundId,
  pod,
  names,
  readOnly,
  editable,
}: {
  tournamentId: string;
  roundId: string;
  pod: Pod;
  names: Record<string, string>;
  readOnly: boolean;
  editable: boolean;
}) {
  const { savePod } = useTournaments();
  const [savedFeedback, setSavedFeedback] = useState(false);
  const savedFeedbackTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      if (savedFeedbackTimer.current) window.clearTimeout(savedFeedbackTimer.current);
    },
    [],
  );
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Pod = {
      ...pod,
      results: pod.playerIds.map((playerId) => {
        const outcome = form.get(`outcome-${playerId}`);
        return {
          playerId,
          points: Number(form.get(`points-${playerId}`)),
          kills: Number(form.get(`kills-${playerId}`)),
          outcome:
            outcome === 'win' || outcome === 'loss' || outcome === 'draw' ? outcome : undefined,
        };
      }),
    };
    const message =
      savePod(tournamentId, roundId, pod.id, next) ?? i18n.t('app.tournament.results');
    const validationMessages = [
      i18n.t('app.messages.completeResults'),
      i18n.t('app.messages.outcomeRequired'),
    ];
    const isValidationError = validationMessages.includes(message);
    showToast(message, isValidationError);
    if (!isValidationError) {
      setSavedFeedback(true);
      if (savedFeedbackTimer.current) window.clearTimeout(savedFeedbackTimer.current);
      savedFeedbackTimer.current = window.setTimeout(() => setSavedFeedback(false), 280);
    }
  }
  return (
    <div className={`game-table ${savedFeedback ? 'game-table--saved' : ''}`}>
      <h4>{i18n.t('app.common.table', { number: pod.number })}</h4>
      {!editable && (
        <div className="mt-3 grid gap-2">
          {pod.playerIds.map((playerId) => {
            const result = pod.results?.find((item) => item.playerId === playerId);
            return (
              <section className="pod-entry" key={playerId}>
                <h5>{names[playerId]}</h5>
                {result ? (
                  <div className="pod-entry__metrics">
                    <p>
                      {i18n.t('app.common.points')} <strong>{result.points}</strong>
                    </p>
                    <p>
                      {i18n.t('app.common.kills')} <strong>{result.kills}</strong>
                    </p>
                    <p>
                      {i18n.t('app.common.outcome')} <strong>{outcomeLabel(result.outcome)}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="pod-entry__pending">{i18n.t('app.common.noResults')}</p>
                )}
              </section>
            );
          })}
        </div>
      )}
      {editable && (
        <form onSubmit={save} className="mt-3 space-y-4">
          <p className="pod-results-help">{i18n.t('app.tournament.registerResults')}</p>
          <div className="grid gap-3">
            {pod.playerIds.map((playerId) => (
              <section className="pod-entry pod-entry--editable" key={playerId}>
                <div className="pod-entry__header">
                  <h5>{names[playerId]}</h5>
                  <OutcomeButtons
                    playerId={playerId}
                    outcome={pod.results?.find((result) => result.playerId === playerId)?.outcome}
                  />
                </div>
                <div className="pod-entry__fields">
                  <label>
                    {i18n.t('app.common.points')}
                    <input
                      required
                      min="0"
                      name={`points-${playerId}`}
                      defaultValue={
                        pod.results?.find((result) => result.playerId === playerId)?.points ?? ''
                      }
                      type="number"
                      className={`${field} mt-2 py-2 text-sm`}
                    />
                  </label>
                  <label>
                    {i18n.t('app.common.kills')}
                    <input
                      required
                      min="0"
                      max="5"
                      name={`kills-${playerId}`}
                      defaultValue={
                        pod.results?.find((result) => result.playerId === playerId)?.kills ?? 0
                      }
                      type="number"
                      className={`${field} mt-2 py-2 text-sm`}
                    />
                  </label>
                </div>
              </section>
            ))}
          </div>
          <Button disabled={readOnly} className={primary}>
            {i18n.t('app.common.save')}
          </Button>
        </form>
      )}
    </div>
  );
}
