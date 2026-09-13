/** Finds the valid 3/4-player pod layout, preferring the greatest number of pods of four. */
export function tableSizes(playerCount: number): number[] {
  if (!Number.isInteger(playerCount) || playerCount < 6) throw new Error('Se requieren al menos seis jugadores activos.')
  for (let fours = Math.floor(playerCount / 4); fours >= 0; fours--) {
    const remainder = playerCount - fours * 4
    if (remainder >= 0 && remainder % 3 === 0) return [...Array(fours).fill(4), ...Array(remainder / 3).fill(3)]
  }
  throw new Error('No es posible distribuir a los jugadores en mesas de tres o cuatro.')
}
