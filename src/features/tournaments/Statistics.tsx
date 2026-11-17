import { tournamentStatistics } from '@/domain/statistics';
import { BattleLedger } from '@/features/tournaments/components/BattleLedger';

import { Current } from '@/features/tournaments/currentTournament';

export function Statistics() {
  const tournament = Current();
  return (
    <BattleLedger
      statistics={tournamentStatistics(tournament)}
      tracksKills={tournament.tracksKills !== false}
      tracksFirstBlood={tournament.tracksFirstBlood === true}
    />
  );
}
