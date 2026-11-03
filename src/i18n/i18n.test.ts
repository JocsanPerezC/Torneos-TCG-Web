import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';

/** Cada texto con su ruta de claves, por ejemplo ["app.decks.title", "Mis mazos"]. */
function entries(value: unknown, prefix = ''): Array<[string, unknown]> {
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, child]) =>
      entries(child, prefix ? `${prefix}.${key}` : key),
    );
  return [[prefix, value]];
}

describe('textos', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    const spanish = new Set(entries(es).map(([path]) => path));
    const english = new Set(entries(en).map(([path]) => path));
    expect([...spanish].filter((path) => !english.has(path))).toEqual([]);
    expect([...english].filter((path) => !spanish.has(path))).toEqual([]);
  });

  it('ningún texto queda vacío', () => {
    const empty = (messages: unknown) =>
      entries(messages)
        .filter(([, text]) => typeof text === 'string' && !text.trim())
        .map(([path]) => path);
    expect(empty(es)).toEqual([]);
    expect(empty(en)).toEqual([]);
  });
});
