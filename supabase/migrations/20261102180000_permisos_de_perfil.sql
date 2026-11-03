-- Seguridad: los usuarios solo pueden modificar su nombre, foto y apodo.
--
-- Antes, anon y authenticated tenían UPDATE sobre TODA la tabla profiles y la política
-- "profile own" solo exige que la fila sea la propia. Con eso, cualquier cuenta podía hacer
-- desde la API `update profiles set role = 'super_admin'` sobre su propio perfil.
-- El rol, el bloqueo de rol y el consentimiento legal ya se cambian únicamente con funciones
-- SECURITY DEFINER (complete_signup_role, complete_google_signup_role, record_legal_consent) o
-- con la Edge Function admin-users, así que no necesitan permiso directo.
--
-- Revocar UPDATE de la tabla también revoca los permisos por columna; se vuelven a dar abajo.

REVOKE UPDATE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public.profiles FROM anon, authenticated;

GRANT UPDATE (display_name, avatar_url, nickname) ON TABLE public.profiles TO authenticated;
