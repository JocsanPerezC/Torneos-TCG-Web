import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TournamentContext, type TournamentStore } from '@/state/TournamentContext';
import { PodCard } from '@/features/tournaments/components/PodCard';
import i18n from '@/i18n';

const pod = {
  id: 'pod',
  number: 1,
  playerIds: ['a', 'b', 'c'],
  results: [
    { playerId: 'a', points: 3, kills: 2, firstBlood: true, outcome: 'win' as const },
    { playerId: 'b', points: 1, kills: 0, firstBlood: false, outcome: 'loss' as const },
    { playerId: 'c', points: 0, kills: 0, firstBlood: false, outcome: 'loss' as const },
  ],
};

function renderPod(tracksKills: boolean, tracksFirstBlood: boolean) {
  return render(
    <TournamentContext.Provider value={{ savePod: vi.fn() } as unknown as TournamentStore}>
      <PodCard
        tournamentId="tournament"
        roundId="round"
        pod={pod}
        names={{ a: 'Ana', b: 'Bruno', c: 'Carla' }}
        readOnly
        editable={false}
        tracksKills={tracksKills}
        tracksFirstBlood={tracksFirstBlood}
      />
    </TournamentContext.Provider>,
  );
}

describe('PodCard', () => {
  it('oculta kills y primera sangre cuando el torneo no las registra', () => {
    renderPod(false, false);

    expect(screen.queryByText(i18n.t('app.common.kills'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('app.common.firstBlood'))).not.toBeInTheDocument();
  });

  it('muestra primera sangre junto a los datos del jugador cuando está activa', () => {
    renderPod(true, true);

    expect(screen.getAllByText(i18n.t('app.common.kills'))).toHaveLength(3);
    expect(screen.getAllByText(i18n.t('app.common.firstBlood'))).toHaveLength(3);
    expect(screen.getAllByText(i18n.t('app.common.yes'))).toHaveLength(1);
  });
});
