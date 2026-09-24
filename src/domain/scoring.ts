import type { Pod, Standing, Tournament } from './types';

export function isValidPodResult(pod: Pod): boolean {
  const results = pod.results ?? [];
  if (
    results.length !== pod.playerIds.length ||
    results.some(
      (r) =>
        r.points < 0 ||
        !Number.isInteger(r.points) ||
        r.kills < 0 ||
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
      { points: 0, kills: 0, roundsPlayed: 0, wins: 0, losses: 0, draws: 0, opponents: [] as string[] },
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
            if (result.outcome === 'win') entry.wins++;
            else if (result.outcome === 'loss') entry.losses++;
            else entry.draws++;
          }
        }
      }
  const rows = tournament.players.map((player) => ({
    player,
    rank: 0,
    ...stat[player.id],
    winRate: 0,
    opponentStrength: 0,
  }));
  for (const row of rows)
    row.opponentStrength = row.opponents.reduce((sum, id) => sum + (stat[id]?.points ?? 0), 0);
  for (const row of rows) {
    const decidedRounds = row.wins + row.losses + row.draws;
    row.winRate = decidedRounds ? ((row.wins + row.draws * 0.5) / decidedRounds) * 100 : 0;
  }
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.opponentStrength - a.opponentStrength ||
      b.kills - a.kills ||
      a.player.tieBreaker - b.player.tieBreaker,
  );
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}
