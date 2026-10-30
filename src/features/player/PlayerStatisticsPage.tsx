import { useEffect, useState } from 'react';
import { BarChart3, Crown, Medal, Swords, Target, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loadPlayerStatistics, type PlayerStatistics } from '@/data/playerRepository';

type Statistic = {
  label: string;
  value: number;
  kind: 'participation' | 'result' | 'performance';
};

export function PlayerStatisticsPage() {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<PlayerStatistics>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void loadPlayerStatistics()
      .then((items) => {
        if (active) setStatistics(items);
      })
      .catch((reason) => {
        if (active)
          setError(reason instanceof Error ? reason.message : t('app.playerStatistics.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, [t]);

  const groups = statistics
    ? [
        {
          title: t('app.playerStatistics.participation'),
          icon: Trophy,
          values: [
            {
              label: t('app.playerStatistics.tournamentsPlayed'),
              value: statistics.tournamentsPlayed,
              kind: 'participation',
            },
            {
              label: t('app.playerStatistics.roundsPlayed'),
              value: statistics.roundsPlayed,
              kind: 'participation',
            },
          ] satisfies Statistic[],
        },
        {
          title: t('app.playerStatistics.results'),
          icon: Swords,
          values: [
            { label: t('app.playerStatistics.wins'), value: statistics.wins, kind: 'result' },
            { label: t('app.playerStatistics.losses'), value: statistics.losses, kind: 'result' },
            { label: t('app.playerStatistics.draws'), value: statistics.draws, kind: 'result' },
          ] satisfies Statistic[],
        },
        {
          title: t('app.playerStatistics.performance'),
          icon: Target,
          values: [
            {
              label: t('app.playerStatistics.points'),
              value: statistics.points,
              kind: 'performance',
            },
            {
              label: t('app.playerStatistics.kills'),
              value: statistics.kills,
              kind: 'performance',
            },
            {
              label: t('app.playerStatistics.podiums'),
              value: statistics.podiums,
              kind: 'performance',
            },
          ] satisfies Statistic[],
        },
      ]
    : [];

  return (
    <div className="dashboard-board player-statistics">
      <header className="dashboard-board__header">
        <div>
          <h1>{t('app.playerStatistics.title')}</h1>
          <p className="mb-0 mt-2 text-sm text-muted-foreground">
            {t('app.playerStatistics.description')}
          </p>
        </div>
      </header>
      {!statistics && !error && (
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
      {statistics && (
        <section
          className="player-statistics__record app-panel"
          aria-labelledby="statistics-record-title"
        >
          <header>
            <div>
              <h2 id="statistics-record-title">{t('app.playerStatistics.record')}</h2>
              <p>{t('app.playerStatistics.recordDescription')}</p>
            </div>
            <BarChart3 aria-hidden="true" />
          </header>
          {statistics.tournamentsPlayed === 0 ? (
            <p className="player-statistics__empty">{t('app.playerStatistics.empty')}</p>
          ) : (
            <div className="player-statistics__groups">
              {groups.map((group) => {
                const Icon = group.icon;
                return (
                  <section key={group.title} aria-label={group.title}>
                    <h3>
                      <Icon aria-hidden="true" />
                      {group.title}
                    </h3>
                    <dl>
                      {group.values.map((statistic) => (
                        <div key={statistic.label} className={`is-${statistic.kind}`}>
                          <dt>{statistic.label}</dt>
                          <dd>{statistic.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              })}
            </div>
          )}
          {statistics.tournamentsPlayed > 0 && (
            <footer>
              <Crown aria-hidden="true" />
              <span>{t('app.playerStatistics.podiumsHelp')}</span>
              <Medal aria-hidden="true" />
            </footer>
          )}
        </section>
      )}
    </div>
  );
}
