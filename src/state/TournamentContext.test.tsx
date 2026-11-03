import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AuthContext, type AuthStore } from '@/state/AuthContext';
import { TournamentProvider, useTournaments } from '@/state/TournamentContext';

// Modo demo: sin Supabase, los torneos viven en localStorage.
vi.mock('@/lib/supabase', () => ({ supabase: null }));

const storageKey = 'torneos-tcg.tournaments.v1';
const auth = { user: null, isSuperAdmin: false } as unknown as AuthStore;

function setup() {
  let store: ReturnType<typeof useTournaments> | undefined;
  function Probe() {
    store = useTournaments();
    return null;
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>
      <TournamentProvider>{children}</TournamentProvider>
    </AuthContext.Provider>
  );
  render(<Probe />, { wrapper });
  return () => store!;
}

describe('TournamentProvider en modo demo', () => {
  beforeEach(() => localStorage.clear());

  it('guarda cada cambio en el navegador para que sobreviva a una recarga', () => {
    const store = setup();
    const demo = store().tournaments[0];
    expect(demo).toBeDefined();

    act(() => {
      store().addPlayers(demo.id, ['Nueva Jugadora']);
    });

    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as Array<{
      id: string;
      players: Array<{ name: string }>;
    }>;
    const savedDemo = saved.find((tournament) => tournament.id === demo.id);
    expect(savedDemo?.players.map((player) => player.name)).toContain('Nueva Jugadora');
  });
});
