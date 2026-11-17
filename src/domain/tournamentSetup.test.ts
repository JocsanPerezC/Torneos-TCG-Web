import { describe, expect, it } from 'vitest';
import { automaticTableCount, validateTournamentSetup } from '@/domain/tournamentSetup';

describe('configuración inicial del torneo', () => {
  it('calcula mesas automáticas de tres a cinco jugadores', () => {
    expect(automaticTableCount(3)).toBe(1);
    expect(automaticTableCount(8)).toBe(2);
    expect(automaticTableCount(10)).toBe(3);
    expect(automaticTableCount(32)).toBe(8);
  });

  it('explica las configuraciones fuera de tres a cinco jugadores por mesa', () => {
    expect(validateTournamentSetup({ rounds: 3, players: 8, tables: 3 })).toMatchObject({
      valid: false,
      reason: 'fewPlayers',
    });
    expect(validateTournamentSetup({ rounds: 3, players: 16, tables: 3 })).toMatchObject({
      valid: false,
      reason: 'manyPlayers',
      minimumTables: 4,
    });
    expect(validateTournamentSetup({ rounds: 16, players: 32, tables: 8 })).toMatchObject({
      valid: false,
      reason: 'limits',
    });
    expect(validateTournamentSetup({ rounds: 3, players: 14, tables: 4 })).toEqual({
      valid: true,
      low: 3,
      high: 4,
    });
  });
});
