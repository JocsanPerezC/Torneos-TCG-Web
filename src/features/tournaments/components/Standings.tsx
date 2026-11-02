import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useTournaments } from '@/state/TournamentContext';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { primary } from '@/components/ui/classes';
import { formatDuration } from '@/domain/timing';
import i18n from '@/i18n';

export function Standings() {
  const { id } = useParams();
  const rows = useTournaments().standingsFor(id!);
  const previousRanks = useRef(new Map<string, number>());
  const [movedRankIds, setMovedRankIds] = useState<string[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const movedRanksTimer = useRef<number | undefined>(undefined);
  const opponentHelp = i18n.t('app.tournament.opponentHelp');
  const winRateHelp = i18n.t('app.common.winRateHelp');
  const averageWinHelp = i18n.t('app.tournament.averageWinTimeHelp');
  useEffect(() => {
    const nextRanks = new Map(rows.map((row) => [row.player.id, row.rank]));
    if (!previousRanks.current.size) {
      previousRanks.current = nextRanks;
      return;
    }
    const changed = rows
      .filter((row) => previousRanks.current.get(row.player.id) !== row.rank)
      .map((row) => row.player.id);
    previousRanks.current = nextRanks;
    if (!changed.length) return;
    setMovedRankIds(changed);
    if (movedRanksTimer.current) window.clearTimeout(movedRanksTimer.current);
    movedRanksTimer.current = window.setTimeout(() => setMovedRankIds([]), 320);
  }, [rows]);
  useEffect(
    () => () => {
      if (movedRanksTimer.current) window.clearTimeout(movedRanksTimer.current);
    },
    [],
  );
  return (
    <section className="standings-board">
      <header>
        <h2>
          {i18n.t('app.tournament.standings')}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="app-help"
            aria-label={i18n.t('app.tournament.standingsInfo.button')}
            aria-haspopup="dialog"
            title={i18n.t('app.tournament.standingsInfo.button')}
            onClick={() => setShowInfo(true)}
          >
            <Info aria-hidden />
          </Button>
        </h2>
      </header>
      {showInfo && (
        <Modal
          title={i18n.t('app.tournament.standingsInfo.title')}
          description={i18n.t('app.tournament.standingsInfo.description')}
          onClose={() => setShowInfo(false)}
        >
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
            {(['points', 'results', 'winRate', 'kills', 'opponents', 'shared'] as const).map(
              (step) => (
                <li key={step}>{i18n.t(`app.tournament.standingsInfo.${step}`)}</li>
              ),
            )}
          </ol>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {i18n.t('app.tournament.standingsInfo.outcomes')}
          </p>
          <div className="mt-5 flex justify-end">
            <Button className={primary} onClick={() => setShowInfo(false)}>
              {i18n.t('app.tournament.standingsInfo.close')}
            </Button>
          </div>
        </Modal>
      )}
      {rows.length > 0 && (
        <ol className="standings-podium">
          {rows.slice(0, 3).map((row) => (
            <li
              className={`standings-podium__place standings-podium__place--${row.rank} ${
                movedRankIds.includes(row.player.id) ? 'standings-row--moved' : ''
              }`}
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
      )}
      <div className="standings-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{i18n.t('app.common.name')}</th>
              <th>{i18n.t('app.common.points')}</th>
              <th>{i18n.t('app.common.wins')}</th>
              <th>{i18n.t('app.common.losses')}</th>
              <th>{i18n.t('app.common.draws')}</th>
              <th>
                <span>
                  {i18n.t('app.common.winRate')}
                  <span
                    title={winRateHelp}
                    aria-label={winRateHelp}
                    role="img"
                    className="app-help app-help--static"
                  >
                    <Info size={15} strokeWidth={2} />
                  </span>
                </span>
              </th>
              <th>{i18n.t('app.common.kills')}</th>
              <th>
                <span>
                  {i18n.t('app.tournament.opponentStrength')}
                  <span
                    title={opponentHelp}
                    aria-label={opponentHelp}
                    role="img"
                    className="app-help app-help--static"
                  >
                    <Info size={15} strokeWidth={2} />
                  </span>
                </span>
              </th>
              <th>
                <span>
                  {i18n.t('app.tournament.averageWinTime')}
                  <span
                    title={averageWinHelp}
                    aria-label={averageWinHelp}
                    role="img"
                    className="app-help app-help--static"
                  >
                    <Info size={15} strokeWidth={2} />
                  </span>
                </span>
              </th>
              <th>{i18n.t('app.tournament.rounds')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className={`${row.rank <= 3 ? `is-podium is-podium--${row.rank}` : ''} ${
                  movedRankIds.includes(row.player.id) ? 'standings-row--moved' : ''
                }`}
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
                <td>{row.opponentStrength.toFixed(1)}</td>
                <td>
                  {row.averageWinTime !== undefined ? formatDuration(row.averageWinTime) : '—'}
                </td>
                <td>{row.roundsPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
