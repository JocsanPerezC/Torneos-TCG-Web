-- Evita que el endpoint de registro revele si una dirección de correo ya tiene una cuenta.
-- La interfaz deja que Supabase Auth procese el registro sin consultar auth.users.

REVOKE ALL ON FUNCTION public.is_email_registered(text) FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.is_email_registered(text);

-- Estas RPC requieren una sesión válida; nunca deben estar disponibles para el rol anónimo.
REVOKE ALL ON FUNCTION public.complete_google_signup_role(public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.complete_signup_role(public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.create_or_rotate_tournament_join_link(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_tournament(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_my_player_statistics() FROM anon;
REVOKE ALL ON FUNCTION public.get_my_player_tournaments() FROM anon;
REVOKE ALL ON FUNCTION public.get_tournament_join_code(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_tournament_join_link(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.join_tournament(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.record_legal_consent(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.revoke_tournament_join_link(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.save_tournament_snapshot(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.set_profile_role(uuid, public.app_role) FROM anon;
