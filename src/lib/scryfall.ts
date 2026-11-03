// Búsqueda de comandantes en Scryfall (API pública, sin clave). Pide no superar ~10
// solicitudes por segundo, por eso quien la use debe esperar a que se deje de escribir.
const API = 'https://api.scryfall.com';

export type ScryfallCommander = {
  name: string;
  /** Recorte del arte de la carta, sin marco. */
  image?: string;
  /** Identidad de color en orden WUBRG, por ejemplo "WUBG". */
  colors: string;
};

/** Nombres de cartas que empiezan como lo escrito (solo legendarias, que pueden comandar). */
export async function searchCommanders(query: string, signal?: AbortSignal) {
  const text = query.trim();
  if (text.length < 2) return [];
  const params = new URLSearchParams({ q: `${text} is:commander`, order: 'edhrec' });
  const response = await fetch(`${API}/cards/search?${params}`, { signal });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error('scryfall');
  const body = (await response.json()) as { data?: Array<{ name: string }> };
  return [...new Set((body.data ?? []).map((card) => card.name))].slice(0, 8);
}

/** Datos para mostrar un comandante: nombre exacto, arte e identidad de color. */
export async function getCommander(name: string): Promise<ScryfallCommander> {
  const response = await fetch(`${API}/cards/named?${new URLSearchParams({ exact: name })}`);
  if (!response.ok) throw new Error('scryfall');
  const card = (await response.json()) as {
    name: string;
    color_identity?: string[];
    image_uris?: { art_crop?: string };
    card_faces?: Array<{ image_uris?: { art_crop?: string } }>;
  };
  const order = 'WUBRG';
  return {
    name: card.name,
    image: card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop,
    colors: (card.color_identity ?? [])
      .filter((color) => order.includes(color))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .join(''),
  };
}
