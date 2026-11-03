import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { field, primary } from '@/components/ui/classes';
import type { Deck, DeckInput } from '@/data/deckRepository';
import {
  DECK_NAME_MAX_LENGTH,
  normalizeDeckUrl,
  validateDeck,
  type DeckErrors,
} from '@/lib/deckValidation';
import { getCommander, searchCommanders, type ScryfallCommander } from '@/lib/scryfall';
import { ColorPips } from '@/features/decks/ColorPips';

/** Formulario para agregar o editar un mazo, con buscador de comandantes en Scryfall. */
export function DeckForm({
  deck,
  onClose,
  onSave,
}: {
  deck?: Deck;
  onClose(): void;
  onSave(input: DeckInput): Promise<void>;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const [errors, setErrors] = useState<DeckErrors>({});
  const [busy, setBusy] = useState(false);
  const [commander, setCommander] = useState<ScryfallCommander | undefined>(
    deck?.commanderName
      ? { name: deck.commanderName, image: deck.commanderImage, colors: deck.colorIdentity }
      : undefined,
  );
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const submitted = useRef(false);

  // Espera a que se deje de escribir antes de consultar Scryfall.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchCommanders(query, controller.signal)
        .then((names) => {
          setSuggestions(names);
          setSearchFailed(false);
        })
        .catch((reason: unknown) => {
          if ((reason as Error).name !== 'AbortError') setSearchFailed(true);
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const chooseCommander = async (name: string) => {
    setSuggestions([]);
    setQuery('');
    try {
      setCommander(await getCommander(name));
      setSearchFailed(false);
    } catch {
      setSearchFailed(true);
    }
  };

  const readValues = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return { name: String(data.get('name') ?? ''), url: String(data.get('url') ?? '') };
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitted.current = true;
    const form = event.currentTarget;
    const values = readValues(form);
    const found = validateDeck(values);
    setErrors(found);
    if (found.name || found.url) {
      form.querySelector<HTMLElement>(`[name="${found.name ? 'name' : 'url'}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSave({
        name: values.name.trim(),
        url: normalizeDeckUrl(values.url)!,
        commanderName: commander?.name,
        commanderImage: commander?.image,
        colorIdentity: commander?.colors ?? '',
      });
    } catch (reason) {
      setErrors({ form: reason instanceof Error ? reason.message : 'app.decks.errors.saveFailed' });
    } finally {
      setBusy(false);
    }
  };

  const invalid = (name: 'name' | 'url') =>
    errors[name]
      ? { 'aria-invalid': true as const, 'aria-describedby': `deck-${name}-error` }
      : { 'aria-invalid': false as const };

  return (
    <Modal
      title={t(deck ? 'app.decks.editTitle' : 'app.decks.addTitle')}
      onClose={onClose}
      dialogClassName="sm:max-w-xl"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={save}
        onInput={(event) => {
          if (!submitted.current) return;
          const next = validateDeck(readValues(event.currentTarget));
          setErrors((current) => ({ ...current, name: next.name, url: next.url }));
        }}
      >
        {errors.form && (
          <p role="alert" className="app-field-error">
            {t(errors.form)}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium">
            {t('app.decks.url')}
            <input
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              defaultValue={deck?.url}
              placeholder="https://moxfield.com/decks/…"
              className={field}
              {...invalid('url')}
            />
          </label>
          {errors.url && (
            <p id="deck-url-error" className="app-field-error">
              {t(errors.url)}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">
            {t('app.decks.name')}
            <input
              name="name"
              autoComplete="off"
              maxLength={DECK_NAME_MAX_LENGTH}
              defaultValue={deck?.name}
              placeholder={t('app.decks.namePlaceholder')}
              className={field}
              {...invalid('name')}
            />
          </label>
          {errors.name && (
            <p id="deck-name-error" className="app-field-error">
              {t(errors.name)}
            </p>
          )}
        </div>

        <div>
          <span className="block text-sm font-medium">{t('app.decks.commander')}</span>
          {commander ? (
            <div className="deck-commander-chip">
              {commander.image && <img src={commander.image} alt="" />}
              <span>
                <strong>{commander.name}</strong>
                <ColorPips colors={commander.colors} />
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t('app.decks.removeCommander')}
                title={t('app.decks.removeCommander')}
                onClick={() => setCommander(undefined)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="deck-commander-search">
              <input
                type="search"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (event.target.value.trim().length < 2) setSuggestions([]);
                }}
                placeholder={t('app.decks.commanderPlaceholder')}
                aria-controls={listId}
                aria-expanded={suggestions.length > 0}
                role="combobox"
                aria-autocomplete="list"
                className={field}
              />
              {suggestions.length > 0 && (
                <ul id={listId} role="listbox" className="deck-commander-search__list">
                  {suggestions.map((name) => (
                    <li key={name} role="option" aria-selected="false">
                      <button type="button" onClick={() => void chooseCommander(name)}>
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {searchFailed ? t('app.decks.searchFailed') : t('app.decks.commanderHelp')}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="app-button app-button--secondary"
            onClick={onClose}
          >
            {t('app.common.cancel')}
          </Button>
          <Button disabled={busy} className={primary}>
            {busy ? t('app.decks.saving') : t('app.common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
