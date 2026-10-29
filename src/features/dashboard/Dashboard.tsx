import { Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useTournaments } from '@/state/TournamentContext';
import { useAuth } from '@/state/AuthContext';
import { PlayerDashboard } from '@/features/player/PlayerDashboard';
import type { Tournament } from '@/domain/types';
import {
  Archive,
  BadgeCheck,
  CircleHelp,
  Inbox,
  Play,
  Plus,
  Table,
  Trophy,
  Users,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/Badge';
import { Notice } from '@/components/feedback/Notice';
import { ConfirmModal } from '@/components/feedback/ConfirmModal';
import i18n from '@/i18n';

import { Layout } from '@/components/layout/Layout';
import { primary } from '@/components/ui/classes';

export function Dashboard({ view = 'home' }: { view?: 'home' | 'tournaments' }) {
  const { configured, isAdmin, isPlayer, user, loading } = useAuth();
  if (configured && !loading && !user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isPlayer)
    return (
      <Layout>
        <PlayerDashboard />
      </Layout>
    );
  return (
    <Layout>
      <OrganizerDashboard view={view} />
    </Layout>
  );
}

function OrganizerDashboard({ view }: { view: 'home' | 'tournaments' }) {
  const { tournaments, ready, remoteError, removeTournament } = useTournaments();
  const { user } = useAuth();
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament>();
  const [showTournamentGuide, setShowTournamentGuide] = useState(false);
  const ownTournaments = tournaments.filter((tournament) => tournament.ownerId === user?.id);
  const activeTournaments = ownTournaments.filter((tournament) => tournament.status === 'activo');
  const featuredTournament = activeTournaments[0];
  return (
    <div className="dashboard-board organizer-dashboard">
      <header className="dashboard-board__header">
        <div>
          <h1>{i18n.t(view === 'home' ? 'app.shell.home' : 'app.dashboard.title')}</h1>
        </div>
        <Button asChild className={primary}>
          <Link to="/tournaments/new">
            <Plus aria-hidden />
            {i18n.t('app.dashboard.newTournament')}
          </Link>
        </Button>
      </header>
      {!ready && (
        <div className="app-loading-note">
          <i />
          <span>{i18n.t('app.dashboard.loading')}</span>
        </div>
      )}
      {remoteError && (
        <div className="mb-4">
          <Notice error>{remoteError}</Notice>
        </div>
      )}
      {view === 'home' && featuredTournament && (
        <section
          className="dashboard-focus organizer-dashboard__focus"
          aria-labelledby="active-tournament-title"
        >
          <div>
            <span className="dashboard-focus__icon">
              <Play aria-hidden />
            </span>
            <p>{i18n.t('app.organizerDashboard.activeFocus')}</p>
            <h2 id="active-tournament-title">{featuredTournament.name}</h2>
            <span className="dashboard-focus__meta">
              {i18n.t('app.dashboard.playersAndRounds', {
                players: featuredTournament.players.filter((player) => player.active).length,
                rounds: `${featuredTournament.rounds.length}/${featuredTournament.plannedRounds}`,
              })}
            </span>
          </div>
          <div className="organizer-dashboard__focus-actions">
            <Button asChild variant="outline" className="app-button app-button--secondary">
              <Link to={`/tournaments/${featuredTournament.id}/settings`}>
                {i18n.t('app.organizerDashboard.invitations')}
              </Link>
            </Button>
            <Button asChild className={primary}>
              <Link to={`/tournaments/${featuredTournament.id}/rounds`}>
                {i18n.t('app.organizerDashboard.continueTournament')}
              </Link>
            </Button>
          </div>
        </section>
      )}
      {view === 'home' && ready && !featuredTournament && (
        <section
          className="dashboard-focus organizer-dashboard__focus"
          aria-labelledby="no-active-title"
        >
          <div>
            <span className="dashboard-focus__icon">
              <Trophy aria-hidden />
            </span>
            <h2 id="no-active-title">{i18n.t('app.organizerDashboard.noActiveTitle')}</h2>
            <span className="dashboard-focus__meta">
              {i18n.t('app.organizerDashboard.noActiveDescription')}
            </span>
          </div>
        </section>
      )}
      {view === 'tournaments' && (
        <section className="dashboard-shelf organizer-dashboard__catalog">
          <header>
            <span>
              <Trophy size={14} aria-hidden />
            </span>
            <h2>{i18n.t('app.dashboard.title')}</h2>
          </header>
          {ready && ownTournaments.length === 0 ? (
            <div className="app-empty-state">
              <span>
                <Inbox aria-hidden />
              </span>
              <p>{i18n.t('app.dashboard.noTournaments')}</p>
            </div>
          ) : (
            (['activo', 'finalizado'] as const).map((status) => {
              const sectionTournaments = ownTournaments.filter(
                (tournament) => tournament.status === status,
              );
              if (!sectionTournaments.length) return null;
              const SectionIcon = status === 'activo' ? Play : Archive;
              return (
                <section key={status} className="dashboard-shelf">
                  <header>
                    <span>
                      <SectionIcon size={14} aria-hidden />
                    </span>
                    <h3>
                      {status === 'activo'
                        ? i18n.t('app.dashboard.active')
                        : i18n.t('app.dashboard.finished')}
                    </h3>
                  </header>
                  <div className="dashboard-shelf__grid">
                    {sectionTournaments.map((tournament) => (
                      <article key={tournament.id} className="tournament-ticket">
                        <Link
                          to={`/tournaments/${tournament.id}`}
                          className="tournament-ticket__link"
                        >
                          <div className="tournament-ticket__top">
                            <span>{tournament.format}</span>
                            <Badge>{tournament.status}</Badge>
                          </div>
                          <strong>{tournament.name}</strong>
                          <p>
                            {i18n.t('app.dashboard.playersAndRounds', {
                              players: tournament.players.filter((player) => player.active).length,
                              rounds: `${tournament.rounds.length}/${tournament.plannedRounds}`,
                            })}
                          </p>
                        </Link>
                        <div className="tournament-ticket__bottom">
                          <div
                            className="round-pips"
                            aria-label={i18n.t('app.dashboard.playersAndRounds', {
                              players: tournament.players.filter((player) => player.active).length,
                              rounds: `${tournament.rounds.length}/${tournament.plannedRounds}`,
                            })}
                          >
                            {Array.from({ length: tournament.plannedRounds }, (_, round) => (
                              <i
                                className={round < tournament.rounds.length ? 'is-done' : ''}
                                key={round}
                              />
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="app-action-delete"
                            onClick={(event) => {
                              event.stopPropagation();
                              setTournamentToDelete(tournament);
                            }}
                          >
                            {i18n.t('app.common.delete')}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </section>
      )}
      {tournamentToDelete && (
        <ConfirmModal
          title={i18n.t('app.dashboard.deleteTitle')}
          description={i18n.t('app.dashboard.deleteDescription', {
            name: tournamentToDelete.name,
          })}
          confirmLabel={i18n.t('app.dashboard.deleteTitle')}
          destructive
          onClose={() => setTournamentToDelete(undefined)}
          onConfirm={() => {
            removeTournament(tournamentToDelete.id);
            showToast(i18n.t('app.tournament.tournamentDeleted'));
            setTournamentToDelete(undefined);
          }}
        />
      )}
      <Button
        type="button"
        variant="outline"
        className="tournament-guide-button"
        aria-label={i18n.t('app.tournamentGuide.open')}
        onClick={() => setShowTournamentGuide(true)}
      >
        <CircleHelp size={20} aria-hidden />
        <span>{i18n.t('app.tournamentGuide.open')}</span>
      </Button>
      {showTournamentGuide && (
        <Modal
          title={i18n.t('app.tournamentGuide.title')}
          description={i18n.t('app.tournamentGuide.description')}
          dialogClassName="tournament-guide-dialog"
          onClose={() => setShowTournamentGuide(false)}
        >
          <ul className="tournament-guide__list">
            <li className="tournament-guide__item">
              <span className="tournament-guide__icon">
                <Users size={18} aria-hidden />
              </span>
              <div>
                <h3>{i18n.t('app.tournamentGuide.manualPlayers.title')}</h3>
                <p>{i18n.t('app.tournamentGuide.manualPlayers.description')}</p>
              </div>
            </li>
            <li className="tournament-guide__item">
              <span className="tournament-guide__icon">
                <BadgeCheck size={18} aria-hidden />
              </span>
              <div>
                <h3>{i18n.t('app.tournamentGuide.accountPlayers.title')}</h3>
                <p>{i18n.t('app.tournamentGuide.accountPlayers.description')}</p>
              </div>
            </li>
            <li className="tournament-guide__item">
              <span className="tournament-guide__icon">
                <Table size={18} aria-hidden />
              </span>
              <div>
                <h3>{i18n.t('app.tournamentGuide.rounds.title')}</h3>
                <p>{i18n.t('app.tournamentGuide.rounds.description')}</p>
              </div>
            </li>
            <li className="tournament-guide__item">
              <span className="tournament-guide__icon">
                <Trophy size={18} aria-hidden />
              </span>
              <div>
                <h3>{i18n.t('app.tournamentGuide.standings.title')}</h3>
                <p>{i18n.t('app.tournamentGuide.standings.description')}</p>
              </div>
            </li>
          </ul>
          <div className="mt-5 flex justify-end">
            <Button type="button" className={primary} onClick={() => setShowTournamentGuide(false)}>
              {i18n.t('app.tournamentGuide.close')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
