import { describe, expect, it } from 'vitest'
import { isValidPodResult } from './scoring'

describe('empates', () => {
  it('requiere al menos dos jugadores vivos', () => {
    expect(isValidPodResult({
      id: 'pod-1',
      number: 1,
      playerIds: ['a', 'b', 'c'],
      resultType: 'empate',
      results: [
        { playerId: 'a', position: 1, kills: 0 },
        { playerId: 'b', position: 1, kills: 0, dead: true },
        { playerId: 'c', position: 1, kills: 0, dead: true },
      ],
    })).toBe(false)
  })
})
