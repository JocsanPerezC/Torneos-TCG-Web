export type TournamentStatus = 'activo' | 'finalizado'
export type RoundStatus = 'borrador' | 'activa' | 'completada'
export type ResultType = 'normal' | 'combo'

export interface ScoringRules { first: number; second: number; third: number; fourth: number; comboWinner: number; comboOther: number }
export interface Player { id: string; name: string; active: boolean; tieBreaker: number }
export interface Result { playerId: string; position: number; kills: number }
export interface Pod { id: string; number: number; playerIds: string[]; resultType?: ResultType; results?: Result[]; notes?: string }
export interface Round { id: string; number: number; status: RoundStatus; seed: number; pods: Pod[] }
export interface Tournament {
  id: string; ownerId: string; name: string; format: string; plannedRounds: number; status: TournamentStatus;
  isPublic: boolean; publicSlug: string; scoring: ScoringRules; players: Player[]; rounds: Round[]; createdAt: string
}
export interface Standing { player: Player; rank: number; points: number; wins: number; kills: number; roundsPlayed: number; opponentStrength: number }

export const defaultScoring: ScoringRules = { first: 3, second: 2, third: 1, fourth: 0, comboWinner: 3, comboOther: 1 }
export const uid = () => crypto.randomUUID()
export const normalizeName = (name: string) => name.trim().toLocaleLowerCase()
