import { useEffect, useState } from 'react';
import { Archive, Play, Plus, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadPlayerTournaments, type PlayerTournament } from '../data/playerRepository';
import { Button } from '../components/ui/button';

export function PlayerDashboard() {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<PlayerTournament[]>();
  const [error, setError] = useState<string>();

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

  return (
    <div className="dashboard-board">
      <header className="dashboard-board__header">
        <div>
          <h1>{t('app.playerDashboard.title')}</h1>
          <p className="mb-0 mt-2 text-sm text-muted-foreground">
            {t('app.playerDashboard.description')}
          </p>
        </div>
        <Button asChild className="app-button app-button--primary">
          <Link to="/unirse">
            <Plus size={16} aria-hidden="true" />
            {t('app.playerDashboard.join')}
          </Link>
        </Button>
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
      {(['activo', 'finalizado'] as const).map((status) => {
        const items = tournaments?.filter((tournament) => tournament.status === status) ?? [];
        const Icon = status === 'activo' ? Play : Archive;
        return (
          <section key={status} className="dashboard-shelf">
            <header>
              <span>
                <Icon size={14} aria-hidden="true" />
              </span>
              <h2>
                {status === 'activo'
                  ? t('app.playerDashboard.active')
                  : t('app.playerDashboard.history')}
              </h2>
            </header>
            <div className="dashboard-shelf__grid">
              {items.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/t/${tournament.publicSlug}`}
                  className="tournament-ticket"
                >
                  <div className="tournament-ticket__top">
                    <span>{tournament.format}</span>
                    <span className="app-badge border border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]">
                      {status === 'activo'
                        ? t('app.common.activeStatus')
                        : t('app.common.finished')}
                    </span>
                  </div>
                  <strong>{tournament.name}</strong>
                  <p>
                    {t('app.playerDashboard.progress', {
                      current: tournament.roundCount,
                      total: tournament.plannedRounds,
                    })}
                  </p>
                  <div className="tournament-ticket__bottom">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {tournament.participantName}
                    </span>
                    <Trophy size={18} className="text-accent" aria-hidden="true" />
                  </div>
                </Link>
              ))}
              {tournaments && items.length === 0 && (
                <div className="app-empty-state">
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <p>
                    {status === 'activo'
                      ? t('app.playerDashboard.emptyActive')
                      : t('app.playerDashboard.emptyHistory')}
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
