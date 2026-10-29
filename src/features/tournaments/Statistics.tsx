import { tournamentStatistics } from '@/domain/statistics';
import { BattleLedger } from '@/features/tournaments/components/BattleLedger';

import { Current } from '@/features/tournaments/currentTournament';

export function Statistics() {
  return <BattleLedger statistics={tournamentStatistics(Current())} />;
}
