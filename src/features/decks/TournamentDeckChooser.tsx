import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { primary } from '@/components/ui/classes';
import type { Deck } from '@/data/deckRepository';
import { setMyTournamentDeck } from '@/data/playerRepository';
import { DeckPicker } from '@/features/decks/DeckPicker';

/**
 * Elegir con qué mazo se juega un torneo. Lo usan el paso posterior a la inscripción y
 * "Mis torneos". Guarda con la RPC, que rechaza el cambio si el torneo ya empezó.
 */
export function TournamentDeckChooser({
  tournamentId,
  decks,
  currentDeckId,
  dismissLabel,
  onDone,
}: {
  tournamentId: string;
  decks: Deck[];
  currentDeckId?: string;
  /** Texto del botón para salir sin cambios ("Ahora no" o "Cancelar"). */
  dismissLabel: string;
  onDone(changed: boolean): void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(currentDeckId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    if (selected === currentDeckId) {
      onDone(false);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await setMyTournamentDeck(tournamentId, selected ?? null);
      onDone(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      setError(
        /already started/i.test(message)
          ? t('app.decks.errors.locked')
          : message || t('app.decks.errors.chooseFailed'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DeckPicker decks={decks} value={selected} onChange={setSelected} />
      <p className="text-xs text-muted-foreground">{t('app.decks.lockHelp')}</p>
      {error && (
        <p role="alert" className="app-field-error">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="app-button app-button--secondary"
          onClick={() => onDone(false)}
        >
          {dismissLabel}
        </Button>
        <Button type="button" disabled={busy} className={primary} onClick={() => void save()}>
          {busy ? t('app.decks.saving') : t('app.decks.useDeck')}
        </Button>
      </div>
    </div>
  );
}
