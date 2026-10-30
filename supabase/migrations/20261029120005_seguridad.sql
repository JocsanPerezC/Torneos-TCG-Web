-- Seguridad: RLS, políticas y permisos de tablas, vistas y funciones.
--
-- Consolidación de las 40 migraciones originales (2026-09-13 a 2026-10-29) en su estado final.
-- Ver docs/decisions/0004-consolidacion-de-migraciones.md.

-- Punto de partida: sin permisos para los roles de la API; abajo se otorgan uno por uno.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, service_role;

-- RLS, políticas y permisos

CREATE POLICY "admin read players" ON public.players FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read pod players" ON public.pod_players FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read pod results" ON public.pod_results FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read pods" ON public.pods FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read rounds" ON public.rounds FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read scoring rules" ON public.scoring_rules FOR SELECT USING (public.is_admin());

CREATE POLICY "admin read tournaments" ON public.tournaments FOR SELECT USING (public.is_admin());

ALTER TABLE public.login_accesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer create tournaments" ON public.tournaments FOR INSERT WITH CHECK (((owner_id = auth.uid()) AND public.is_organizer()));

CREATE POLICY "organizer delete tournaments" ON public.tournaments FOR DELETE USING (public.is_tournament_owner(id));

CREATE POLICY "organizer read tournaments" ON public.tournaments FOR SELECT USING (public.is_tournament_owner(id));

CREATE POLICY "organizer update tournaments" ON public.tournaments FOR UPDATE USING (public.is_tournament_owner(id)) WITH CHECK ((public.is_super_admin() OR ((owner_id = auth.uid()) AND public.is_organizer())));

CREATE POLICY "owner players" ON public.players USING (public.is_tournament_owner(tournament_id)) WITH CHECK (public.is_tournament_owner(tournament_id));

CREATE POLICY "owner pod players" ON public.pod_players USING ((EXISTS ( SELECT 1
   FROM (public.pods p
     JOIN public.rounds r ON ((r.id = p.round_id)))
  WHERE ((p.id = pod_players.pod_id) AND public.is_tournament_owner(r.tournament_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.pods p
     JOIN public.rounds r ON ((r.id = p.round_id)))
  WHERE ((p.id = pod_players.pod_id) AND public.is_tournament_owner(r.tournament_id)))));

CREATE POLICY "owner pod results" ON public.pod_results USING ((EXISTS ( SELECT 1
   FROM (public.pods p
     JOIN public.rounds r ON ((r.id = p.round_id)))
  WHERE ((p.id = pod_results.pod_id) AND public.is_tournament_owner(r.tournament_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.pods p
     JOIN public.rounds r ON ((r.id = p.round_id)))
  WHERE ((p.id = pod_results.pod_id) AND public.is_tournament_owner(r.tournament_id)))));

CREATE POLICY "owner pods" ON public.pods USING ((EXISTS ( SELECT 1
   FROM public.rounds r
  WHERE ((r.id = pods.round_id) AND public.is_tournament_owner(r.tournament_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rounds r
  WHERE ((r.id = pods.round_id) AND public.is_tournament_owner(r.tournament_id)))));

CREATE POLICY "owner rounds" ON public.rounds USING (public.is_tournament_owner(tournament_id)) WITH CHECK (public.is_tournament_owner(tournament_id));

CREATE POLICY "owner scoring" ON public.scoring_rules USING (public.is_tournament_owner(tournament_id)) WITH CHECK (public.is_tournament_owner(tournament_id));

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pod_players ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pod_results ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile own" ON public.profiles USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public tournament read" ON public.tournaments FOR SELECT USING (is_public);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tournament_join_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON FUNCTION public.complete_expired_rounds() FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_expired_rounds() TO service_role;

REVOKE ALL ON FUNCTION public.complete_google_signup_role(next_role public.app_role) FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_google_signup_role(next_role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.complete_google_signup_role(next_role public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.complete_signup_role(next_role public.app_role) FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_signup_role(next_role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.complete_signup_role(next_role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.complete_signup_role(next_role public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.create_or_rotate_tournament_join_link(p_tournament_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_or_rotate_tournament_join_link(p_tournament_id uuid) TO anon;
GRANT ALL ON FUNCTION public.create_or_rotate_tournament_join_link(p_tournament_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_or_rotate_tournament_join_link(p_tournament_id uuid) TO service_role;

GRANT ALL ON FUNCTION public.delete_tournament(tournament_id uuid) TO anon;
GRANT ALL ON FUNCTION public.delete_tournament(tournament_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.delete_tournament(tournament_id uuid) TO service_role;

GRANT ALL ON FUNCTION public.enforce_expired_round_completion() TO anon;
GRANT ALL ON FUNCTION public.enforce_expired_round_completion() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_expired_round_completion() TO service_role;

GRANT ALL ON FUNCTION public.enforce_player_profile_link() TO anon;
GRANT ALL ON FUNCTION public.enforce_player_profile_link() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_player_profile_link() TO service_role;

REVOKE ALL ON FUNCTION public.enforce_resolved_participant_names() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_resolved_participant_names() TO anon;
GRANT ALL ON FUNCTION public.enforce_resolved_participant_names() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_resolved_participant_names() TO service_role;

REVOKE ALL ON FUNCTION public.enforce_tournament_limit() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_tournament_limit() TO anon;
GRANT ALL ON FUNCTION public.enforce_tournament_limit() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_tournament_limit() TO service_role;

REVOKE ALL ON FUNCTION public.generate_tournament_join_code() FROM PUBLIC;
GRANT ALL ON FUNCTION public.generate_tournament_join_code() TO anon;
GRANT ALL ON FUNCTION public.generate_tournament_join_code() TO authenticated;
GRANT ALL ON FUNCTION public.generate_tournament_join_code() TO service_role;

REVOKE ALL ON FUNCTION public.get_joinable_tournament(p_token text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_joinable_tournament(p_token text) TO anon;
GRANT ALL ON FUNCTION public.get_joinable_tournament(p_token text) TO authenticated;
GRANT ALL ON FUNCTION public.get_joinable_tournament(p_token text) TO service_role;

REVOKE ALL ON FUNCTION public.get_my_player_statistics() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_player_statistics() TO anon;
GRANT ALL ON FUNCTION public.get_my_player_statistics() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_player_statistics() TO service_role;

REVOKE ALL ON FUNCTION public.get_my_player_tournaments() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_player_tournaments() TO anon;
GRANT ALL ON FUNCTION public.get_my_player_tournaments() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_player_tournaments() TO service_role;

GRANT ALL ON FUNCTION public.get_public_tournament(slug text) TO anon;
GRANT ALL ON FUNCTION public.get_public_tournament(slug text) TO authenticated;
GRANT ALL ON FUNCTION public.get_public_tournament(slug text) TO service_role;

REVOKE ALL ON FUNCTION public.get_tournament_join_code(p_tournament_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_tournament_join_code(p_tournament_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_tournament_join_code(p_tournament_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_tournament_join_code(p_tournament_id uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_tournament_join_link(p_tournament_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_tournament_join_link(p_tournament_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_tournament_join_link(p_tournament_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_tournament_join_link(p_tournament_id uuid) TO service_role;

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

GRANT ALL ON FUNCTION public.hydrate_linked_player_avatar() TO anon;
GRANT ALL ON FUNCTION public.hydrate_linked_player_avatar() TO authenticated;
GRANT ALL ON FUNCTION public.hydrate_linked_player_avatar() TO service_role;

GRANT ALL ON FUNCTION public.hydrate_linked_player_profile() TO anon;
GRANT ALL ON FUNCTION public.hydrate_linked_player_profile() TO authenticated;
GRANT ALL ON FUNCTION public.hydrate_linked_player_profile() TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;

GRANT ALL ON FUNCTION public.is_email_registered(candidate_email text) TO anon;
GRANT ALL ON FUNCTION public.is_email_registered(candidate_email text) TO authenticated;
GRANT ALL ON FUNCTION public.is_email_registered(candidate_email text) TO service_role;

REVOKE ALL ON FUNCTION public.is_organizer() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_organizer() TO anon;
GRANT ALL ON FUNCTION public.is_organizer() TO authenticated;
GRANT ALL ON FUNCTION public.is_organizer() TO service_role;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_super_admin() TO anon;
GRANT ALL ON FUNCTION public.is_super_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_super_admin() TO service_role;

GRANT ALL ON FUNCTION public.is_tournament_owner(tid uuid) TO anon;
GRANT ALL ON FUNCTION public.is_tournament_owner(tid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_tournament_owner(tid uuid) TO service_role;

REVOKE ALL ON FUNCTION public.join_tournament(p_token text, p_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.join_tournament(p_token text, p_name text) TO anon;
GRANT ALL ON FUNCTION public.join_tournament(p_token text, p_name text) TO authenticated;
GRANT ALL ON FUNCTION public.join_tournament(p_token text, p_name text) TO service_role;

GRANT ALL ON FUNCTION public.prevent_duplicate_round_assignment() TO anon;
GRANT ALL ON FUNCTION public.prevent_duplicate_round_assignment() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_duplicate_round_assignment() TO service_role;

GRANT ALL ON FUNCTION public.record_legal_consent(accepted_terms_version text, accepted_privacy_version text) TO anon;
GRANT ALL ON FUNCTION public.record_legal_consent(accepted_terms_version text, accepted_privacy_version text) TO authenticated;
GRANT ALL ON FUNCTION public.record_legal_consent(accepted_terms_version text, accepted_privacy_version text) TO service_role;

GRANT ALL ON FUNCTION public.reject_linked_player_name_update() TO anon;
GRANT ALL ON FUNCTION public.reject_linked_player_name_update() TO authenticated;
GRANT ALL ON FUNCTION public.reject_linked_player_name_update() TO service_role;

REVOKE ALL ON FUNCTION public.revoke_tournament_join_link(p_tournament_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.revoke_tournament_join_link(p_tournament_id uuid) TO anon;
GRANT ALL ON FUNCTION public.revoke_tournament_join_link(p_tournament_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.revoke_tournament_join_link(p_tournament_id uuid) TO service_role;

GRANT ALL ON FUNCTION public.save_tournament_snapshot(snapshot jsonb) TO anon;
GRANT ALL ON FUNCTION public.save_tournament_snapshot(snapshot jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.save_tournament_snapshot(snapshot jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.set_profile_role(target_profile_id uuid, next_role public.app_role) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_profile_role(target_profile_id uuid, next_role public.app_role) TO anon;
GRANT ALL ON FUNCTION public.set_profile_role(target_profile_id uuid, next_role public.app_role) TO authenticated;
GRANT ALL ON FUNCTION public.set_profile_role(target_profile_id uuid, next_role public.app_role) TO service_role;

GRANT ALL ON FUNCTION public.sync_linked_player_avatars() TO anon;
GRANT ALL ON FUNCTION public.sync_linked_player_avatars() TO authenticated;
GRANT ALL ON FUNCTION public.sync_linked_player_avatars() TO service_role;

GRANT ALL ON FUNCTION public.sync_linked_player_profile() TO anon;
GRANT ALL ON FUNCTION public.sync_linked_player_profile() TO authenticated;
GRANT ALL ON FUNCTION public.sync_linked_player_profile() TO service_role;

GRANT ALL ON TABLE public.login_accesses TO anon;
GRANT ALL ON TABLE public.login_accesses TO authenticated;
GRANT ALL ON TABLE public.login_accesses TO service_role;

GRANT ALL ON TABLE public.latest_login_accesses TO anon;
GRANT ALL ON TABLE public.latest_login_accesses TO authenticated;
GRANT ALL ON TABLE public.latest_login_accesses TO service_role;

GRANT ALL ON SEQUENCE public.login_accesses_id_seq TO anon;
GRANT ALL ON SEQUENCE public.login_accesses_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.login_accesses_id_seq TO service_role;

GRANT ALL ON TABLE public.players TO anon;
GRANT ALL ON TABLE public.players TO authenticated;
GRANT ALL ON TABLE public.players TO service_role;

GRANT ALL ON TABLE public.pod_players TO anon;
GRANT ALL ON TABLE public.pod_players TO authenticated;
GRANT ALL ON TABLE public.pod_players TO service_role;

GRANT ALL ON TABLE public.pod_results TO anon;
GRANT ALL ON TABLE public.pod_results TO authenticated;
GRANT ALL ON TABLE public.pod_results TO service_role;

GRANT ALL ON TABLE public.pods TO anon;
GRANT ALL ON TABLE public.pods TO authenticated;
GRANT ALL ON TABLE public.pods TO service_role;

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.profiles TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

GRANT UPDATE(display_name) ON TABLE public.profiles TO authenticated;

GRANT UPDATE(avatar_url) ON TABLE public.profiles TO authenticated;

GRANT ALL ON TABLE public.rounds TO anon;
GRANT ALL ON TABLE public.rounds TO authenticated;
GRANT ALL ON TABLE public.rounds TO service_role;

GRANT ALL ON TABLE public.tournaments TO anon;
GRANT ALL ON TABLE public.tournaments TO authenticated;
GRANT ALL ON TABLE public.tournaments TO service_role;

GRANT ALL ON TABLE public.published_tournament_snapshot TO anon;
GRANT ALL ON TABLE public.published_tournament_snapshot TO authenticated;
GRANT ALL ON TABLE public.published_tournament_snapshot TO service_role;

GRANT ALL ON TABLE public.scoring_rules TO anon;
GRANT ALL ON TABLE public.scoring_rules TO authenticated;
GRANT ALL ON TABLE public.scoring_rules TO service_role;

GRANT ALL ON TABLE public.tournament_join_links TO anon;
GRANT ALL ON TABLE public.tournament_join_links TO authenticated;
GRANT ALL ON TABLE public.tournament_join_links TO service_role;
