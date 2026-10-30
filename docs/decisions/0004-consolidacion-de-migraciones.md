# ADR 0004: consolidación de migraciones

- Estado: aceptada
- Fecha: 2026-10-29

## Contexto

`supabase/migrations/` acumulaba 40 migraciones (2026-09-13 a 2026-10-29). Muchas redefinían las mismas funciones (por ejemplo, `save_tournament_snapshot` cambió seis veces) o corregían datos puntuales de ese momento. Leer el estado real de la base exigía recorrer todo el historial.

## Decisión

Las 40 migraciones se reemplazan por 6 archivos temáticos que contienen el estado final del esquema:

| Archivo                                       | Contenido                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `20261029120000_esquema_base.sql`             | Extensiones, tipos, tablas, secuencias, restricciones e índices.                            |
| `20261029120001_cuentas_y_roles.sql`          | Roles, perfiles, elección de rol, consentimiento legal, accesos y trigger de Auth.          |
| `20261029120002_torneos.sql`                  | Guardado atómico, borrado, límites, vencimiento de rondas, vista pública y tarea `pg_cron`. |
| `20261029120003_invitaciones_y_jugadores.sql` | Enlaces y códigos de invitación, inscripción y sincronización de jugadores vinculados.      |
| `20261029120004_perfil_y_estadisticas.sql`    | Fotos de perfil (bucket y políticas de Storage) y estadísticas globales.                    |
| `20261029120005_seguridad.sql`                | RLS, políticas y permisos de tablas, vistas y funciones.                                    |

El SQL se generó con `pg_dump` desde una base local con las 40 migraciones aplicadas y se repartió por tema. La seguridad parte de quitar todos los permisos de `public` a `anon`, `authenticated` y `service_role` y luego los otorga uno por uno, porque `pg_dump` no escribe los `REVOKE` sobre esos roles.

Verificación: una base local creada solo con los 6 archivos produce un `pg_dump --schema-only --schema=public` idéntico al de las 40 migraciones originales, y coinciden también las extensiones, el trigger de `auth.users`, el bucket y las políticas de Storage y la tarea de `pg_cron`.

Se omitieron las correcciones de datos de filas existentes (activar torneos y rondas antiguos, completar `auth_provider`, `avatar_url` y nombres vinculados): en una base nueva no afectan nada y en producción ya se aplicaron. Los comentarios originales de las migraciones se pierden; las 40 versiones siguen disponibles en el historial de git.

## Consecuencias

- El proyecto remoto necesita reparar su historial una sola vez para no volver a aplicar los archivos nuevos:

  ```bash
  npx supabase migration list --linked
  npx supabase migration repair --linked --status reverted 20260913000000 20260913000001 20260913000002 20260913000003 20260913000004 20260913000005 20260913000006 20260913000007 20260913000008 20260913000009 20260913000010 20260913000011 20260913000012 20260913000013 20260913000014 20260913000015 20260913000016 20260914000000 20260914000001 20260914000002 20260914000003 20260914000004 20260919000000 20260920000000 20260920000001 20260922000000 20260923000000 20261003000000 20261005000000 20261005000001 20261027000000 20261027000001 20261027000002 20261027000003 20261027000004 20261027000005 20261028000000 20261028000001 20261028000002 20261029000000
  npx supabase migration repair --linked --status applied 20261029120000 20261029120001 20261029120002 20261029120003 20261029120004 20261029120005
  npx supabase migration list --linked
  ```

  `repair` solo modifica `supabase_migrations.schema_migrations`; no ejecuta SQL sobre las tablas ni toca datos.

- En producción, el historial remoto tenía 37 versiones: `20261028000001`, `20261028000002` y `20261029000000` se habían aplicado a mano desde el SQL Editor. Se comprobó que sus objetos existían (columna y bucket de avatares, políticas de Storage, `get_my_player_statistics`, `sync_linked_player_profile` y sus triggers) antes de marcar las 6 versiones nuevas como aplicadas. `repair --status reverted` sobre una versión que no está registrada no tiene efecto.

- A partir de aquí la regla vuelve a ser la de siempre: las migraciones aplicadas son historial inmutable y cada cambio nuevo va en una migración nueva con fecha.
- Una consolidación futura debe repetir la verificación por volcado de esquema antes de reemplazar archivos.
