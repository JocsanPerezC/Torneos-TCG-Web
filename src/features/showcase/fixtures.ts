import type { Player, Pod, Round, Tournament } from '../../domain/types';
import { standings } from '../../domain/scoring';
import { tournamentStatistics } from '../../domain/statistics';

// Datos estáticos del muestrario: no se guardan ni salen de esta página.

export const showcasePlayers: Player[] = [
  { id: 'p-ana', name: 'Ana Rojas', active: true, tieBreaker: 1, avatarUrl: '/default-avatar.svg' },
  { id: 'p-bruno', name: 'Bruno Vega', active: true, tieBreaker: 2 },
  { id: 'p-carla', name: 'Carla Mora', active: true, tieBreaker: 3 },
  { id: 'p-diego', name: 'Diego León', active: true, tieBreaker: 4 },
  { id: 'p-elena', name: 'Elena Solís', active: true, tieBreaker: 5 },
  { id: 'p-felipe', name: 'Felipe Araya', active: true, tieBreaker: 6 },
  { id: 'p-gabi', name: 'Gabriela Ruiz', active: true, tieBreaker: 7 },
  { id: 'p-hugo', name: 'Hugo Castro', active: false, tieBreaker: 8 },
];

export const showcaseNames: Record<string, string> = Object.fromEntries(
  showcasePlayers.map((player) => [player.id, player.name]),
);

const tableA = ['p-ana', 'p-bruno', 'p-carla', 'p-diego'];
const tableB = ['p-elena', 'p-felipe', 'p-gabi', 'p-hugo'];

export const podEmpty: Pod = { id: 'pod-empty', number: 1, playerIds: tableA };

export const podPartial: Pod = {
  id: 'pod-partial',
  number: 2,
  playerIds: tableB,
  results: [
    { playerId: 'p-elena', points: 4, kills: 2, outcome: 'win' },
    { playerId: 'p-felipe', points: 1, kills: 0, outcome: 'loss' },
  ],
};

export const podComplete: Pod = {
  id: 'pod-complete',
  number: 1,
  playerIds: tableA,
  results: [
    { playerId: 'p-ana', points: 5, kills: 2, outcome: 'win' },
    { playerId: 'p-bruno', points: 2, kills: 1, outcome: 'loss' },
    { playerId: 'p-carla', points: 1, kills: 0, outcome: 'loss' },
    { playerId: 'p-diego', points: 2, kills: 1, outcome: 'draw' },
  ],
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const roundCompleted: Round = {
  id: 'round-1',
  number: 1,
  status: 'completada',
  seed: 1,
  startedAt: '2026-10-24T18:00:00.000Z',
  endedAt: '2026-10-24T18:52:30.000Z',
  pods: [
    podComplete,
    {
      id: 'pod-r1-b',
      number: 2,
      playerIds: tableB,
      results: [
        { playerId: 'p-elena', points: 5, kills: 1, outcome: 'win' },
        { playerId: 'p-felipe', points: 0, kills: 0, outcome: 'loss' },
        { playerId: 'p-gabi', points: 3, kills: 2, outcome: 'loss' },
        { playerId: 'p-hugo', points: 1, kills: 1, outcome: 'loss' },
      ],
    },
  ],
};

export const roundActive: Round = {
  id: 'round-2',
  number: 2,
  status: 'activa',
  seed: 2,
  startedAt: minutesAgo(25),
  pods: [{ ...podEmpty, id: 'pod-r2-a' }, podPartial],
};

export const roundDraft: Round = {
  id: 'round-3',
  number: 3,
  status: 'borrador',
  seed: 3,
  pods: [
    { id: 'pod-r3-a', number: 1, playerIds: ['p-ana', 'p-elena', 'p-carla'] },
    { id: 'pod-r3-b', number: 2, playerIds: ['p-bruno', 'p-felipe', 'p-gabi', 'p-diego'] },
  ],
};

export const showcaseTournament: Tournament = {
  id: 'showcase',
  ownerId: 'showcase-organizer',
  name: 'Commander de sábado',
  format: 'Commander',
  information: '',
  plannedRounds: 3,
  status: 'activo',
  isPublic: true,
  publicSlug: 'commander-de-sabado',
  maxPlayers: 32,
  maxTables: 8,
  players: showcasePlayers,
  rounds: [roundCompleted, roundActive],
  createdAt: '2026-10-24T17:30:00.000Z',
};

export const showcaseStandings = standings(showcaseTournament);
export const showcaseStatistics = tournamentStatistics(showcaseTournament);
export const showcaseEmptyStatistics = tournamentStatistics({ ...showcaseTournament, rounds: [] });
export const showcaseJoinPreview = { token: 'k7q2m9xa4p', code: 'K7Q2M9' };
