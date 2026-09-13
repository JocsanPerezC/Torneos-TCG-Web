import { tableSizes } from './tableSizes'
import type { Player, Round } from './types'

const random = (seed: number) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const shuffled = <T,>(items: T[], seed: number) => { const output = [...items]; const rnd = random(seed); for (let i = output.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [output[i], output[j]] = [output[j], output[i]] }; return output }

export function pairCost(groups: string[][], previous: Round[], points: Record<string, number>): number {
  const encounters = new Map<string, number>()
  for (const round of previous) for (const pod of round.pods) for (let i = 0; i < pod.playerIds.length; i++) for (let j = i + 1; j < pod.playerIds.length; j++) {
    const key = [pod.playerIds[i], pod.playerIds[j]].sort().join(':'); encounters.set(key, (encounters.get(key) ?? 0) + 1)
  }
  return groups.reduce((total, group) => total + group.reduce((sum, p, i) => sum + group.slice(i + 1).reduce((s, q) => s + 100 * (encounters.get([p, q].sort().join(':')) ?? 0) + Math.abs((points[p] ?? 0) - (points[q] ?? 0)), 0), 0), 0)
}

/** Deterministic multi-shuffle optimiser. Repeats dominate score proximity in its cost. */
export function makePairings(players: Player[], previous: Round[], points: Record<string, number>, seed: number): string[][] {
  const sizes = tableSizes(players.length); let best: string[][] = []; let bestCost = Infinity
  const ranked = [...players].sort((a, b) => (points[b.id] ?? 0) - (points[a.id] ?? 0))
  for (let attempt = 0; attempt < 160; attempt++) {
    const source = attempt === 0 ? ranked : shuffled(ranked, seed + attempt)
    const groups: string[][] = []; let cursor = 0
    for (const size of sizes) { groups.push(source.slice(cursor, cursor + size).map(p => p.id)); cursor += size }
    const cost = pairCost(groups, previous, points)
    if (cost < bestCost) { best = groups; bestCost = cost }
  }
  return best
}
