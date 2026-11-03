import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/feedback/ConfirmModal';
import { showToast } from '@/components/ui/toast';
import { useAuth } from '@/state/AuthContext';
import {
  createDeck,
  deleteDeck,
  listDecks,
  updateDeck,
  type Deck,
  type DeckInput,
} from '@/data/deckRepository';
import { deckSource } from '@/lib/deckValidation';
import { DeckForm } from '@/features/decks/DeckForm';
import { ColorPips } from '@/features/decks/ColorPips';

/** "Mis mazos": enlaces de Moxfield o Archidekt con su comandante. */
export function DecksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>();
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<Deck | 'new'>();
  const [deleting, setDeleting] = useState<Deck>();

  const refresh = () =>
    listDecks()
      .then((items) => {
        setDecks(items);
        setError(undefined);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : t('app.decks.errors.loadFailed')),
      );

  useEffect(() => {
    let active = true;
    void listDecks()
      .then((items) => {
        if (active) setDecks(items);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : t('app.decks.errors.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, [t]);

  const save = async (input: DeckInput) => {
    if (editing === 'new') await createDeck(user!.id, input);
    else if (editing) await updateDeck(editing.id, input);
    setEditing(undefined);
    showToast(t('app.decks.saved'));
    await refresh();
  };

  const remove = async (deck: Deck) => {
    setDeleting(undefined);
    try {
      await deleteDeck(deck.id);
      showToast(t('app.decks.deleted'));
      await refresh();
    } catch (reason) {
      showToast(
        reason instanceof Error ? reason.message : t('app.decks.errors.deleteFailed'),
        true,
      );
    }
  };

  return (
    <div className="dashboard-board decks-page">
      <header className="dashboard-board__header decks-page__header">
        <h1 className="flex items-center gap-3">
          <Layers className="size-7 shrink-0 text-accent" aria-hidden="true" />
          {t('app.decks.title')}
        </h1>
        <Button
          type="button"
          className="app-button app-button--primary"
          onClick={() => setEditing('new')}
        >
          <Plus aria-hidden="true" />
          {t('app.decks.add')}
        </Button>
      </header>

      {!decks && !error && (
        <div className="app-loading-note">
          <i />
          <span>{t('app.common.loading')}</span>
        </div>
      )}
      {error && (
        <p role="alert" className="app-field-error">
          {error}
        </p>
      )}
      {decks && decks.length === 0 && (
        <div className="app-empty-state">
          <span aria-hidden="true">🂠</span>
          <p>{t('app.decks.empty')}</p>
        </div>
      )}
      {decks && decks.length > 0 && (
        <ul className="deck-grid">
          {decks.map((deck) => (
            <li key={deck.id} className="deck-card">
              <div className="deck-card__art">
                {deck.commanderImage ? (
                  <img src={deck.commanderImage} alt="" loading="lazy" />
                ) : (
                  <span aria-hidden="true">🂠</span>
                )}
              </div>
              <div className="deck-card__body">
                <h2>{deck.name}</h2>
                <p>
                  {deck.commanderName ?? t('app.decks.noCommander')}
                  {deck.commanderName && <ColorPips colors={deck.colorIdentity} />}
                </p>
                <div className="deck-card__actions">
                  <a
                    href={deck.url}
                    target="_blank"
                    rel="noreferrer"
                    className="app-button app-button--secondary"
                  >
                    <ExternalLink aria-hidden="true" />
                    {t(`app.decks.open.${deckSource(deck.url)}`)}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="app-icon-button"
                    aria-label={t('app.decks.edit', { name: deck.name })}
                    title={t('app.decks.edit', { name: deck.name })}
                    onClick={() => setEditing(deck)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="app-icon-button deck-card__delete"
                    aria-label={t('app.decks.delete', { name: deck.name })}
                    title={t('app.decks.delete', { name: deck.name })}
                    onClick={() => setDeleting(deck)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <ConfirmModal
          title={t('app.decks.deleteTitle')}
          description={t('app.decks.deleteConfirm', { name: deleting.name })}
          confirmLabel={t('app.common.delete')}
          destructive
          onClose={() => setDeleting(undefined)}
          onConfirm={() => void remove(deleting)}
        />
      )}
      {editing && (
        <DeckForm
          deck={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      )}
    </div>
  );
}
