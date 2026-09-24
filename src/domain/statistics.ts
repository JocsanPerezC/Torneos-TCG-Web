import { hasCompletePodOutcomes, isValidPodResult, standings } from './scoring';
import type { Player, ResultOutcome, Tournament } from './types';

export interface PlayerHighlight {
  players: Player[];
  value: number;
}

export interface TableStatistic {
  roundNumber: number;
  tableNumber: number;
  players: Player[];
  pointDifference: number;
  kills: number;
}

export interface TableHighlight {
  tables: TableStatistic[];
  value: number;
}

export interface RivalryHighlight {
  pairs: Array<[Player, Player]>;
  value: number;
}

export interface ConsistencyHighlight extends PlayerHighlight {
  scores: number[];
}

export interface BestRoundHighlight extends PlayerHighlight {
  rounds: number[];
}

export interface TournamentStatistics {
  completedRounds: number;
  hunter: PlayerHighlight;
  unstoppable: PlayerHighlight;
  perfectAttendance: PlayerHighlight;
  rivals: RivalryHighlight;
  closestTable: TableHighlight;
  comeback: PlayerHighlight;
  drawRoyalty: PlayerHighlight;
  bestRound: BestRoundHighlight;
  bloodiestTable: TableHighlight;
  punchingBag: PlayerHighlight;
  losingStreak: PlayerHighlight;
  constant: ConsistencyHighlight;
  tableHead: PlayerHighlight;
}

function playerHighlight(players: Player[], values: Record<string, number>): PlayerHighlight {
  const value = Math.max(0, ...players.map((player) => values[player.id] ?? 0));
  return { value, players: value ? players.filter((player) => values[player.id] === value) : [] };
}

function tableHighlight(tables: TableStatistic[], value: number, predicate: (table: TableStatistic) => boolean): TableHighlight {
  return { value, tables: tables.filter(predicate) };
}

export function tournamentStatistics(tournament: Tournament): TournamentStatistics {
  const completedRounds = tournament.rounds
    .filter((round) => round.status === 'completada')
    .sort((first, second) => first.number - second.number);
  const playersById = Object.fromEntries(tournament.players.map((player) => [player.id, player]));
  const kills = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const attendance = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const wins = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const losses = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const draws = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const bestScores = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const playerPoints = Object.fromEntries(tournament.players.map((player) => [player.id, [] as number[]]));
  const winStreak = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const lossStreak = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const longestWinStreak = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const longestLossStreak = Object.fromEntries(tournament.players.map((player) => [player.id, 0]));
  const rivalries = new Map<string, number>();
  const tableStats: TableStatistic[] = [];

  for (const round of completedRounds) {
    const outcomes = new Map<string, ResultOutcome>();
    for (const pod of round.pods) {
      for (const playerId of pod.playerIds) attendance[playerId] = (attendance[playerId] ?? 0) + 1;
      for (let index = 0; index < pod.playerIds.length; index++)
        for (let next = index + 1; next < pod.playerIds.length; next++) {
          const key = [pod.playerIds[index], pod.playerIds[next]].sort().join('|');
          rivalries.set(key, (rivalries.get(key) ?? 0) + 1);
        }
      if (isValidPodResult(pod)) {
        const results = pod.results ?? [];
        const points = results.map((result) => result.points);
        tableStats.push({
          roundNumber: round.number,
          tableNumber: pod.number,
          players: pod.playerIds.flatMap((playerId) => playersById[playerId] ? [playersById[playerId]] : []),
          pointDifference: Math.max(...points) - Math.min(...points),
          kills: results.reduce((total, result) => total + result.kills, 0),
        });
        for (const result of results) {
          kills[result.playerId] = (kills[result.playerId] ?? 0) + result.kills;
          bestScores[result.playerId] = Math.max(bestScores[result.playerId] ?? 0, result.points);
          playerPoints[result.playerId] = [...(playerPoints[result.playerId] ?? []), result.points];
        }
      }
      if (hasCompletePodOutcomes(pod))
        for (const result of pod.results ?? []) {
          outcomes.set(result.playerId, result.outcome!);
          if (result.outcome === 'win') wins[result.playerId] = (wins[result.playerId] ?? 0) + 1;
          else if (result.outcome === 'loss') losses[result.playerId] = (losses[result.playerId] ?? 0) + 1;
          else draws[result.playerId] = (draws[result.playerId] ?? 0) + 1;
        }
    }
    for (const player of tournament.players) {
      const outcome = outcomes.get(player.id);
      winStreak[player.id] = outcome === 'win' ? winStreak[player.id] + 1 : 0;
      lossStreak[player.id] = outcome === 'loss' ? lossStreak[player.id] + 1 : 0;
      longestWinStreak[player.id] = Math.max(longestWinStreak[player.id], winStreak[player.id]);
      longestLossStreak[player.id] = Math.max(longestLossStreak[player.id], lossStreak[player.id]);
    }
  }

  const rivalryValue = Math.max(0, ...rivalries.values());
  const rivalPairs = rivalryValue > 1
    ? [...rivalries.entries()]
      .filter(([, count]) => count === rivalryValue)
      .flatMap(([key]) => {
        const [firstId, secondId] = key.split('|');
        const first = playersById[firstId];
        const second = playersById[secondId];
        return first && second ? [[first, second] as [Player, Player]] : [];
      })
    : [];
  const closestValue = tableStats.length ? Math.min(...tableStats.map((table) => table.pointDifference)) : 0;
  const bloodiestValue = Math.max(0, ...tableStats.map((table) => table.kills));
  const completedTournament = { ...tournament, rounds: completedRounds };
  const currentRanks = Object.fromEntries(standings(completedTournament).map((row) => [row.player.id, row.rank]));
  const firstRanks = completedRounds.length
    ? Object.fromEntries(standings({ ...tournament, rounds: [completedRounds[0]] }).map((row) => [row.player.id, row.rank]))
    : {};
  const rankGains = Object.fromEntries(tournament.players.map((player) => [
    player.id,
    Math.max(0, (firstRanks[player.id] ?? 0) - (currentRanks[player.id] ?? 0)),
  ]));
  const consistencyCandidates = tournament.players.filter((player) => (playerPoints[player.id] ?? []).length > 1);
  const consistencyValue = consistencyCandidates.length
    ? Math.min(...consistencyCandidates.map((player) => {
      const scores = playerPoints[player.id];
      return Math.max(...scores) - Math.min(...scores);
    }))
    : 0;
  const consistencyPlayers = consistencyCandidates.filter((player) => {
    const scores = playerPoints[player.id];
    return Math.max(...scores) - Math.min(...scores) === consistencyValue;
  });
  const bestRoundValue = Math.max(0, ...Object.values(bestScores));

  return {
    completedRounds: completedRounds.length,
    hunter: playerHighlight(tournament.players, kills),
    unstoppable: playerHighlight(tournament.players, longestWinStreak),
    perfectAttendance: completedRounds.length
      ? { value: completedRounds.length, players: tournament.players.filter((player) => attendance[player.id] === completedRounds.length) }
      : { value: 0, players: [] },
    rivals: { value: rivalPairs.length ? rivalryValue : 0, pairs: rivalPairs },
    closestTable: tableStats.length
      ? tableHighlight(tableStats, closestValue, (table) => table.pointDifference === closestValue)
      : { value: 0, tables: [] },
    comeback: playerHighlight(tournament.players, rankGains),
    drawRoyalty: playerHighlight(tournament.players, draws),
    bestRound: {
      ...playerHighlight(tournament.players, bestScores),
      rounds: bestRoundValue
        ? [...new Set(completedRounds.flatMap((round) => round.pods.flatMap((pod) => (pod.results ?? [])
          .filter((result) => result.points === bestRoundValue)
          .map(() => round.number))))]
        : [],
    },
    bloodiestTable: bloodiestValue
      ? tableHighlight(tableStats, bloodiestValue, (table) => table.kills === bloodiestValue)
      : { value: 0, tables: [] },
    punchingBag: playerHighlight(tournament.players, losses),
    losingStreak: playerHighlight(tournament.players, longestLossStreak),
    constant: {
      value: consistencyPlayers.length ? consistencyValue : 0,
      players: consistencyPlayers,
      scores: consistencyPlayers.length ? playerPoints[consistencyPlayers[0].id] : [],
    },
    tableHead: playerHighlight(tournament.players, wins),
  };
}
