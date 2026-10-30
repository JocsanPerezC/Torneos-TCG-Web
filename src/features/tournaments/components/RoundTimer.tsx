import { useEffect, useState } from 'react';
import type { Tournament } from '@/domain/types';
import i18n from '@/i18n';

export function RoundTimer({ round }: { round: Tournament['rounds'][number] }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (round.status !== 'activa' || !round.startedAt) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [round.status, round.startedAt]);
  if (!round.startedAt) return null;
  const elapsed = Math.max(
    0,
    (round.endedAt ? Date.parse(round.endedAt) : now) - Date.parse(round.startedAt),
  );
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1_000);
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  return (
    <span
      className="round-timer"
      aria-label={i18n.t('app.tournament.round', { number: round.number })}
    >
      {clock}
    </span>
  );
}
