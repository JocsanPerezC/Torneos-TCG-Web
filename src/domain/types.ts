export type TournamentStatus = 'activo' | 'finalizado'
export type RoundStatus = 'borrador' | 'activa' | 'completada'
export type ResultOutcome = 'win' | 'loss' | 'draw'
export interface Player { id: string; name: string; active: boolean; tieBreaker: number; profileId?: string; avatarUrl?: string }
export interface Result { playerId: string; points: number; kills: number; outcome?: ResultOutcome }
export interface Pod { id: string; number: number; playerIds: string[]; results?: Result[]; notes?: string }
export interface Round { id: string; number: number; status: RoundStatus; seed: number; startedAt?: string; endedAt?: string; pods: Pod[] }
export interface Tournament {
  id: string; ownerId: string; name: string; format: string; information: string; plannedRounds: number; status: TournamentStatus;
  isPublic: boolean; publicSlug: string; maxPlayers: number; maxTables: number; players: Player[]; rounds: Round[]; createdAt: string
}
export interface Standing { player: Player; rank: number; points: number; kills: number; roundsPlayed: number; wins: number; losses: number; draws: number; winRate: number; opponentStrength: number }

export const uid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()

  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function')
    crypto.getRandomValues(bytes)
  else
    for (let index = 0; index < bytes.length; index += 1)
      bytes[index] = Math.floor(Math.random() * 256)

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  let value = ''
  for (const byte of bytes) value += byte.toString(16).padStart(2, '0')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}
export const normalizeName = (name: string) => name.trim().toLocaleLowerCase()
