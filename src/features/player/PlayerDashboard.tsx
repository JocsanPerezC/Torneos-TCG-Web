import { useEffect, useState } from 'react';
import { Archive, ArrowRight, Play, Swords, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadPlayerTournaments, type PlayerTournament } from '@/data/playerRepository';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import { listDecks, type Deck } from '@/data/deckRepository';
import { ColorPips } from '@/features/decks/ColorPips';
import { TournamentDeckChooser } from '@/features/decks/TournamentDeckChooser';

export function PlayerDashboard() {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<PlayerTournament[]>();
  const [error, setError] = useState<string>();
  const [decks, setDecks] = useState<Deck[]>();
  const [choosingDeck, setChoosingDeck] = useState(false);

  useEffect(() => {
    let active = true;
    void loadPlayerTournaments()
      .then((items) => {
        if (active) setTournaments(items);
      })
      .catch((reason) => {
        if (active)
          setError(reason instanceof Error ? reason.message : t('app.playerDashboard.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, [t]);

  const activeTournament = tournaments?.find((tournament) => tournament.status === 'activo');
  // Ya se jugaron todas sus rondas: solo falta que el organizador lo cierre (o el cierre
  // automático, 24 horas después de la última ronda).
  const awaitingClose =
    activeTournament !== undefined &&
    activeTournament.completedRounds >= activeTournament.plannedRounds;
  const history = tournaments?.filter((tournament) => tournament.status === 'finalizado') ?? [];

  return (
    <div className="dashboard-board player-dashboard">
      <header className="dashboard-board__header">
        <div>
          <h1 className="flex items-center gap-3">
            <Trophy className="size-7 shrink-0 text-accent" aria-hidden="true" />
            {t('app.playerDashboard.title')}
          </h1>
        </div>
      </header>
      {!tournaments && !error && (
        <div className="app-loading-note">
          <i />
          <span>{t('app.common.loading')}</span>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {tournaments && (
        <>
          {activeTournament ? (
            <section className="dashboard-focus" aria-labelledby="next-tournament-title">
              <div>
                <span className="dashboard-focus__icon">
                  <Play aria-hidden="true" />
                </span>
                <p>{t('app.playerDashboard.nextTournament')}</p>
                <span
                  className={`dashboard-focus__status${awaitingClose ? ' is-awaiting-close' : ''}`}
                >
                  {awaitingClose
                    ? t('app.playerDashboard.statusAwaitingClose')
                    : t('app.playerDashboard.statusActive')}
                </span>
                <h2 id="next-tournament-title">{activeTournament.name}</h2>
                <span className="dashboard-focus__meta">
                  {activeTournament.format} ·{' '}
                  {t('app.playerDashboard.progress', {
                    current: activeTournament.roundCount,
                    total: activeTournament.plannedRounds,
                  })}
                </span>
                {/* Mazo del torneo: se elige o cambia hasta que empieza la primera ronda. */}
                <span className="dashboard-focus__deck">
                  <span>{t('app.decks.deckLabel')}</span>
                  <strong>{activeTournament.deck?.name ?? t('app.decks.noDeck')}</strong>
                  {activeTournament.deck?.commander && (
                    <ColorPips colors={activeTournament.deck.colors} />
                  )}
                  {!activeTournament.deckLocked && (
                    <button
                      type="button"
                      className="dashboard-focus__deck-change"
                      onClick={() => {
                        setChoosingDeck(true);
                        if (!decks)
                          void listDecks()
                            .then(setDecks)
                            .catch(() => setDecks([]));
                      }}
                    >
                      {t(activeTournament.deck ? 'app.decks.change' : 'app.decks.choose')}
                    </button>
                  )}
                </span>
              </div>
              <Button asChild className="app-button app-button--primary">
                <Link to={`/t/${activeTournament.publicSlug}`}>
                  {t('app.playerDashboard.openTournament')}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </section>
          ) : (
            <section className="dashboard-join-prompt" aria-labelledby="join-prompt-title">
              <span>
                <Swords aria-hidden="true" />
              </span>
              <div>
                <h2 id="join-prompt-title">{t('app.playerDashboard.joinPrompt')}</h2>
                <p>{t('app.playerDashboard.joinPromptDescription')}</p>
              </div>
              <Button asChild className="app-button app-button--primary">
                <Link to="/unirse">{t('app.playerDashboard.join')}</Link>
              </Button>
            </section>
          )}

          <section className="dashboard-history" aria-labelledby="history-title">
            <header>
              <span>
                <Archive aria-hidden="true" />
              </span>
              <div>
                <h2 id="history-title">{t('app.playerDashboard.history')}</h2>
              </div>
            </header>
            {history.length ? (
              <div className="dashboard-history__list">
                {history.map((tournament) => (
                  <Link
                    key={tournament.id}
                    to={`/t/${tournament.publicSlug}`}
                    className="dashboard-history__item"
                  >
                    <span>
                      <Trophy aria-hidden="true" />
                    </span>
                    <strong>{tournament.name}</strong>
                    <small>
                      {tournament.format} · {t('app.playerDashboard.statusFinished')}
                    </small>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="dashboard-history__empty">{t('app.playerDashboard.emptyHistory')}</p>
            )}
          </section>
        </>
      )}
      {choosingDeck && activeTournament && (
        <Modal
          title={t('app.decks.pickTitle')}
          description={activeTournament.name}
          onClose={() => setChoosingDeck(false)}
        >
          {decks ? (
            <TournamentDeckChooser
              tournamentId={activeTournament.id}
              decks={decks}
              currentDeckId={activeTournament.deckId}
              dismissLabel={t('app.common.cancel')}
              onDone={(changed) => {
                setChoosingDeck(false);
                if (!changed) return;
                showToast(t('app.decks.chosen'));
                void loadPlayerTournaments().then(setTournaments);
              }}
            />
          ) : (
            <div className="app-loading-note">
              <i />
              <span>{t('app.common.loading')}</span>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
