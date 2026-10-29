import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthStore } from '../../state/AuthContext';
import { TournamentContext, type TournamentStore } from '../../state/TournamentContext';
import { showcaseStandings, showcaseTournament } from './fixtures';

// Providers mínimos: los componentes leen datos de ejemplo y ninguna acción toca Supabase.

const noop = async () => undefined;
const showcaseUser = {
  id: 'showcase-organizer',
  email: 'organizador@ejemplo.com',
  user_metadata: { display_name: 'Organizador demo' },
} as unknown as User;

export function ShowcaseAuthProvider({
  children,
  signedIn = true,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  const value: AuthStore = {
    user: signedIn ? showcaseUser : null,
    role: signedIn ? 'organizer' : null,
    isAdmin: false,
    isSuperAdmin: false,
    isPlayer: false,
    requiresRoleSelection: false,
    requiresLegalConsent: false,
    loading: false,
    configured: signedIn,
    signIn: noop,
    signUp: noop,
    completeRegistrationRole: noop,
    isEmailRegistered: async () => false,
    resetPassword: noop,
    acceptLegalConsent: noop,
    signOut: noop,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const tournamentStore: TournamentStore = {
  tournaments: [showcaseTournament],
  ready: true,
  refreshTournaments: noop,
  createTournament: async () => showcaseTournament,
  updateTournament: () => undefined,
  removeTournament: () => undefined,
  addPlayers: () => ({ added: 0, addedIds: [] }),
  renamePlayer: () => undefined,
  togglePlayer: () => undefined,
  removePlayer: () => undefined,
  generateRound: noop,
  startRound: () => undefined,
  setRoundStatus: () => undefined,
  completeRound: () => undefined,
  movePlayer: () => undefined,
  savePod: () => undefined,
  deleteLastRound: () => undefined,
  standingsFor: () => showcaseStandings,
};

export function ShowcaseTournamentProvider({ children }: { children: ReactNode }) {
  return (
    <TournamentContext.Provider value={tournamentStore}>{children}</TournamentContext.Provider>
  );
}
