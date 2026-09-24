import { describe, expect, it } from 'vitest';
import { hasCompletePodOutcomes, standings } from './scoring';
import type { Tournament } from './types';

describe('standings', () => {
  it('calcula estadísticas desde los resultados seleccionados, no desde los puntos', () => {
    const tournament: Tournament = {
      id: 'tournament', ownerId: 'owner', name: 'Liga', format: 'Commander', information: '', plannedRounds: 3, status: 'activo', isPublic: false, publicSlug: 'liga', maxPlayers: 3, maxTables: 1, createdAt: '',
      players: ['a', 'b', 'c'].map((id, tieBreaker) => ({ id, name: id, active: true, tieBreaker })),
      rounds: [
        { id: 'one', number: 1, status: 'completada', seed: 1, pods: [{ id: 'one-pod', number: 1, playerIds: ['a', 'b', 'c'], results: [{ playerId: 'a', points: 0, kills: 0, outcome: 'win' }, { playerId: 'b', points: 3, kills: 0, outcome: 'loss' }, { playerId: 'c', points: 1, kills: 0, outcome: 'loss' }] }] },
        { id: 'two', number: 2, status: 'completada', seed: 2, pods: [{ id: 'two-pod', number: 1, playerIds: ['a', 'b', 'c'], results: [{ playerId: 'a', points: 2, kills: 0, outcome: 'draw' }, { playerId: 'b', points: 2, kills: 0, outcome: 'draw' }, { playerId: 'c', points: 0, kills: 0, outcome: 'loss' }] }] },
        { id: 'three', number: 3, status: 'completada', seed: 3, pods: [{ id: 'three-pod', number: 1, playerIds: ['a', 'b', 'c'], results: [{ playerId: 'a', points: 3, kills: 0, outcome: 'win' }, { playerId: 'b', points: 1, kills: 0 }, { playerId: 'c', points: 0, kills: 0, outcome: 'loss' }] }] },
      ],
    };

    const rows = Object.fromEntries(standings(tournament).map((row) => [row.player.id, row]));

    expect(hasCompletePodOutcomes(tournament.rounds[0].pods[0])).toBe(true);
    expect(hasCompletePodOutcomes(tournament.rounds[2].pods[0])).toBe(false);
    expect(rows.a).toMatchObject({ wins: 1, losses: 0, draws: 1, roundsPlayed: 3, winRate: 75 });
    expect(rows.b).toMatchObject({ wins: 0, losses: 1, draws: 1, roundsPlayed: 3, winRate: 25 });
    expect(rows.c).toMatchObject({ wins: 0, losses: 2, draws: 0, roundsPlayed: 3, winRate: 0 });
  });
});
