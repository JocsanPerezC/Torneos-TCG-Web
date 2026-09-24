import { describe, expect, it } from 'vitest';
import { tournamentStatistics } from './statistics';
import type { Tournament } from './types';

describe('tournamentStatistics', () => {
  it('calcula los hitos solo con rondas completadas', () => {
    const tournament: Tournament = {
      id: 'tournament', ownerId: 'owner', name: 'Liga', format: 'Commander', information: '', plannedRounds: 3, status: 'activo', isPublic: false, publicSlug: 'liga', maxPlayers: 3, maxTables: 1, createdAt: '',
      players: ['a', 'b', 'c'].map((id, tieBreaker) => ({ id, name: id, active: true, tieBreaker })),
      rounds: [
        { id: 'one', number: 1, status: 'completada', seed: 1, pods: [{ id: 'one-pod', number: 1, playerIds: ['a', 'b', 'c'], results: [{ playerId: 'a', points: 10, kills: 1, outcome: 'win' }, { playerId: 'b', points: 0, kills: 0, outcome: 'loss' }, { playerId: 'c', points: 5, kills: 1, outcome: 'draw' }] }] },
        { id: 'two', number: 2, status: 'completada', seed: 2, pods: [{ id: 'two-pod', number: 1, playerIds: ['a', 'b', 'c'], results: [{ playerId: 'a', points: 7, kills: 2, outcome: 'win' }, { playerId: 'b', points: 20, kills: 1, outcome: 'loss' }, { playerId: 'c', points: 7, kills: 0, outcome: 'draw' }] }] },
        { id: 'three', number: 3, status: 'activa', seed: 3, pods: [{ id: 'three-pod', number: 1, playerIds: ['a', 'b', 'c'], results: [{ playerId: 'a', points: 99, kills: 9, outcome: 'loss' }, { playerId: 'b', points: 99, kills: 9, outcome: 'win' }, { playerId: 'c', points: 99, kills: 9, outcome: 'loss' }] }] },
      ],
    };

    const statistics = tournamentStatistics(tournament);

    expect(statistics.completedRounds).toBe(2);
    expect(statistics.hunter.players.map((player) => player.id)).toEqual(['a']);
    expect(statistics.hunter.value).toBe(3);
    expect(statistics.unstoppable.players.map((player) => player.id)).toEqual(['a']);
    expect(statistics.unstoppable.value).toBe(2);
    expect(statistics.perfectAttendance.players.map((player) => player.id)).toEqual(['a', 'b', 'c']);
    expect(statistics.rivals.value).toBe(2);
    expect(statistics.closestTable.value).toBe(10);
    expect(statistics.closestTable.tables[0]).toMatchObject({ roundNumber: 1, tableNumber: 1 });
    expect(statistics.comeback.players.map((player) => player.id)).toEqual(['b']);
    expect(statistics.comeback.value).toBe(2);
    expect(statistics.drawRoyalty.players.map((player) => player.id)).toEqual(['c']);
    expect(statistics.bestRound.players.map((player) => player.id)).toEqual(['b']);
    expect(statistics.bestRound.value).toBe(20);
    expect(statistics.bloodiestTable.value).toBe(3);
    expect(statistics.bloodiestTable.tables[0]).toMatchObject({ roundNumber: 2, tableNumber: 1 });
    expect(statistics.punchingBag.players.map((player) => player.id)).toEqual(['b']);
    expect(statistics.losingStreak.players.map((player) => player.id)).toEqual(['b']);
    expect(statistics.constant.players.map((player) => player.id)).toEqual(['c']);
    expect(statistics.constant.value).toBe(2);
    expect(statistics.tableHead.players.map((player) => player.id)).toEqual(['a']);
  });
});
