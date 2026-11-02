import { describe, expect, it } from 'vitest';
import { formatDuration, parseDuration, podDuration } from '@/domain/timing';

describe('tiempo de mesa', () => {
  it('mide desde el inicio de la ronda hasta que la mesa terminó', () => {
    expect(
      podDuration(
        { startedAt: '2026-11-02T18:00:00.000Z' },
        { finishedAt: '2026-11-02T18:42:15.000Z' },
      ),
    ).toBe(2_535_000);
    expect(podDuration({ startedAt: undefined }, { finishedAt: '2026-11-02T18:00:00Z' })).toBe(
      undefined,
    );
  });

  it('muestra minutos y segundos, y horas solo si hacen falta', () => {
    expect(formatDuration(2_535_000)).toBe('42:15');
    expect(formatDuration(3_750_000)).toBe('1:02:30');
    expect(formatDuration(5_000)).toBe('0:05');
  });

  it('entiende lo que escribe el organizador', () => {
    expect(parseDuration('42:15')).toBe(2_535_000);
    expect(parseDuration('1:02:30')).toBe(3_750_000);
    expect(parseDuration('42')).toBe(2_520_000);
    expect(parseDuration('42:75')).toBeUndefined();
    expect(parseDuration('abc')).toBeUndefined();
    expect(parseDuration('')).toBeUndefined();
  });
});
