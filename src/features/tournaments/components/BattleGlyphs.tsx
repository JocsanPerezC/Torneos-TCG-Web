import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../../../domain/types';
import { initials, playerNames } from './battleText';

export function CountUp({ value }: { value: number }) {
  const { i18n } = useTranslation();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 650, 1);
      setDisplay(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{new Intl.NumberFormat(i18n.language).format(display)}</>;
}

export function AvatarStack({ players }: { players: Player[] }) {
  const visiblePlayers = players.slice(0, 4);
  return (
    <div className="battle-avatar-stack" aria-label={playerNames(players)}>
      {visiblePlayers.map((player, index) => (
        <span key={player.id} title={player.name} style={{ zIndex: visiblePlayers.length - index }}>
          {initials(player.name)}
        </span>
      ))}
      {players.length > visiblePlayers.length && (
        <strong>+{players.length - visiblePlayers.length}</strong>
      )}
    </div>
  );
}

export function KillTally({ count }: { count: number }) {
  const marks = Math.min(count, 10);
  return (
    <svg className="battle-tally" viewBox="0 0 160 28" aria-hidden="true">
      {Array.from({ length: marks }, (_, index) => (
        <path key={index} d={`M${10 + index * 15} 4l-4 20`} />
      ))}
      {count > marks && (
        <text x="152" y="21" textAnchor="end">
          +{count - marks}
        </text>
      )}
    </svg>
  );
}

export function FlameTrail({ count }: { count: number }) {
  return (
    <svg className="battle-flames" viewBox="0 0 160 54" aria-hidden="true">
      {Array.from({ length: Math.min(count, 6) }, (_, index) => (
        <path
          key={index}
          transform={`translate(${index * 24} ${12 - Math.min(index * 2, 10)}) scale(${0.7 + index * 0.06})`}
          d="M17 34c-8-3-9-13-3-20 1 7 6 5 6-4 8 8 9 18 3 24-2 3-4 4-6 4Z"
        />
      ))}
    </svg>
  );
}

export function RoundPips({ count }: { count: number }) {
  return (
    <div className="battle-round-pips" aria-hidden="true">
      {Array.from({ length: Math.min(count, 10) }, (_, index) => (
        <span key={index} />
      ))}
      {count > 10 && <small>+{count - 10}</small>}
    </div>
  );
}

export function SwordLink() {
  return (
    <svg className="battle-swords" viewBox="0 0 64 42" aria-hidden="true">
      <path d="m9 5 37 30M8 35 45 5M6 4l7 2-5 5M51 34 58 37l-5-7M6 37l7-2-5-5M51 8l7-3-5 7" />
    </svg>
  );
}

export function BalanceGlyph({ difference }: { difference: number }) {
  return (
    <svg className="battle-balance" viewBox="0 0 90 54" aria-hidden="true">
      <path d="M45 6v38M21 19h48M12 19l12 20 12-20M54 19l12 20 12-20M31 47h28" />
      <text x="45" y="17" textAnchor="middle">
        {difference}
      </text>
    </svg>
  );
}

export function ArrowGlyph({ value }: { value: number }) {
  return (
    <svg className="battle-arrow" viewBox="0 0 76 54" aria-hidden="true">
      <path d="M9 45 52 11M37 11h15v15" />
      <text x="13" y="22">
        +{value}
      </text>
    </svg>
  );
}

export function Sparkline({ scores }: { scores: number[] }) {
  const max = Math.max(...scores, 1);
  const min = Math.min(...scores);
  const range = Math.max(max - min, 1);
  const points = scores
    .map(
      (score, index) =>
        `${8 + (index * 104) / Math.max(scores.length - 1, 1)},${38 - ((score - min) / range) * 25}`,
    )
    .join(' ');
  return (
    <svg className="battle-sparkline" viewBox="0 0 120 48" aria-hidden="true">
      <path d="M6 41h108" />
      <polyline points={points} />
      {scores.map((score, index) => (
        <circle
          key={`${score}-${index}`}
          cx={8 + (index * 104) / Math.max(scores.length - 1, 1)}
          cy={38 - ((score - min) / range) * 25}
          r="3"
        />
      ))}
    </svg>
  );
}

export function EmptyMark({ message }: { message: string }) {
  return <p className="battle-empty">{message}</p>;
}
