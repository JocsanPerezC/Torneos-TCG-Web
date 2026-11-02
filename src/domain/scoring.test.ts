import { describe, expect, it } from 'vitest';
import {
  compareStandings,
  hasCompletePodOutcomes,
  isValidPodResult,
  standings,
} from '@/domain/scoring';
import type { Tournament } from '@/domain/types';

describe('standings', () => {
  it('acepta hasta cinco kills por jugador', () => {
    const pod = {
      id: 'pod',
      number: 1,
      playerIds: ['a', 'b', 'c'],
      results: [
        { playerId: 'a', points: 1, kills: 5 },
        { playerId: 'b', points: 1, kills: 0 },
        { playerId: 'c', points: 1, kills: 0 },
      ],
    };

    expect(isValidPodResult(pod)).toBe(true);
    pod.results[0].kills = 6;
    expect(isValidPodResult(pod)).toBe(false);
  });

  it('calcula estadísticas desde los resultados seleccionados, no desde los puntos', () => {
    const tournament: Tournament = {
      id: 'tournament',
      ownerId: 'owner',
      name: 'Liga',
      format: 'Commander',
      information: '',
      plannedRounds: 3,
      status: 'activo',
      isPublic: false,
      publicSlug: 'liga',
      maxPlayers: 3,
      maxTables: 1,
      createdAt: '',
      players: ['a', 'b', 'c'].map((id, tieBreaker) => ({
        id,
        name: id,
        active: true,
        tieBreaker,
      })),
      rounds: [
        {
          id: 'one',
          number: 1,
          status: 'completada',
          seed: 1,
          pods: [
            {
              id: 'one-pod',
              number: 1,
              playerIds: ['a', 'b', 'c'],
              results: [
                { playerId: 'a', points: 0, kills: 0, outcome: 'win' },
                { playerId: 'b', points: 3, kills: 0, outcome: 'loss' },
                { playerId: 'c', points: 1, kills: 0, outcome: 'loss' },
              ],
            },
          ],
        },
        {
          id: 'two',
          number: 2,
          status: 'completada',
          seed: 2,
          pods: [
            {
              id: 'two-pod',
              number: 1,
              playerIds: ['a', 'b', 'c'],
              results: [
                { playerId: 'a', points: 2, kills: 0, outcome: 'draw' },
                { playerId: 'b', points: 2, kills: 0, outcome: 'draw' },
                { playerId: 'c', points: 0, kills: 0, outcome: 'loss' },
              ],
            },
          ],
        },
        {
          id: 'three',
          number: 3,
          status: 'completada',
          seed: 3,
          pods: [
            {
              id: 'three-pod',
              number: 1,
              playerIds: ['a', 'b', 'c'],
              results: [
                { playerId: 'a', points: 3, kills: 0, outcome: 'win' },
                { playerId: 'b', points: 1, kills: 0 },
                { playerId: 'c', points: 0, kills: 0, outcome: 'loss' },
              ],
            },
          ],
        },
      ],
    };

    const rows = Object.fromEntries(standings(tournament).map((row) => [row.player.id, row]));

    expect(hasCompletePodOutcomes(tournament.rounds[0].pods[0])).toBe(true);
    expect(hasCompletePodOutcomes(tournament.rounds[2].pods[0])).toBe(false);
    expect(rows.a).toMatchObject({ wins: 1, losses: 0, draws: 1, roundsPlayed: 3, winRate: 75 });
    expect(rows.b).toMatchObject({ wins: 0, losses: 1, draws: 1, roundsPlayed: 3, winRate: 25 });
    expect(rows.c).toMatchObject({ wins: 0, losses: 2, draws: 0, roundsPlayed: 3, winRate: 0 });
  });

  it('ordena por puntos, victorias, empates, derrotas, win rate, kills y rivales', () => {
    const base = {
      points: 6,
      wins: 1,
      draws: 1,
      losses: 1,
      winRate: 50,
      kills: 2,
      opponentStrength: 4,
    };
    const better = (change: Partial<typeof base>) =>
      compareStandings({ ...base, ...change }, base) < 0;

    expect(better({ points: 7, wins: 0 })).toBe(true);
    expect(better({ wins: 2, kills: 0 })).toBe(true);
    expect(better({ draws: 2, kills: 0 })).toBe(true);
    expect(better({ losses: 0, kills: 0 })).toBe(true);
    expect(better({ winRate: 60, kills: 0 })).toBe(true);
    // Las kills pesan más que la fuerza de los rivales.
    expect(better({ kills: 3, opponentStrength: 0 })).toBe(true);
    expect(better({ opponentStrength: 5 })).toBe(true);
    expect(compareStandings(base, { ...base })).toBe(0);
  });

  it('promedia los puntos de los rivales y comparte el puesto en un empate total', () => {
    const tournament: Tournament = {
      id: 'tournament',
      ownerId: 'owner',
      name: 'Liga',
      format: 'Commander',
      information: '',
      plannedRounds: 1,
      status: 'activo',
      isPublic: false,
      publicSlug: 'liga',
      maxPlayers: 4,
      maxTables: 1,
      createdAt: '',
      players: ['a', 'b', 'c', 'd'].map((id, tieBreaker) => ({
        id,
        name: id,
        active: true,
        tieBreaker,
      })),
      rounds: [
        {
          id: 'one',
          number: 1,
          status: 'completada',
          seed: 1,
          pods: [
            {
              id: 'pod',
              number: 1,
              playerIds: ['a', 'b', 'c', 'd'],
              results: [
                { playerId: 'a', points: 6, kills: 1, outcome: 'win' },
                { playerId: 'b', points: 2, kills: 0, outcome: 'loss' },
                { playerId: 'c', points: 2, kills: 0, outcome: 'loss' },
                { playerId: 'd', points: 1, kills: 0, outcome: 'loss' },
              ],
            },
          ],
        },
      ],
    };

    const rows = standings(tournament);
    expect(rows.map((row) => [row.player.id, row.rank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 2],
      ['d', 4],
    ]);
    // b enfrentó a a (6), c (2) y d (1): promedio 3, no la suma 9.
    expect(rows[1].opponentStrength).toBe(3);
  });
});
