# Contexto de Supabase

- Las migraciones son historial inmutable: agrega una nueva migración fechada; no reescribas una ya aplicada.
- Mantén alineados el esquema, las políticas RLS, las funciones RPC, `src/domain/types.ts` y `src/data/` cuando un cambio afecte persistencia.
- El frontend solo usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca expongas `service_role`, secretos ni credenciales administrativas.
- Las Edge Functions pueden usar privilegios administrativos únicamente después de validar el rol correspondiente en el servidor.
- No ejecutes migraciones, despliegues ni cambios remotos sin una solicitud explícita.
