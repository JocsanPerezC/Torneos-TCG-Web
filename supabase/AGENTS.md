# Contexto de Supabase

- Las migraciones son historial inmutable: agrega una nueva migración fechada; no reescribas una ya aplicada.
- La base parte de 6 migraciones temáticas consolidadas el 2026-10-29 (esquema, cuentas, torneos, invitaciones, perfil y seguridad). Para entender una tabla o función, empieza por ellas; ver `docs/decisions/0004-consolidacion-de-migraciones.md`. Las migraciones posteriores (apodo e historial de jugador, 2026-10-30) van aparte y el usuario las aplica a mano en el SQL Editor.
- Mantén alineados el esquema, las políticas RLS, las funciones RPC, `src/domain/types.ts` y `src/data/` cuando un cambio afecte persistencia.
- El frontend solo usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca expongas `service_role`, secretos ni credenciales administrativas.
- Las Edge Functions pueden usar privilegios administrativos únicamente después de validar el rol correspondiente en el servidor.
- No ejecutes migraciones, despliegues ni cambios remotos sin una solicitud explícita.
