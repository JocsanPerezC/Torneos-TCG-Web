export type TournamentStatus = 'activo' | 'finalizado'
export type RoundStatus = 'borrador' | 'activa' | 'completada'
export type ResultOutcome = 'win' | 'loss' | 'draw'
export interface Player { id: string; name: string; active: boolean; tieBreaker: number }
export interface Result { playerId: string; points: number; kills: number; outcome?: ResultOutcome }
export interface Pod { id: string; number: number; playerIds: string[]; results?: Result[]; notes?: string }
export interface Round { id: string; number: number; status: RoundStatus; seed: number; startedAt?: string; endedAt?: string; pods: Pod[] }
export interface Tournament {
  id: string; ownerId: string; name: string; format: string; information: string; plannedRounds: number; status: TournamentStatus;
  isPublic: boolean; publicSlug: string; maxPlayers: number; maxTables: number; players: Player[]; rounds: Round[]; createdAt: string
}
export interface Standing { player: Player; rank: number; points: number; kills: number; roundsPlayed: number; wins: number; losses: number; draws: number; winRate: number; opponentStrength: number }

export const uid = () => crypto.randomUUID()
export const normalizeName = (name: string) => name.trim().toLocaleLowerCase()
