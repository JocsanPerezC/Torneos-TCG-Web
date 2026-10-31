import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  loadPlayerStatistics,
  loadPlayerTournamentResults,
  loadRecentResults,
  type PlayerStatistics,
  type PlayerTournamentResult,
  type RecentResult,
} from '@/data/playerRepository';
import {
  CountUp,
  EmptyMark,
  KillTally,
  RoundPips,
} from '@/features/tournaments/components/BattleGlyphs';

export type PlayerStatisticsData = {
  statistics: PlayerStatistics;
  history: PlayerTournamentResult[];
  recent: RecentResult[];
};

export function PlayerStatisticsPage() {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState<PlayerStatisticsData>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    // El historial y la forma reciente son extras: si fallan, el resumen se muestra igual.
    void Promise.all([
      loadPlayerStatistics(),
      loadPlayerTournamentResults().catch(() => []),
      loadRecentResults().catch(() => []),
    ])
      .then(([statistics, history, recent]) => {
        if (active) setLoaded({ statistics, history, recent });
      })
      .catch((reason) => {
        if (active)
          setError(reason instanceof Error ? reason.message : t('app.playerStatistics.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <div className="dashboard-board player-statistics">
      <header className="dashboard-board__header">
        <div>
          <h1>{t('app.playerStatistics.title')}</h1>
        </div>
      </header>
      {!loaded && !error && (
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
      {loaded && <StatisticsLedger {...loaded} />}
    </div>
  );
}

/** Resumen visual de un jugador; exportado también para el muestrario. */
export function StatisticsLedger({ statistics, history, recent }: PlayerStatisticsData) {
  const { t, i18n } = useTranslation();
  const decimal = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formatDecimal = (value: number) => decimal.format(value);
  const formatDate = (value: string) => date.format(new Date(value));

  if (statistics.tournamentsPlayed === 0)
    return <LedgerEmpty message={t('app.playerStatistics.empty')} />;

  const decided = statistics.wins + statistics.losses + statistics.draws;
  if (decided === 0 && statistics.roundsPlayed === 0)
    return <LedgerEmpty message={t('app.playerStatistics.noRounds')} />;

  const winRate = decided
    ? Math.round(((statistics.wins + statistics.draws * 0.5) / decided) * 100)
    : 0;
  const perRound = (value: number) =>
    t('app.playerStatistics.perRound', {
      value: formatDecimal(statistics.roundsPlayed ? value / statistics.roundsPlayed : 0),
    });
  const finished = history.filter((entry) => entry.isFinal && entry.roundsPlayed > 0);
  const bestPosition = finished.length
    ? Math.min(...finished.map((entry) => entry.position))
    : undefined;
  const tournamentWins = finished.filter((entry) => entry.position === 1).length;
  const results = [
    { key: 'win', value: statistics.wins, label: t('app.common.wins') },
    { key: 'draw', value: statistics.draws, label: t('app.common.draws') },
    { key: 'loss', value: statistics.losses, label: t('app.common.losses') },
  ] as const;

  return (
    <section className="battle-ledger player-ledger" aria-label={t('app.playerStatistics.title')}>
      <div className="battle-ledger__grid">
        <article className="battle-note player-note--winrate">
          <div className="battle-note__stamp">01 / {t('app.common.winRate')}</div>
          <div className="battle-note__hero-number" title={t('app.common.winRateHelp')}>
            <CountUp value={winRate} />
            <small>%</small>
          </div>
          {decided > 0 ? (
            <>
              <div className="player-results-bar" aria-hidden="true">
                {results.map(
                  (result) =>
                    result.value > 0 && (
                      <span
                        key={result.key}
                        className={`is-${result.key}`}
                        style={{ flexGrow: result.value }}
                      />
                    ),
                )}
              </div>
              <ul className="player-results-legend">
                {results.map((result) => (
                  <li key={result.key} className={`is-${result.key}`}>
                    {result.label} <strong>{result.value}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyMark message={t('app.playerStatistics.noRecent')} />
          )}
        </article>

        <article className="battle-note player-note--form">
          <div className="battle-note__stamp">02 / {t('app.playerStatistics.recentForm')}</div>
          {recent.length ? (
            <>
              <ol className="player-form">
                {recent.map((result, index) => (
                  <li
                    key={index}
                    className={`is-${result.outcome}`}
                    title={`${result.tournamentName} · ${t('app.common.round', { number: result.roundNumber })}`}
                  >
                    <span aria-hidden="true">
                      {t(`app.playerStatistics.outcome.${result.outcome}`)}
                    </span>
                    <span className="sr-only">
                      {t(`app.common.${result.outcome}`)}, {result.tournamentName},{' '}
                      {t('app.common.round', { number: result.roundNumber })}
                    </span>
                  </li>
                ))}
              </ol>
              <p>
                {t('app.playerStatistics.lastResult', {
                  tournament: recent[0].tournamentName,
                  round: recent[0].roundNumber,
                })}
              </p>
            </>
          ) : (
            <EmptyMark message={t('app.playerStatistics.noRecent')} />
          )}
        </article>

        <article className="battle-note player-note--tournaments">
          <div className="battle-note__stamp">
            03 / {t('app.playerStatistics.tournamentsPlayed')}
          </div>
          <strong className="battle-score">
            <CountUp value={statistics.tournamentsPlayed} />
          </strong>
          <RoundPips count={statistics.roundsPlayed} />
          <p>{t('app.playerStatistics.roundsPlayedValue', { count: statistics.roundsPlayed })}</p>
        </article>

        <article className="battle-note player-note--points">
          <div className="battle-note__stamp">04 / {t('app.playerStatistics.points')}</div>
          <strong className="battle-score">
            <CountUp value={statistics.points} />
          </strong>
          <p>{perRound(statistics.points)}</p>
        </article>

        <article className="battle-note player-note--kills">
          <div className="battle-note__stamp">05 / {t('app.playerStatistics.kills')}</div>
          <strong className="battle-score">
            <CountUp value={statistics.kills} />
          </strong>
          <KillTally count={statistics.kills} />
          <p>{perRound(statistics.kills)}</p>
        </article>

        <article className="battle-note player-note--best">
          <div className="battle-note__stamp">06 / {t('app.playerStatistics.bestResult')}</div>
          {bestPosition ? (
            <div className="player-best">
              <svg className="battle-crown" viewBox="0 0 72 42" aria-hidden="true">
                <path d="M8 8 22 22 36 5l14 17L64 8l-5 27H13L8 8Z" />
                <path d="M14 39h44" />
              </svg>
              <strong className="battle-score">#{bestPosition}</strong>
              <div>
                <p>
                  {t('app.playerStatistics.bestResultCopy', {
                    wins: tournamentWins,
                    podiums: statistics.podiums,
                  })}
                </p>
                <small>{t('app.playerStatistics.podiumsHelp')}</small>
              </div>
            </div>
          ) : (
            <EmptyMark message={t('app.playerStatistics.noBestResult')} />
          )}
        </article>
      </div>

      {history.length > 0 && (
        <section className="player-history" aria-labelledby="player-history-title">
          <h2 id="player-history-title">{t('app.playerStatistics.history')}</h2>
          <ol>
            {history.map((entry) => (
              <li key={entry.id}>
                <Link to={`/t/${entry.publicSlug}`} className="player-history__row">
                  <span
                    className={`player-history__position${entry.isFinal && entry.position <= 3 && entry.roundsPlayed > 0 ? ` is-podium-${entry.position}` : ''}`}
                  >
                    <strong>{entry.roundsPlayed ? `#${entry.position}` : '—'}</strong>
                    <small>
                      {t('app.playerStatistics.positionOf', { count: entry.playerCount })}
                    </small>
                  </span>
                  <span className="player-history__name">
                    <strong>{entry.name}</strong>
                    <small>
                      {entry.format} · {formatDate(entry.createdAt)}
                      {!entry.isFinal && (
                        <em className="player-history__live">
                          {t('app.playerStatistics.provisional')}
                        </em>
                      )}
                    </small>
                  </span>
                  <span className="player-history__record" aria-label={t('app.common.outcome')}>
                    <span className="is-win">
                      {entry.wins}
                      {t('app.playerStatistics.outcome.win')}
                    </span>
                    <span className="is-draw">
                      {entry.draws}
                      {t('app.playerStatistics.outcome.draw')}
                    </span>
                    <span className="is-loss">
                      {entry.losses}
                      {t('app.playerStatistics.outcome.loss')}
                    </span>
                  </span>
                  <span className="player-history__points">
                    <strong>{entry.points}</strong>
                    <small>{t('app.common.points')}</small>
                  </span>
                  <ChevronRight aria-hidden="true" className="player-history__arrow" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}

function LedgerEmpty({ message }: { message: string }) {
  return (
    <div className="battle-ledger__empty">
      <svg viewBox="0 0 90 58" aria-hidden="true">
        <path d="M15 46 45 10l30 36M24 46h42M36 34h18" />
      </svg>
      <p>{message}</p>
    </div>
  );
}
