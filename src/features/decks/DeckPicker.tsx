import { useId } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { Deck } from '@/data/deckRepository';
import { ColorPips } from '@/features/decks/ColorPips';

/** Lista para elegir con qué mazo se juega un torneo; "Sin mazo" siempre es una opción. */
export function DeckPicker({
  decks,
  value,
  onChange,
}: {
  decks: Deck[];
  value: string | undefined;
  onChange(deckId: string | undefined): void;
}) {
  const { t } = useTranslation();
  const name = useId();
  return (
    <fieldset className="deck-picker">
      <legend className="sr-only">{t('app.decks.pickTitle')}</legend>
      <label className={`deck-picker__option${value === undefined ? ' is-selected' : ''}`}>
        <input
          type="radio"
          name={name}
          className="sr-only"
          checked={value === undefined}
          onChange={() => onChange(undefined)}
        />
        <span className="deck-picker__art" aria-hidden="true">
          —
        </span>
        <span className="deck-picker__text">
          <strong>{t('app.decks.noDeck')}</strong>
        </span>
      </label>
      {decks.map((deck) => (
        <label
          key={deck.id}
          className={`deck-picker__option${value === deck.id ? ' is-selected' : ''}`}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === deck.id}
            onChange={() => onChange(deck.id)}
          />
          <span className="deck-picker__art" aria-hidden="true">
            {deck.commanderImage ? <img src={deck.commanderImage} alt="" /> : '🂠'}
          </span>
          <span className="deck-picker__text">
            <strong>{deck.name}</strong>
            <small>
              {deck.commanderName ?? t('app.decks.noCommander')}
              {deck.commanderName && <ColorPips colors={deck.colorIdentity} />}
            </small>
          </span>
        </label>
      ))}
      <Link to="/mazos" className="deck-picker__add">
        <Plus aria-hidden="true" />
        {t('app.decks.addNew')}
      </Link>
    </fieldset>
  );
}
