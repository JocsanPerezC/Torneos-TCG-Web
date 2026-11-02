import { podDuration } from '@/domain/timing';
import type { Pod, Standing, Tournament } from '@/domain/types';

export function isValidPodResult(pod: Pod): boolean {
  const results = pod.results ?? [];
  if (
    results.length !== pod.playerIds.length ||
    results.some(
      (r) =>
        r.points < 0 ||
        !Number.isInteger(r.points) ||
        r.kills < 0 ||
        r.kills > 5 ||
        !Number.isInteger(r.kills),
    )
  )
    return false;
  if (
    new Set(results.map((r) => r.playerId)).size !== pod.playerIds.length ||
    !results.every((r) => pod.playerIds.includes(r.playerId))
  )
    return false;
  return true;
}

export function hasCompletePodOutcomes(pod: Pod): boolean {
  return isValidPodResult(pod) && (pod.results ?? []).every((result) => result.outcome);
}

export function standings(tournament: Tournament): Standing[] {
  const stat = Object.fromEntries(
    tournament.players.map((player) => [
      player.id,
      {
        points: 0,
        kills: 0,
        roundsPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        opponents: [] as string[],
        winTimes: [] as number[],
      },
    ]),
  );
  for (const round of tournament.rounds)
    for (const pod of round.pods)
      if (isValidPodResult(pod)) {
        const hasCompleteOutcomes = hasCompletePodOutcomes(pod);
        for (const result of pod.results ?? []) {
          const entry = stat[result.playerId];
          entry.points += result.points;
          entry.kills += result.kills;
          entry.roundsPlayed++;
          entry.opponents.push(...pod.playerIds.filter((id) => id !== result.playerId));
          if (hasCompleteOutcomes) {
            const duration = podDuration(round, pod);
            if (result.outcome === 'win' && duration !== undefined) entry.winTimes.push(duration);
            if (result.outcome === 'win') entry.wins++;
            else if (result.outcome === 'loss') entry.losses++;
            else entry.draws++;
          }
        }
      }
  const rows = tournament.players.map((player) => {
    const { winTimes, ...totals } = stat[player.id];
    return {
      player,
      rank: 0,
      ...totals,
      averageWinTime: winTimes.length
        ? winTimes.reduce((sum, time) => sum + time, 0) / winTimes.length
        : undefined,
      winRate: 0,
      opponentStrength: 0,
    };
  });
  // Promedio de puntos de los rivales por cada rival enfrentado: no premia jugar más rondas
  // ni mesas más grandes.
  for (const row of rows)
    row.opponentStrength = row.opponents.length
      ? row.opponents.reduce((sum, id) => sum + (stat[id]?.points ?? 0), 0) / row.opponents.length
      : 0;
  for (const row of rows) {
    const decidedRounds = row.wins + row.losses + row.draws;
    row.winRate = decidedRounds ? ((row.wins + row.draws * 0.5) / decidedRounds) * 100 : 0;
  }
  rows.sort((a, b) => compareStandings(a, b) || a.player.tieBreaker - b.player.tieBreaker);
  // Quien empata en todos los criterios comparte el puesto (1, 2, 2, 4).
  const ranked: Standing[] = [];
  rows.forEach((row, index) => {
    const previous = ranked[index - 1];
    ranked.push({
      ...row,
      rank: previous && compareStandings(previous, row) === 0 ? previous.rank : index + 1,
    });
  });
  return ranked;
}

type RankedValues = Pick<
  Standing,
  'points' | 'wins' | 'draws' | 'losses' | 'winRate' | 'kills' | 'opponentStrength'
>;

/**
 * Criterios de la clasificación, en orden: puntos, victorias, empates, menos derrotas,
 * win rate, kills y promedio de puntos de los rivales. Devuelve 0 si empatan en todo.
 * Las funciones de estadísticas de Supabase replican este mismo orden.
 */
export function compareStandings(a: RankedValues, b: RankedValues) {
  const strength = b.opponentStrength - a.opponentStrength;
  return (
    b.points - a.points ||
    b.wins - a.wins ||
    b.draws - a.draws ||
    a.losses - b.losses ||
    b.winRate - a.winRate ||
    b.kills - a.kills ||
    (Math.abs(strength) < 1e-9 ? 0 : strength)
  );
}
