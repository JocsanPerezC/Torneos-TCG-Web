import { useTranslation } from 'react-i18next';
import type { PlayerDeck } from '@/domain/types';
import { ColorPips } from '@/features/decks/ColorPips';

/** Comandante (o nombre del mazo) con sus colores; si hay enlace, abre la lista en otra pestaña. */
export function PlayerDeckTag({ deck }: { deck?: PlayerDeck }) {
  const { t } = useTranslation();
  if (!deck) return null;
  const label = deck.commander ?? deck.name;
  const content = (
    <>
      <ColorPips colors={deck.colors} />
      <span>{label}</span>
    </>
  );
  return deck.url ? (
    <a
      className="player-deck-tag"
      href={deck.url}
      target="_blank"
      rel="noreferrer"
      title={t('app.decks.openDeck', { name: deck.name })}
    >
      {content}
    </a>
  ) : (
    <span className="player-deck-tag" title={deck.name}>
      {content}
    </span>
  );
}
