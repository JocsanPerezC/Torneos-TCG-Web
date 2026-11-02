import { loadAllTournaments } from '@/data/tournamentRepository';
import type { AdminOverview } from '@/data/adminRepository';
import type { ManagedUser } from '@/data/adminUsersRepository';
import type { Tournament } from '@/domain/types';

export type AdminTab = 'accounts' | 'tournaments' | 'players' | 'details';

/**
 * Caché en memoria de la consola: al volver a /admin se muestra al instante lo último cargado
 * y se actualiza en segundo plano. Se vacía al recargar la página o cerrar sesión.
 */
export const adminCache: {
  /** Cuenta dueña de los datos guardados: si cambia, la caché se descarta. */
  owner?: string;
  overview?: AdminOverview;
  managedUsers?: ManagedUser[];
  tournaments?: Tournament[];
  tab?: AdminTab;
} = {};

let tournamentsRequest: Promise<Tournament[]> | undefined;
const listeners = new Set<(tournaments: Tournament[]) => void>();

/**
 * Pide todos los torneos completos. Si ya hay una petición en curso (por ejemplo, las pestañas
 * "Jugadores activos" y "Datos completos" al montarse juntas), se reutiliza en vez de repetirla.
 */
export function refreshAdminTournaments() {
  tournamentsRequest ??= loadAllTournaments()
    .then((tournaments) => {
      adminCache.tournaments = tournaments;
      listeners.forEach((listener) => listener(tournaments));
      return tournaments;
    })
    .finally(() => {
      tournamentsRequest = undefined;
    });
  return tournamentsRequest;
}

/** Avisa cuando llegan torneos nuevos, para que todas las pestañas muestren lo mismo. */
export function subscribeAdminTournaments(listener: (tournaments: Tournament[]) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Devuelve la caché de esta cuenta; si guardaba datos de otra, la vacía primero. */
export function adminCacheFor(userId: string | undefined) {
  if (adminCache.owner !== userId) {
    clearAdminCache();
    adminCache.owner = userId;
  }
  return adminCache;
}

/** Guarda un valor en la caché de la consola. */
export function rememberAdmin<K extends 'overview' | 'managedUsers' | 'tab'>(
  key: K,
  value: (typeof adminCache)[K],
) {
  adminCache[key] = value;
}

export function clearAdminCache() {
  delete adminCache.overview;
  delete adminCache.managedUsers;
  delete adminCache.tournaments;
  delete adminCache.tab;
}
