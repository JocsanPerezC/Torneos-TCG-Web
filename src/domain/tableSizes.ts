/** Finds the pod layout, preferring standard 3/4-player tables when possible. */
export function tableSizes(playerCount: number, maxTables = Number.POSITIVE_INFINITY): number[] {
  if (!Number.isInteger(playerCount) || playerCount < 1) throw new Error('Se requiere al menos un jugador activo.')
  if (maxTables !== Number.POSITIVE_INFINITY && (!Number.isInteger(maxTables) || maxTables < 1)) throw new Error('El máximo de mesas debe ser al menos uno.')
  if (Math.ceil(playerCount / 5) > maxTables) throw new Error('El máximo de mesas no permite distribuir a todos los jugadores.')
  if (playerCount <= 5) return [playerCount]
  for (let fours = Math.floor(playerCount / 4); fours >= 0; fours--) {
    const remainder = playerCount - fours * 4
    if (remainder >= 0 && remainder % 3 === 0) {
      const preferred = [...Array(fours).fill(4), ...Array(remainder / 3).fill(3)]
      if (preferred.length <= maxTables) return preferred
      break
    }
  }
  const tableCount = Math.min(maxTables, Math.floor(playerCount / 3))
  const base = Math.floor(playerCount / tableCount)
  const extra = playerCount % tableCount
  return Array.from({ length: tableCount }, (_, index) => base + (index < extra ? 1 : 0))
}
