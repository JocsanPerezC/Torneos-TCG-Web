import type { Pod, Round } from '@/domain/types';

/** Duración de una mesa en milisegundos: desde que empezó la ronda hasta que la mesa terminó. */
export function podDuration(round: Pick<Round, 'startedAt'>, pod: Pick<Pod, 'finishedAt'>) {
  if (!round.startedAt || !pod.finishedAt) return undefined;
  const duration = Date.parse(pod.finishedAt) - Date.parse(round.startedAt);
  return Number.isFinite(duration) ? Math.max(0, duration) : undefined;
}

/** "42:15" o, desde la hora, "1:02:30". */
export function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * Lee lo que escribe el organizador: "42:15", "1:02:30" o solo minutos ("42").
 * Devuelve milisegundos, o undefined si el formato no es válido.
 */
export function parseDuration(value: string) {
  const parts = value.trim().split(':');
  if (!parts[0] || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return undefined;
  const numbers = parts.map(Number);
  if (numbers.slice(1).some((part) => part >= 60)) return undefined;
  const [hours, minutes, seconds] =
    numbers.length === 3 ? numbers : numbers.length === 2 ? [0, ...numbers] : [0, numbers[0], 0];
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}
