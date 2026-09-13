import type { Pod, ScoringRules, Standing, Tournament } from './types'

export function podPoints(pod: Pod, rules: ScoringRules): Record<string, number> {
  const points: Record<string, number> = {}
  for (const result of pod.results ?? []) {
    points[result.playerId] = pod.resultType === 'combo'
      ? result.position === 1 ? rules.comboWinner : rules.comboOther
      : [rules.first, rules.second, rules.third, rules.fourth][result.position - 1] ?? 0
  }
  return points
}

export function isValidPodResult(pod: Pod): boolean {
  const results = pod.results ?? []
  if (!pod.resultType || results.length !== pod.playerIds.length || results.some(r => r.kills < 0 || !Number.isInteger(r.kills))) return false
  const positions = results.map(r => r.position).sort((a, b) => a - b)
  return positions.every((position, index) => position === index + 1) && new Set(results.map(r => r.playerId)).size === pod.playerIds.length && results.every(r => pod.playerIds.includes(r.playerId))
}

export function standings(tournament: Tournament): Standing[] {
  const stat = Object.fromEntries(tournament.players.map(player => [player.id, { points: 0, wins: 0, kills: 0, roundsPlayed: 0, opponents: [] as string[] }]))
  for (const round of tournament.rounds) for (const pod of round.pods) if (isValidPodResult(pod)) {
    const points = podPoints(pod, tournament.scoring)
    for (const result of pod.results ?? []) {
      const entry = stat[result.playerId]
      entry.points += points[result.playerId]; entry.kills += result.kills; entry.roundsPlayed++
      if (result.position === 1) entry.wins++
      entry.opponents.push(...pod.playerIds.filter(id => id !== result.playerId))
    }
  }
  const rows = tournament.players.map(player => ({ player, rank: 0, ...stat[player.id], opponentStrength: 0 }))
  for (const row of rows) row.opponentStrength = row.opponents.reduce((sum, id) => sum + (stat[id]?.points ?? 0), 0)
  rows.sort((a, b) => b.points - a.points || b.wins - a.wins || b.opponentStrength - a.opponentStrength || b.kills - a.kills || a.player.tieBreaker - b.player.tieBreaker)
  return rows.map((row, index) => ({ ...row, rank: index + 1 }))
}
