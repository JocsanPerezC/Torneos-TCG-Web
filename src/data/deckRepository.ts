import { supabase } from '@/lib/supabase';

export type Deck = {
  id: string;
  name: string;
  url: string;
  commanderName?: string;
  commanderImage?: string;
  /** Identidad de color del comandante en orden WUBRG ("" si no se eligió comandante). */
  colorIdentity: string;
  createdAt: string;
};

export type DeckInput = Omit<Deck, 'id' | 'createdAt'>;

type Row = Record<string, unknown>;

function client() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}

const toDeck = (row: Row): Deck => ({
  id: String(row.id),
  name: String(row.name),
  url: String(row.url),
  commanderName: row.commander_name ? String(row.commander_name) : undefined,
  commanderImage: row.commander_image ? String(row.commander_image) : undefined,
  colorIdentity: String(row.color_identity ?? ''),
  createdAt: String(row.created_at),
});

const toRow = (input: DeckInput) => ({
  name: input.name,
  url: input.url,
  commander_name: input.commanderName ?? null,
  commander_image: input.commanderImage ?? null,
  color_identity: input.colorIdentity,
});

export async function listDecks(): Promise<Deck[]> {
  const { data, error } = await client()
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(toDeck);
}

export async function createDeck(profileId: string, input: DeckInput) {
  const { error } = await client()
    .from('decks')
    .insert({ ...toRow(input), profile_id: profileId });
  if (error) throw error;
}

export async function updateDeck(id: string, input: DeckInput) {
  const { error } = await client().from('decks').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteDeck(id: string) {
  const { error } = await client().from('decks').delete().eq('id', id);
  if (error) throw error;
}
