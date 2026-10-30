# Arquitectura del proyecto

## Propósito

Torneos TCG administra torneos multijugador de Commander y otros TCG. El organizador gestiona participantes, rondas, resultados y clasificación; la vista pública es de solo lectura.

## Punto de entrada y rutas activas

- `src/main.tsx` carga estilos, traducciones y `App`.
- `src/app/App.tsx` monta `AuthProvider`, `TournamentProvider`, `src/app/AppRouter.tsx` y Vercel Web Analytics una sola vez.
- `src/app/AppRouter.tsx` solo declara las rutas activas y sus guardas (consentimiento, solo local); cada pantalla vive en `src/features/<área>/`. Cada pantalla se carga bajo demanda con `lazyNamed` (React.lazy); las pestañas de un torneo comparten un solo chunk mediante `src/features/tournaments/routes.ts`. Si un chunk de un despliegue anterior ya no existe, `src/lib/chunkReload.ts` recarga la página una vez. `/dashboard` muestra una experiencia distinta según el rol; `/unirse/:token` procesa invitaciones de jugadores y `/perfil` es común a las cuentas autenticadas.

## Estructura de `src/`

| Carpeta            | Contenido                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`             | `App.tsx` (providers), `AppRouter.tsx` (rutas y guardas) y `FormLimits.tsx` (límites globales de formularios).                                                                                     |
| `features/<área>/` | Pantallas por área: `auth`, `dashboard`, `tournaments`, `public`, `player`, `admin`, `trial`, `profile`, `legal`, `landing` y `showcase`. Sus piezas propias van en `features/<área>/components/`. |
| `components/`      | Solo lo compartido entre áreas: `ui/`, `layout/` (`Layout`, `AuthenticatedShell`, `PublicHeader`) y `feedback/`.                                                                                   |
| `styles/`          | CSS por capa, importado en orden desde `src/index.css`; el orden de los imports define la cascada.                                                                                                 |
| `i18n/`            | `es.ts` y `en.ts` con las mismas claves, más `index.ts`, que inicializa i18next.                                                                                                                   |
| `domain/`          | Lógica pura y sus pruebas (`*.test.ts`).                                                                                                                                                           |
| `state/`           | `AuthContext` y `TournamentContext`.                                                                                                                                                               |
| `data/`            | Repositorios de Supabase.                                                                                                                                                                          |
| `lib/`             | Cliente Supabase, versión legal (`legal.ts`), GSAP y utilidades.                                                                                                                                   |
| `test/`            | Configuración de Vitest.                                                                                                                                                                           |

Los imports dentro de `src/` usan el alias `@/` (por ejemplo, `@/components/ui/button`); los `@import` de CSS siguen siendo relativos. Las variables de entorno públicas están documentadas en `.env.example`.

`/estadisticas` es una ruta autenticada exclusiva de las cuentas con rol `player`; muestra el historial global de sus inscripciones vinculadas.

## Capas

`/configuracion` es una ruta autenticada compartida por todos los roles para las preferencias globales de cuenta.

Para organizadores, `/dashboard` muestra el panel operativo y `/dashboard/tournaments` concentra el inventario de torneos propios.

| Capa            | Responsabilidad                                                                 | Ubicación                                      |
| --------------- | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| Dominio         | Tipos, distribución de mesas, emparejamientos, puntuación y estadísticas puros. | `src/domain/`                                  |
| Estado          | Sesión, torneos, modo demo y reglas de transición de rondas.                    | `src/state/`                                   |
| Datos           | Mapeo y operaciones de Supabase.                                                | `src/data/`                                    |
| Infraestructura | Cliente Supabase y utilidades compartidas.                                      | `src/lib/`                                     |
| Presentación    | Rutas, pantallas por área y componentes compartidos.                            | `src/app/`, `src/features/`, `src/components/` |
| Idiomas         | Recursos español/inglés.                                                        | `src/i18n/`                                    |
| Persistencia    | Esquema, RLS, RPCs, migraciones y Edge Functions.                               | `supabase/`                                    |

## Flujos importantes

### Torneos y rondas

Las pantallas de `src/features/tournaments/` usan `TournamentContext`. El contexto aplica las reglas del torneo y delega el emparejamiento a `src/domain/pairing.ts`; la clasificación se calcula con `src/domain/scoring.ts`. En modo remoto, los cambios del organizador se persisten mediante `src/data/tournamentRepository.ts`; los jugadores consultan sus inscripciones mediante `src/data/playerRepository.ts`. Sin Supabase, el estado se conserva en `localStorage` como modo demo.

La pantalla Jugadores puede solicitar una recarga manual del inventario remoto sin reemplazar la pantalla por un estado de carga; esa acción actualiza el estado compartido de `TournamentContext`.

Las mesas contienen de 3 a 5 jugadores. Un participante puede ser manual, sin cuenta, o estar vinculado opcionalmente a una cuenta con rol `player`; ambos participan en el mismo emparejamiento. Un nombre puede coexistir de forma temporal solo entre una inscripción manual y una vinculada, pero ninguna ronda se genera hasta que el organizador renombre al participante manual. El emparejamiento prioriza evitar rivales repetidos y luego aproxima las puntuaciones. Una ronda solo se termina cuando todas sus mesas tienen resultados válidos.

Los organizadores generan un enlace revocable y su QR asociado. El enlace conserva un token opaco; la misma invitación incluye un código manual corto y único. Una cuenta `player` abre el enlace o escribe el código y se inscribe por una función protegida de Supabase; su inscripción se asocia con su cuenta y alimenta su panel e historial. Las cuentas de organizador no pueden vincularse como participantes.

Las fotos de perfil se guardan en el bucket público `profile-avatars` de Supabase Storage, con una carpeta por cuenta protegida por RLS. El nombre y la URL se conservan en `profiles` y se replican en cada inscripción vinculada para los listados y la vista pública; los nombres vinculados solo se administran desde el perfil. Los participantes manuales y quienes no tengan foto mantienen el monograma de iniciales.

### Estadísticas globales de jugador

La RPC `get_my_player_statistics()` calcula torneos, rondas, resultados, puntos, kills y podios para las filas de `players` cuyo `profile_id` coincide con `auth.uid()`. Un podio se cuenta al finalizar el torneo o al completar todas sus rondas planificadas. La función se ejecuta con permisos controlados y no expone resultados ajenos al cliente. Los participantes manuales, que no tienen `profile_id`, no forman parte de este historial.

### Autenticación y permisos

`AuthContext` expone la sesión y los roles. Los roles de aplicación son `player`, `organizer`, `admin` y `super_admin`. Al iniciar sesión por primera vez, una cuenta nueva escoge entre `player` y `organizer`, salvo que llegue mediante `/unirse/:token`: en ese flujo se bloquea automáticamente como `player` para continuar la inscripción. La ruta de invitación queda temporalmente en `sessionStorage` durante el regreso desde OAuth para reanudar el flujo. Solo un `super_admin` puede modificar un rol ya bloqueado. `admin` y `super_admin` entran a la consola administrativa y no pueden crear torneos; esa acción se reserva al rol `organizer`. Hasta completar la selección, las funciones de organización e inscripción permanecen bloqueadas por RLS, triggers y funciones de Supabase, no solo por la interfaz. Las cuentas con identidad de correo pueden cambiar su contraseña desde Perfil al validar la actual; las cuentas que solo usan Google muestran que su contraseña se administra desde Google. El rol de cuenta se muestra en el menú de cuenta del sidebar. Una persona puede eliminar su propia cuenta desde Perfil tras escribir `ELIMINAR`; la Edge Function siempre usa la identidad autenticada y nunca acepta un identificador de cuenta arbitrario. La eliminación se bloquea si la cuenta posee torneos. Para cuentas sin torneos, elimina su avatar y desvincula sus inscripciones (`profile_id` y `avatar_url`) para preservar los resultados antes de borrar la cuenta de Auth.

Cada perfil tiene un nombre (`display_name`, privado: `profiles` solo lo leen la propia cuenta y los admins) y un apodo (`nickname`, único sin distinguir mayúsculas). El apodo es lo que se copia a `players.name` en las inscripciones vinculadas y lo que muestra el sidebar. Se elige al registrarse con correo; con Google se genera a partir del primer nombre y se confirma en `/completar-perfil`. `AuthContext.saveNickname` valida y guarda el apodo con la RPC `is_nickname_available`.

### Analítica

`src/app/App.tsx` monta `Analytics` de `@vercel/analytics/react` una sola vez. Vercel configura el script durante los despliegues y la aplicación no emite eventos personalizados; solo se registran vistas de página y transiciones de ruta para la analítica web agregada.

### Internacionalización

Los textos viven en `src/i18n/es.ts` y `src/i18n/en.ts`, con las mismas claves en ambos. Cualquier texto nuevo visible debe existir en los dos archivos. No agregues cadenas visibles hardcodeadas cuando ya se use una clave de traducción en esa pantalla.

## Fuentes de verdad de trabajo

- `AGENTS.md`: reglas de trabajo y contexto duradero.
- `docs/pendientes.md`: backlog de producto.
- `docs/prompts.md`: prompts reutilizables para agentes.
- `docs/decisions/`: decisiones técnicas con impacto futuro.
- `docs/auditoria-visual.md`: normalización visual resuelta y pendiente.
- `README.md`: presentación del producto (en inglés).
- `docs/setup.md`: instalación local, Supabase y despliegue (en inglés).

## Validación

- Estilo estático: `npm run lint`.
- Lógica de dominio: `npm test`.
- Integración del cliente: `npm run build`.

Ejecuta solo la validación proporcional al cambio; compila cuando se modifiquen rutas, estado, dependencias de interfaz o integración.
