-- Mazos del jugador: enlace a Moxfield o Archidekt, nombre y, opcionalmente, el comandante
-- buscado en Scryfall (nombre, arte e identidad de color). Cada cuenta solo ve y edita los suyos.

CREATE TABLE public.decks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    url text NOT NULL,
    commander_name text,
    commander_image text,
    color_identity text DEFAULT '' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT decks_name_length CHECK (char_length(trim(name)) BETWEEN 1 AND 60),
    CONSTRAINT decks_url_source CHECK (
      url ~* '^https://(www\.)?(moxfield\.com/decks/[A-Za-z0-9_-]+|archidekt\.com/decks/[0-9]+)'
    ),
    CONSTRAINT decks_color_identity CHECK (color_identity ~ '^[WUBRG]{0,5}$')
);

CREATE INDEX decks_profile_id_idx ON public.decks USING btree (profile_id, created_at);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deck own" ON public.decks
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.decks TO authenticated;
GRANT ALL ON TABLE public.decks TO service_role;
