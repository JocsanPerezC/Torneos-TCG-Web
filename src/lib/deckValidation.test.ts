import { describe, expect, it } from 'vitest';
import { deckSource, normalizeDeckUrl, validateDeck } from '@/lib/deckValidation';

describe('enlaces de mazo', () => {
  it('acepta Moxfield con o sin https y www', () => {
    expect(normalizeDeckUrl('https://www.moxfield.com/decks/AbC-12_x')).toBe(
      'https://moxfield.com/decks/AbC-12_x',
    );
    expect(normalizeDeckUrl('moxfield.com/decks/AbC12/')).toBe('https://moxfield.com/decks/AbC12');
  });

  it('acepta Archidekt y descarta el nombre del mazo en la ruta', () => {
    expect(normalizeDeckUrl('https://archidekt.com/decks/123456/mi_mazo')).toBe(
      'https://archidekt.com/decks/123456',
    );
  });

  it('rechaza otros sitios o páginas que no son un mazo', () => {
    expect(normalizeDeckUrl('https://moxfield.com/users/jocsan')).toBeUndefined();
    expect(normalizeDeckUrl('https://evil.com/decks/abc')).toBeUndefined();
    expect(normalizeDeckUrl('no es un enlace')).toBeUndefined();
    expect(normalizeDeckUrl('')).toBeUndefined();
  });

  it('reconoce de qué sitio es el enlace', () => {
    expect(deckSource('https://archidekt.com/decks/1')).toBe('archidekt');
    expect(deckSource('https://moxfield.com/decks/a')).toBe('moxfield');
  });

  it('señala cada campo con su motivo', () => {
    expect(validateDeck({ name: '', url: 'https://google.com' })).toEqual({
      name: 'app.auth.errors.required',
      url: 'app.decks.errors.urlInvalid',
    });
    expect(validateDeck({ name: 'Atraxa', url: 'moxfield.com/decks/abc' })).toEqual({});
  });
});
