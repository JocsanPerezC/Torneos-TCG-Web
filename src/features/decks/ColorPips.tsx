import { useTranslation } from 'react-i18next';

const COLORS = ['W', 'U', 'B', 'R', 'G'] as const;

/** Identidad de color como puntos de maná (W, U, B, R, G); incoloro si no tiene ninguno. */
export function ColorPips({ colors }: { colors: string }) {
  const { t } = useTranslation();
  const present = COLORS.filter((color) => colors.includes(color));
  const label = present.length
    ? present.map((color) => t(`app.decks.colors.${color}`)).join(', ')
    : t('app.decks.colors.C');
  return (
    <span className="deck-pips" role="img" aria-label={label} title={label}>
      {(present.length ? present : (['C'] as const)).map((color) => (
        <i key={color} className={`deck-pip deck-pip--${color}`} aria-hidden="true" />
      ))}
    </span>
  );
}
