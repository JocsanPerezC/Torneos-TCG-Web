import { supabase } from '@/lib/supabase';

export type PlayerTournament = {
  id: string;
  name: string;
  format: string;
  status: 'activo' | 'finalizado';
  publicSlug: string;
  plannedRounds: number;
  roundCount: number;
  participantName: string;
  createdAt: string;
};

export type JoinableTournament = {
  id: string;
  name: string;
  format: string;
  availableSlots: number;
};

export type PlayerStatistics = {
  tournamentsPlayed: number;
  roundsPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  kills: number;
  podiums: number;
};

type Row = Record<string, unknown>;

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}

export async function loadPlayerTournaments(): Promise<PlayerTournament[]> {
  const { data, error } = await client().rpc('get_my_player_tournaments');
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => ({
    id: String(row.tournament_id),
    name: String(row.name),
    format: String(row.format),
    status: row.status === 'finalizado' ? 'finalizado' : 'activo',
    publicSlug: String(row.public_slug),
    plannedRounds: Number(row.planned_rounds),
    roundCount: Number(row.round_count),
    participantName: String(row.participant_name),
    createdAt: String(row.created_at),
  }));
}

export async function loadPlayerStatistics(): Promise<PlayerStatistics> {
  const { data, error } = await client().rpc('get_my_player_statistics');
  if (error) throw error;
  const row = ((data as Row[] | null) ?? [])[0] ?? {};
  return {
    tournamentsPlayed: Number(row.tournaments_played ?? 0),
    roundsPlayed: Number(row.rounds_played ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0),
    points: Number(row.points ?? 0),
    kills: Number(row.kills ?? 0),
    podiums: Number(row.podiums ?? 0),
  };
}

export async function loadJoinableTournament(
  token: string,
): Promise<JoinableTournament | undefined> {
  const { data, error } = await client().rpc('get_joinable_tournament', { p_token: token });
  if (error) throw error;
  const row = (data as Row[] | null)?.[0];
  return row
    ? {
        id: String(row.tournament_id),
        name: String(row.name),
        format: String(row.format),
        availableSlots: Number(row.available_slots),
      }
    : undefined;
}

export async function joinTournament(token: string, name: string) {
  const { error } = await client().rpc('join_tournament', { p_token: token, p_name: name });
  if (error) throw error;
}

export async function loadTournamentJoinLink(tournamentId: string) {
  const { data, error } = await client().rpc('get_tournament_join_link', {
    p_tournament_id: tournamentId,
  });
  if (error) throw error;
  return data ? String(data) : undefined;
}

export async function loadTournamentJoinCode(tournamentId: string) {
  const { data, error } = await client().rpc('get_tournament_join_code', {
    p_tournament_id: tournamentId,
  });
  if (error) throw error;
  return data ? String(data) : undefined;
}

export async function createTournamentJoinLink(tournamentId: string) {
  const { data, error } = await client().rpc('create_or_rotate_tournament_join_link', {
    p_tournament_id: tournamentId,
  });
  if (error) throw error;
  return String(data);
}

export async function revokeTournamentJoinLink(tournamentId: string) {
  const { error } = await client().rpc('revoke_tournament_join_link', {
    p_tournament_id: tournamentId,
  });
  if (error) throw error;
}
