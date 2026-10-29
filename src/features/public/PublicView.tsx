import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/state/AuthContext';
import { loadPublicTournament } from '@/data/tournamentRepository';
import type { Tournament } from '@/domain/types';
import { ArrowLeft } from 'lucide-react';
import { tournamentStatistics } from '@/domain/statistics';
import { standings } from '@/domain/scoring';
import { BattleLedger } from '@/features/tournaments/components/BattleLedger';
import { Badge } from '@/components/ui/Badge';
import { RoundTimer } from '@/features/tournaments/components/RoundTimer';
import { outcomeLabel } from '@/features/tournaments/components/outcomeLabel';
import { Avatar } from '@/components/ui/Avatar';
import i18n from '@/i18n';

export function PublicView() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void loadPublicTournament(slug ?? '')
      .then((data) => {
        if (active) setTournament(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  if (loading)
    return (
      <main className="public-scoreboard public-scoreboard--status">
        <div className="app-loading-note">
          <i />
          <span>{i18n.t('app.public.loading')}</span>
        </div>
      </main>
    );
  if (!tournament)
    return (
      <main className="public-scoreboard public-scoreboard--status">
        <div className="app-empty-state">
          <span aria-hidden>?</span>
          <p>{i18n.t('app.public.unavailable')}</p>
        </div>
      </main>
    );
  const round =
    tournament.rounds.find((item) => item.id === searchParams.get('round')) ??
    tournament.rounds.at(-1);
  const viewParam = searchParams.get('view');
  const view = viewParam === 'podium' || viewParam === 'statistics' ? viewParam : 'round';
  const publicPath = (targetView: typeof view, roundId = round?.id) => {
    const params = new URLSearchParams({ view: targetView });
    if (roundId) params.set('round', roundId);
    return `/t/${tournament.publicSlug}?${params.toString()}`;
  };
  const names = Object.fromEntries(tournament.players.map((player) => [player.id, player.name]));
  const rows = standings(tournament);
  return (
    <main className="public-scoreboard">
      <div className="public-scoreboard__wrap">
        <header className="public-scoreboard__masthead">
          <Link to={user ? '/dashboard' : '/'} className="public-scoreboard__back">
            <ArrowLeft size={16} aria-hidden />
            {i18n.t('app.public.back')}
          </Link>
          <a href="/" className="public-scoreboard__brand">
            <img src="/edh-tournaments-icon.svg" alt="" />
            EDH Tournaments
          </a>
          <p>{i18n.t('app.public.eyebrow')}</p>
          <h1>{tournament.name}</h1>
          <span>{tournament.format}</span>
        </header>
        {tournament.information && (
          <section className="public-scoreboard__notice">
            <span aria-hidden>⌁</span>
            <div>
              <h2>{i18n.t('app.tournament.information')}</h2>
              <p>{tournament.information}</p>
            </div>
          </section>
        )}
        <nav className="public-scoreboard__view-nav" aria-label={i18n.t('app.public.sections')}>
          {(
            [
              ['round', i18n.t('app.public.currentRound')],
              ['podium', i18n.t('app.public.podium')],
              ['statistics', i18n.t('app.public.statistics')],
            ] as const
          ).map(([targetView, label]) => (
            <Link
              key={targetView}
              to={publicPath(targetView)}
              className={view === targetView ? 'is-current' : undefined}
              aria-current={view === targetView ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        {view === 'round' && tournament.rounds.length > 1 && (
          <nav className="public-round-picker" aria-label={i18n.t('app.public.rounds')}>
            {tournament.rounds.map((item) => (
              <Link
                key={item.id}
                to={publicPath('round', item.id)}
                className={item.id === round?.id ? 'is-current' : undefined}
                aria-current={item.id === round?.id ? 'page' : undefined}
              >
                {i18n.t('app.common.round', { number: item.number })}
              </Link>
            ))}
          </nav>
        )}
        {view === 'round' &&
          (round ? (
            <section className="public-round">
              <header>
                <div className="public-round__heading">
                  <p>{i18n.t('app.common.round', { number: round.number })}</p>
                  <Badge>{round.status}</Badge>
                </div>
                <RoundTimer round={round} />
              </header>
              <div className="public-round__tables">
                {round.pods.map((pod) => (
                  <article className="public-table" key={pod.id}>
                    <h3>{i18n.t('app.common.table', { number: pod.number })}</h3>
                    <div>
                      {pod.playerIds.map((playerId) => {
                        const result = pod.results?.find((item) => item.playerId === playerId);
                        return (
                          <section key={playerId}>
                            <span className="public-table__avatar" aria-hidden>
                              {names[playerId]?.slice(0, 1).toUpperCase()}
                            </span>
                            <strong>{names[playerId]}</strong>
                            {result ? (
                              <>
                                <b>
                                  {result.points} <small>{i18n.t('app.common.points')}</small>
                                </b>
                                <em>{result.kills} ☠</em>
                                <i
                                  className={`public-outcome public-outcome--${result.outcome ?? 'pending'}`}
                                >
                                  {outcomeLabel(result.outcome)}
                                </i>
                              </>
                            ) : (
                              <i className="public-outcome public-outcome--pending">
                                {i18n.t('app.common.noResults')}
                              </i>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="app-empty-state">
              <span aria-hidden>♙</span>
              <p>{i18n.t('app.public.firstRound')}</p>
            </section>
          ))}
        {view === 'podium' && rows.length > 0 && (
          <section className="public-podium" aria-labelledby="public-podium-title">
            <h2 id="public-podium-title">{i18n.t('app.public.podium')}</h2>
            <ol className="standings-podium">
              {rows.slice(0, 3).map((row) => (
                <li
                  className={`standings-podium__place standings-podium__place--${row.rank}`}
                  key={row.player.id}
                >
                  <span className="standings-podium__rank">#{row.rank}</span>
                  <Avatar
                    name={row.player.name}
                    src={row.player.avatarUrl}
                    className="standings-podium__avatar"
                  />
                  <strong>{row.player.name}</strong>
                  <b>
                    {row.points} <small>{i18n.t('app.common.points')}</small>
                  </b>
                  <em>
                    {row.kills} ☠ · {row.winRate.toFixed(1)}%
                  </em>
                </li>
              ))}
            </ol>
            <div className="standings-table public-podium__standings">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{i18n.t('app.common.name')}</th>
                    <th>{i18n.t('app.common.points')}</th>
                    <th>{i18n.t('app.common.wins')}</th>
                    <th>{i18n.t('app.common.losses')}</th>
                    <th>{i18n.t('app.common.draws')}</th>
                    <th>{i18n.t('app.common.winRate')}</th>
                    <th>{i18n.t('app.common.kills')}</th>
                    <th>{i18n.t('app.tournament.opponentStrength')}</th>
                    <th>{i18n.t('app.tournament.rounds')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      className={row.rank <= 3 ? `is-podium is-podium--${row.rank}` : ''}
                      key={row.player.id}
                    >
                      <td>{row.rank}</td>
                      <td>
                        <Avatar
                          name={row.player.name}
                          src={row.player.avatarUrl}
                          className="standings-table__avatar"
                        />
                        {row.player.name}
                        {!row.player.active && <small>{i18n.t('app.common.withdrawn')}</small>}
                      </td>
                      <td>
                        <strong>{row.points}</strong>
                      </td>
                      <td>{row.wins}</td>
                      <td>{row.losses}</td>
                      <td>{row.draws}</td>
                      <td>{row.winRate.toFixed(1)}%</td>
                      <td>{row.kills}</td>
                      <td>{row.opponentStrength}</td>
                      <td>{row.roundsPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {view === 'statistics' && (
          <section className="public-scoreboard__statistics">
            <BattleLedger statistics={tournamentStatistics(tournament)} />
          </section>
        )}
      </div>
    </main>
  );
}
