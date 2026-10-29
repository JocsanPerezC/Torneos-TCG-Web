import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTournaments } from '@/state/TournamentContext';
import type { Tournament } from '@/domain/types';
import {
  Check,
  Eye,
  ExternalLink,
  Info,
  LoaderCircle,
  Play,
  RefreshCw,
  Square,
  Trash2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/feedback/Notice';
import { ConfirmModal } from '@/components/feedback/ConfirmModal';
import { RoundTimer } from '@/features/tournaments/components/RoundTimer';
import { DraftPodCard } from '@/features/tournaments/components/DraftPodCard';
import { PodCard } from '@/features/tournaments/components/PodCard';
import i18n from '@/i18n';

import { Current } from '@/features/tournaments/currentTournament';
import { primary } from '@/components/ui/classes';

type ActionFeedbackState = 'idle' | 'loading' | 'success';

export function Rounds() {
  const tournament = Current();
  const { id } = useParams();
  const { generateRound, deleteLastRound, startRound, completeRound, movePlayer } =
    useTournaments();
  const [message, setMessage] = useState('');
  const [deletingLast, setDeletingLast] = useState(false);
  const [roundToComplete, setRoundToComplete] = useState<Tournament['rounds'][number]>();
  const [selectedRoundId, setSelectedRoundId] = useState<string>();
  const [draggedPlayer, setDraggedPlayer] = useState<string>();
  const [dropTargetPod, setDropTargetPod] = useState<string>();
  const [showRoundGenerationInfo, setShowRoundGenerationInfo] = useState(false);
  const [roundGenerationState, setRoundGenerationState] = useState<ActionFeedbackState>('idle');
  const roundGenerationTimer = useRef<number | undefined>(undefined);
  const [roundStatusFeedback, setRoundStatusFeedback] = useState<string>();
  const roundStatusFeedbackTimer = useRef<number | undefined>(undefined);
  const last = tournament.rounds.at(-1);
  const hasOpenRound = tournament.rounds.some((round) => round.status !== 'completada');
  const names = Object.fromEntries(tournament.players.map((player) => [player.id, player.name]));
  const selectedRound = tournament.rounds.find((round) => round.id === selectedRoundId) ?? last;
  const selectedIndex = selectedRound
    ? tournament.rounds.findIndex((round) => round.id === selectedRound.id)
    : -1;

  useEffect(() => {
    setSelectedRoundId(tournament.rounds.at(-1)?.id);
  }, [tournament.rounds.length]);

  useEffect(
    () => () => {
      if (roundGenerationTimer.current) window.clearTimeout(roundGenerationTimer.current);
      if (roundStatusFeedbackTimer.current) window.clearTimeout(roundStatusFeedbackTimer.current);
    },
    [],
  );

  const showRoundStatusFeedback = (roundId: string) => {
    setRoundStatusFeedback(roundId);
    if (roundStatusFeedbackTimer.current) window.clearTimeout(roundStatusFeedbackTimer.current);
    roundStatusFeedbackTimer.current = window.setTimeout(
      () => setRoundStatusFeedback(undefined),
      360,
    );
  };

  const generateNextRound = async () => {
    setRoundGenerationState('loading');
    const error = await generateRound(id!);
    if (error) {
      setMessage(error);
      setRoundGenerationState('idle');
      return;
    }
    const result = i18n.t('app.tournament.roundGenerated');
    setMessage(result);
    setRoundGenerationState('success');
    roundGenerationTimer.current = window.setTimeout(() => setRoundGenerationState('idle'), 460);
  };

  return (
    <section className="rounds-deck">
      <div className="rounds-deck__header">
        <h2 className="text-xl font-bold">
          {i18n.t('app.tournament.roundsAndTables')}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="app-help"
            aria-label={i18n.t('app.tournament.roundGenerationInfo.button')}
            aria-haspopup="dialog"
            title={i18n.t('app.tournament.roundGenerationInfo.button')}
            onClick={() => setShowRoundGenerationInfo(true)}
          >
            <Info aria-hidden />
          </Button>
        </h2>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            disabled={selectedIndex <= 0}
            variant="outline"
            className="app-button app-button--secondary"
            onClick={() => setSelectedRoundId(tournament.rounds[selectedIndex - 1].id)}
          >
            {i18n.t('app.common.previous')}
          </Button>
          <Button
            disabled={selectedIndex >= tournament.rounds.length - 1}
            variant="outline"
            className="app-button app-button--secondary"
            onClick={() => setSelectedRoundId(tournament.rounds[selectedIndex + 1].id)}
          >
            {i18n.t('app.common.next')}
          </Button>
          <Button
            disabled={
              tournament.status === 'finalizado' ||
              hasOpenRound ||
              tournament.rounds.length >= tournament.plannedRounds ||
              roundGenerationState !== 'idle'
            }
            className={primary}
            onClick={() => void generateNextRound()}
            aria-busy={roundGenerationState === 'loading'}
            aria-label={
              roundGenerationState === 'loading'
                ? i18n.t('app.tournament.generatingRound')
                : undefined
            }
          >
            {roundGenerationState === 'loading' ? (
              <LoaderCircle size={16} className="action-feedback-button__loader" aria-hidden />
            ) : (
              <>
                <RefreshCw size={16} aria-hidden />
                {i18n.t('app.tournament.generateRound')}
              </>
            )}
          </Button>
          <Button
            disabled={!last}
            variant="outline"
            className="app-button app-button--danger"
            onClick={() => setDeletingLast(true)}
          >
            <Trash2 size={16} />
            {i18n.t('app.tournament.deleteLast')}
          </Button>
        </div>
      </div>
      {message && (
        <Notice
          error={
            message.includes('requieren') ||
            message.includes('Completa') ||
            message.includes('finalizado') ||
            message.includes('Primero') ||
            message.includes('Espera') ||
            message.includes('Renombra') ||
            message.includes('Rename')
          }
        >
          {message}
        </Notice>
      )}
      {selectedRound ? (
        <article
          className={`round-sheet ${
            roundGenerationState === 'success' && selectedRound.id === last?.id
              ? 'round-sheet--generated'
              : ''
          } ${roundStatusFeedback === selectedRound.id ? 'round-sheet--status-feedback' : ''}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold">
                {i18n.t('app.common.round', { number: selectedRound.number })}{' '}
                <span className="ml-2">
                  <Badge>{selectedRound.status}</Badge>
                </span>
              </h3>
              <RoundTimer round={selectedRound} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="app-button app-button--secondary"
                to={`/t/${tournament.publicSlug}?round=${selectedRound.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <Eye size={16} />
                {i18n.t('app.tournament.publicView')}
                <ExternalLink size={14} />
              </Link>
              <Button
                disabled={selectedRound.status !== 'borrador' || tournament.status === 'finalizado'}
                className={`${primary} inline-flex items-center gap-2`}
                onClick={() => {
                  const error = startRound(id!, selectedRound.id);
                  setMessage(error ?? i18n.t('app.tournament.roundStarted'));
                  if (!error) showRoundStatusFeedback(selectedRound.id);
                }}
              >
                <Play size={16} fill="currentColor" />
                {i18n.t('app.tournament.startRound')}
              </Button>
              <Button
                disabled={selectedRound.status !== 'activa' || tournament.status === 'finalizado'}
                variant="outline"
                className="app-button app-button--danger"
                onClick={() => setRoundToComplete(selectedRound)}
              >
                <Square size={15} fill="currentColor" />
                {i18n.t('app.tournament.endRound')}
              </Button>
              {roundStatusFeedback === selectedRound.id && (
                <Check className="round-status-feedback__check" size={18} aria-hidden />
              )}
            </div>
          </div>
          {selectedRound.status === 'borrador' && (
            <p className="mt-3 text-sm text-muted-foreground">
              {i18n.t('app.tournament.dragHelp')}
            </p>
          )}
          <div className="rounds-deck__tables">
            {selectedRound.pods.map((pod) =>
              selectedRound.status === 'borrador' ? (
                <DraftPodCard
                  key={pod.id}
                  pod={pod}
                  names={names}
                  draggedPlayer={draggedPlayer}
                  isDropTarget={dropTargetPod === pod.id}
                  onDragStart={(playerId) => {
                    setDraggedPlayer(playerId);
                    setDropTargetPod(undefined);
                  }}
                  onDragEnter={() => {
                    if (draggedPlayer && !pod.playerIds.includes(draggedPlayer))
                      setDropTargetPod(pod.id);
                  }}
                  onDragEnd={() => {
                    setDraggedPlayer(undefined);
                    setDropTargetPod(undefined);
                  }}
                  onDrop={(playerId) => {
                    const error = movePlayer(id!, selectedRound.id, playerId, pod.id);
                    if (error) setMessage(error);
                    setDraggedPlayer(undefined);
                    setDropTargetPod(undefined);
                  }}
                />
              ) : (
                <PodCard
                  key={pod.id}
                  tournamentId={id!}
                  roundId={selectedRound.id}
                  pod={pod}
                  readOnly={tournament.status === 'finalizado' || selectedRound.status !== 'activa'}
                  names={names}
                  editable={selectedRound.status === 'activa'}
                />
              ),
            )}
          </div>
        </article>
      ) : (
        <div className="app-empty-state">{i18n.t('app.tournament.noRounds')}</div>
      )}
      {showRoundGenerationInfo && (
        <Modal
          title={i18n.t('app.tournament.roundGenerationInfo.title')}
          description={i18n.t('app.tournament.roundGenerationInfo.description')}
          onClose={() => setShowRoundGenerationInfo(false)}
        >
          <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
            <li>{i18n.t('app.tournament.roundGenerationInfo.activePlayers')}</li>
            <li>{i18n.t('app.tournament.roundGenerationInfo.tableSizes')}</li>
            <li>{i18n.t('app.tournament.roundGenerationInfo.pairings')}</li>
            <li>{i18n.t('app.tournament.roundGenerationInfo.reorganize')}</li>
          </ul>
          <div className="mt-5 flex justify-end">
            <Button className={primary} onClick={() => setShowRoundGenerationInfo(false)}>
              {i18n.t('app.tournament.roundGenerationInfo.close')}
            </Button>
          </div>
        </Modal>
      )}
      {deletingLast && last && (
        <ConfirmModal
          title={i18n.t('app.tournament.deleteLastTitle')}
          description={
            last.pods.some((p) => p.results?.length)
              ? i18n.t('app.tournament.deleteLastWithResults')
              : i18n.t('app.tournament.deleteLastDescription')
          }
          confirmLabel={i18n.t('app.tournament.deleteRound')}
          destructive
          onClose={() => setDeletingLast(false)}
          onConfirm={() => {
            setMessage(deleteLastRound(id!) ?? i18n.t('app.tournament.lastRoundDeleted'));
            setDeletingLast(false);
          }}
        />
      )}
      {roundToComplete && (
        <ConfirmModal
          title={i18n.t('app.tournament.completeTitle', { number: roundToComplete.number })}
          description={i18n.t('app.tournament.completeDescription')}
          confirmLabel={i18n.t('app.tournament.endRound')}
          destructive
          onClose={() => setRoundToComplete(undefined)}
          onConfirm={() => {
            const error = completeRound(id!, roundToComplete.id);
            setMessage(error ?? i18n.t('app.tournament.roundCompleted'));
            if (!error) showRoundStatusFeedback(roundToComplete.id);
            setRoundToComplete(undefined);
          }}
        />
      )}
    </section>
  );
}
