import type { Player } from '../../domain/types';

export function playerNames(players: Player[]) {
  return players.map((player) => player.name).join(' · ');
}

export function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
