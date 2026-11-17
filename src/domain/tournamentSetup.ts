export type TournamentSetup = {
  rounds: number;
  players: number;
  tables: number;
};

export type TournamentSetupValidation =
  | { valid: false; reason: 'limits' | 'fewPlayers' | 'manyPlayers'; minimumTables?: number }
  | { valid: true; low: number; high: number };

/** Cantidad de mesas inicial que mantiene grupos de tres a cinco jugadores. */
export function automaticTableCount(players: number) {
  let tables = Math.ceil(players / 4);
  while (tables > 1 && players < 3 * tables) tables--;
  return tables;
}

export function validateTournamentSetup({
  rounds,
  players,
  tables,
}: TournamentSetup): TournamentSetupValidation {
  if (
    !Number.isInteger(rounds) ||
    rounds < 1 ||
    rounds > 15 ||
    !Number.isInteger(players) ||
    players < 3 ||
    players > 256 ||
    !Number.isInteger(tables) ||
    tables < 1
  )
    return { valid: false, reason: 'limits' };
  if (players < 3 * tables) return { valid: false, reason: 'fewPlayers' };
  if (players > 5 * tables)
    return { valid: false, reason: 'manyPlayers', minimumTables: Math.ceil(players / 5) };
  return { valid: true, low: Math.floor(players / tables), high: Math.ceil(players / tables) };
}
