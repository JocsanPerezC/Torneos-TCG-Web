-- Esquema base: tipos, tablas, secuencias, restricciones e índices de todas las áreas.
--
-- Consolidación de las 40 migraciones originales (2026-09-13 a 2026-10-29) en su estado final.
-- Ver docs/decisions/0004-consolidacion-de-migraciones.md.

-- Extensiones

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tipos, tablas, restricciones e índices

CREATE TYPE public.app_role AS ENUM (
    'organizer',
    'admin',
    'super_admin',
    'player'
);

CREATE TYPE public.pod_result_outcome AS ENUM (
    'win',
    'loss',
    'draw'
);

CREATE TYPE public.result_type AS ENUM (
    'normal',
    'combo',
    'empate'
);

CREATE TYPE public.round_status AS ENUM (
    'borrador',
    'activa',
    'completada'
);

CREATE TYPE public.tournament_status AS ENUM (
    'borrador',
    'activo',
    'finalizado'
);

CREATE TABLE public.login_accesses (
    id bigint NOT NULL,
    account_id uuid NOT NULL,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    country text DEFAULT 'Ubicación no disponible'::text NOT NULL,
    city text DEFAULT 'Ubicación no disponible'::text NOT NULL,
    browser text DEFAULT 'Navegador no disponible'::text NOT NULL,
    operating_system text DEFAULT 'Sistema operativo no disponible'::text NOT NULL,
    device_type text DEFAULT 'Dispositivo no disponible'::text NOT NULL
);

COMMENT ON TABLE public.login_accesses IS 'Successful login audit records. Entries are retained until a future maintenance policy removes them.';

ALTER TABLE public.login_accesses ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.login_accesses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    name text NOT NULL,
    normalized_name text GENERATED ALWAYS AS (lower(TRIM(BOTH FROM name))) STORED,
    is_active boolean DEFAULT true NOT NULL,
    tie_breaker integer DEFAULT 0 NOT NULL,
    profile_id uuid,
    avatar_url text,
    CONSTRAINT players_name_check CHECK ((length(TRIM(BOTH FROM name)) > 0))
);

CREATE TABLE public.pod_players (
    pod_id uuid NOT NULL,
    player_id uuid NOT NULL
);

CREATE TABLE public.pod_results (
    pod_id uuid NOT NULL,
    player_id uuid NOT NULL,
    "position" integer,
    kills integer DEFAULT 0 NOT NULL,
    is_dead boolean DEFAULT false NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    outcome public.pod_result_outcome,
    CONSTRAINT pod_results_kills_range CHECK (((kills >= 0) AND (kills <= 5))),
    CONSTRAINT pod_results_points_nonnegative CHECK ((points >= 0)),
    CONSTRAINT pod_results_position_check CHECK (("position" > 0))
);

CREATE TABLE public.pods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    round_id uuid NOT NULL,
    number integer NOT NULL,
    result_type public.result_type,
    notes text,
    CONSTRAINT pods_number_check CHECK ((number > 0))
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.app_role DEFAULT 'organizer'::public.app_role NOT NULL,
    auth_provider text DEFAULT 'email'::text NOT NULL,
    terms_accepted_at timestamp with time zone,
    terms_version text,
    privacy_accepted_at timestamp with time zone,
    privacy_version text,
    legal_consent_required boolean DEFAULT false NOT NULL,
    role_locked boolean DEFAULT true NOT NULL,
    avatar_url text,
    CONSTRAINT profiles_auth_provider_check CHECK ((auth_provider = ANY (ARRAY['email'::text, 'google'::text])))
);

CREATE TABLE public.rounds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    number integer NOT NULL,
    status public.round_status DEFAULT 'borrador'::public.round_status NOT NULL,
    seed bigint NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    CONSTRAINT rounds_number_check CHECK ((number > 0))
);

CREATE TABLE public.tournaments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    format text DEFAULT 'Commander'::text NOT NULL,
    planned_rounds integer NOT NULL,
    status public.tournament_status DEFAULT 'borrador'::public.tournament_status NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    public_slug text DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    max_players integer DEFAULT 32 NOT NULL,
    max_tables integer DEFAULT 8 NOT NULL,
    information text DEFAULT ''::text NOT NULL,
    CONSTRAINT tournaments_information_check CHECK ((char_length(information) <= 2000)),
    CONSTRAINT tournaments_max_players_check CHECK (((max_players >= 3) AND (max_players <= 50))),
    CONSTRAINT tournaments_max_tables_check CHECK (((max_tables >= 1) AND (max_tables <= 25))),
    CONSTRAINT tournaments_name_check CHECK ((length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT tournaments_planned_rounds_check CHECK ((planned_rounds > 0))
);

CREATE TABLE public.scoring_rules (
    tournament_id uuid NOT NULL,
    first_place integer DEFAULT 3 NOT NULL,
    second_place integer DEFAULT 2 NOT NULL,
    third_place integer DEFAULT 1 NOT NULL,
    fourth_place integer DEFAULT 0 NOT NULL,
    combo_winner integer DEFAULT 3 NOT NULL,
    combo_other integer DEFAULT 1 NOT NULL,
    tie_points integer DEFAULT 3 NOT NULL,
    CONSTRAINT scoring_rules_combo_other_check CHECK ((combo_other >= 0)),
    CONSTRAINT scoring_rules_combo_winner_check CHECK ((combo_winner >= 0)),
    CONSTRAINT scoring_rules_first_place_check CHECK ((first_place >= 0)),
    CONSTRAINT scoring_rules_fourth_place_check CHECK ((fourth_place >= 0)),
    CONSTRAINT scoring_rules_second_place_check CHECK ((second_place >= 0)),
    CONSTRAINT scoring_rules_third_place_check CHECK ((third_place >= 0)),
    CONSTRAINT scoring_rules_tie_points_check CHECK ((tie_points >= 0))
);

CREATE TABLE public.tournament_join_links (
    tournament_id uuid NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    code text NOT NULL
);

ALTER TABLE ONLY public.login_accesses
    ADD CONSTRAINT login_accesses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pod_players
    ADD CONSTRAINT pod_players_pkey PRIMARY KEY (pod_id, player_id);

ALTER TABLE ONLY public.pod_results
    ADD CONSTRAINT pod_results_pkey PRIMARY KEY (pod_id, player_id);

ALTER TABLE ONLY public.pods
    ADD CONSTRAINT pods_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pods
    ADD CONSTRAINT pods_round_id_number_key UNIQUE (round_id, number);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_tournament_id_number_key UNIQUE (tournament_id, number);

ALTER TABLE ONLY public.scoring_rules
    ADD CONSTRAINT scoring_rules_pkey PRIMARY KEY (tournament_id);

ALTER TABLE ONLY public.tournament_join_links
    ADD CONSTRAINT tournament_join_links_pkey PRIMARY KEY (tournament_id);

ALTER TABLE ONLY public.tournament_join_links
    ADD CONSTRAINT tournament_join_links_token_key UNIQUE (token);

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_public_slug_key UNIQUE (public_slug);

CREATE INDEX login_accesses_account_accessed_at_idx ON public.login_accesses USING btree (account_id, accessed_at DESC);

CREATE INDEX players_profile_idx ON public.players USING btree (profile_id);

CREATE UNIQUE INDEX players_tournament_account_name_key ON public.players USING btree (tournament_id, normalized_name) WHERE (profile_id IS NOT NULL);

CREATE INDEX players_tournament_idx ON public.players USING btree (tournament_id);

CREATE UNIQUE INDEX players_tournament_manual_name_key ON public.players USING btree (tournament_id, normalized_name) WHERE (profile_id IS NULL);

CREATE UNIQUE INDEX players_tournament_profile_unique ON public.players USING btree (tournament_id, profile_id) WHERE (profile_id IS NOT NULL);

CREATE INDEX pods_round_idx ON public.pods USING btree (round_id);

CREATE INDEX rounds_tournament_idx ON public.rounds USING btree (tournament_id);

CREATE UNIQUE INDEX tournament_join_links_code_key ON public.tournament_join_links USING btree (code);

ALTER TABLE ONLY public.login_accesses
    ADD CONSTRAINT login_accesses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pod_players
    ADD CONSTRAINT pod_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.pod_players
    ADD CONSTRAINT pod_players_pod_id_fkey FOREIGN KEY (pod_id) REFERENCES public.pods(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pod_results
    ADD CONSTRAINT pod_results_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.pod_results
    ADD CONSTRAINT pod_results_pod_id_fkey FOREIGN KEY (pod_id) REFERENCES public.pods(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pods
    ADD CONSTRAINT pods_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.scoring_rules
    ADD CONSTRAINT scoring_rules_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tournament_join_links
    ADD CONSTRAINT tournament_join_links_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
