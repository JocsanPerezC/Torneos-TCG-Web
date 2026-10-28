import { normalizeName, type Player } from './types';

/** A linked player may share a name with a manual participant until tables are generated. */
export function manualParticipantNameConflicts(players: Player[]) {
  const linkedNames = new Set(
    players.filter((player) => player.profileId).map((player) => normalizeName(player.name)),
  );

  return players.filter(
    (player) => !player.profileId && linkedNames.has(normalizeName(player.name)),
  );
}
