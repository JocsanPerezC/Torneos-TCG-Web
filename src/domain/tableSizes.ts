/** Finds the pod layout, preferring standard 3/4-player tables when possible. */
export function tableSizes(playerCount: number): number[] {
  if (!Number.isInteger(playerCount) || playerCount < 1) throw new Error('Se requiere al menos un jugador activo.')
  if (playerCount <= 5) return [playerCount]
  for (let fours = Math.floor(playerCount / 4); fours >= 0; fours--) {
    const remainder = playerCount - fours * 4
    if (remainder >= 0 && remainder % 3 === 0) return [...Array(fours).fill(4), ...Array(remainder / 3).fill(3)]
  }
  throw new Error('No es posible distribuir a los jugadores en mesas.')
}
