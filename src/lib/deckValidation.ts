export type DeckSource = 'moxfield' | 'archidekt';
export type DeckField = 'name' | 'url';
export type DeckErrors = Partial<Record<DeckField | 'form', string>>;

export const DECK_NAME_MAX_LENGTH = 60;

/**
 * Acepta enlaces de mazo de Moxfield (moxfield.com/decks/<id>) o Archidekt
 * (archidekt.com/decks/<número>), con o sin "https://" y "www.".
 * Devuelve el enlace limpio, o undefined si no es un mazo de esos sitios.
 */
export function normalizeDeckUrl(value: string) {
  const raw = value.trim();
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const moxfield = host === 'moxfield.com' && url.pathname.match(/^\/decks\/([A-Za-z0-9_-]+)\/?$/);
  if (moxfield) return `https://moxfield.com/decks/${moxfield[1]}`;
  const archidekt = host === 'archidekt.com' && url.pathname.match(/^\/decks\/(\d+)(\/[^/]*)?\/?$/);
  if (archidekt) return `https://archidekt.com/decks/${archidekt[1]}`;
  return undefined;
}

export function deckSource(url: string): DeckSource {
  return url.includes('archidekt.com') ? 'archidekt' : 'moxfield';
}

/** Revisa el formulario de un mazo y devuelve la clave de i18n del problema de cada campo. */
export function validateDeck(values: { name: string; url: string }): DeckErrors {
  const errors: DeckErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'app.auth.errors.required';
  else if (name.length > DECK_NAME_MAX_LENGTH) errors.name = 'app.decks.errors.nameTooLong';
  if (!values.url.trim()) errors.url = 'app.auth.errors.required';
  else if (!normalizeDeckUrl(values.url)) errors.url = 'app.decks.errors.urlInvalid';
  return errors;
}
