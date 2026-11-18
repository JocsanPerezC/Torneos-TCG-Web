# Análisis técnico de Administración

> Estado: referencia funcional viva de la consola administrativa.
>
> Última revisión: 18 de noviembre de 2026.
>
> Alcance: análisis estático del repositorio, sin consultar una base de datos remota. Los ejemplos son realistas y anonimizados; no son datos de producción.

## Mantenimiento y fuentes canónicas

Este documento describe la sección Administración para rediseñarla o mantenerla sin perder comportamientos. No sustituye las fuentes de verdad del proyecto:

| Tema | Fuente canónica |
|---|---|
| Rutas, capas, estado y comandos | `docs/architecture.md` |
| Tokens, responsive y accesibilidad visual | `docs/design-system.md` |
| Decisiones técnicas duraderas | `docs/decisions/` |
| Esquema, RLS, RPCs y Edge Functions | `supabase/migrations/` y `supabase/functions/` |
| Backlog de producto | `docs/pendientes.md` |

Al modificar Administración, actualiza aquí únicamente la sección afectada y la fecha de revisión. Si el cambio altera rutas, capas de datos, persistencia o validación, actualiza también `docs/architecture.md`; si establece una regla técnica duradera, registra una decisión en `docs/decisions/`. No copies SQL completo ni dupliques decisiones: enlaza o referencia el archivo fuente correspondiente.

## 1. Stack y estructura

| Área | Implementación |
|---|---|
| Framework / build | Vite 8 + React 19.2.8 |
| Lenguaje | TypeScript 6 |
| Rutas | `react-router-dom` 7 |
| Estilos | Tailwind CSS 4 y CSS propio en `src/styles/` |
| UI | Componentes locales; `Button` usa `class-variance-authority` y Radix `Slot`. No hay dependencia instalada de shadcn/ui. |
| Iconos | `lucide-react` |
| Fuente | Fredoka desde Google Fonts, pesos 400, 500, 600 y 700 |
| Animación | GSAP existe en el proyecto; Administración usa sobre todo CSS y `animate-spin` |
| Base de datos | Supabase PostgreSQL |
| ORM | No existe; usa `@supabase/supabase-js`, PostgREST y RPCs directas |
| Autenticación | Supabase Auth: correo/contraseña, recuperación y Google OAuth |
| Analítica | Vercel Web Analytics sin eventos personalizados |

### Rutas y archivos

| Elemento | Ruta |
|---|---|
| Ruta activa | `src/app/AppRouter.tsx` → `/admin` |
| Guarda | `src/features/admin/AdminRoute.tsx` |
| Pantalla principal | `src/features/admin/AdminDashboard.tsx` |
| Jugadores activos | `src/features/admin/SuperAdminPlayerManagement.tsx` |
| Datos completos | `src/features/admin/AdminDataInspector.tsx` |
| Modal de cuenta | `src/features/admin/UserProfileModal.tsx` |
| Caché | `src/features/admin/adminCache.ts` |
| Formateo | `src/features/admin/adminFormat.ts` |
| Resumen administrativo | `src/data/adminRepository.ts` |
| Cuentas administradas | `src/data/adminUsersRepository.ts` |
| Torneos/jugadores | `src/data/tournamentRepository.ts` |
| Tipos del inspector | `src/domain/types.ts` |
| Sesión y rol | `src/state/AuthContext.tsx` |
| Layout/navegación | `src/components/layout/Layout.tsx`, `src/components/layout/AuthenticatedShell.tsx` |
| UI compartida | `src/components/ui/button.tsx`, `Metric.tsx`, `Badge.tsx`, `Avatar.tsx`, `modal.tsx`, `toast.tsx` |
| Traducciones | `src/i18n/es.ts`, `src/i18n/en.ts` |
| Edge Function | `supabase/functions/admin-users/index.ts` |
| Esquema/RLS/RPC | `supabase/migrations/*.sql` |
| Estilos relevantes | `src/styles/base.css`, `app-tools.css`, `app-shell.css`, `global.css` |

No existen API Routes de Next.js, Server Actions ni backend Express. El único endpoint propio es la Supabase Edge Function `admin-users`; el resto usa Supabase PostgREST y RPCs.

### Protección y roles

- `/admin` aplica `AdminRoute` en frontend:
  - Sin Supabase configurado: redirige a `/`.
  - Cargando sesión: `Verificando permisos de administración…`.
  - Sin sesión: `/login`.
  - Sin rol administrativo: `/dashboard`.
  - Con `admin` o `super_admin`: abre la consola.
- La consola **no es exclusiva de `super_admin`**: `admin` puede entrar y leer datos. Las mutaciones se limitan visualmente a `super_admin`.
- `AuthContext` obtiene `profiles.role`: `player`, `organizer`, `admin` o `super_admin`.
- Protección real en base:
  - `public.is_admin()` habilita lecturas administrativas por RLS.
  - `public.is_super_admin()` protege acciones privilegiadas.
  - `public.is_tournament_owner()` permite gestionar un torneo al propietario o a `super_admin`.
- La Function tiene `verify_jwt = false` en configuración, pero exige `Authorization`, ejecuta `auth.getUser()` y para las acciones administrativas verifica `profiles.role = 'super_admin'`.

## 2. Inventario completo de la pantalla actual

### Header

En orden:

1. `ACCESO RESTRINGIDO` con icono `ShieldCheck`.
2. `Administración`.
3. `Vista global de la aplicación. Solo un superadministrador puede cambiar roles.`
4. Botón secundario `Actualizar`; mientras solicita datos dice `Actualizando…` y gira el icono.

El botón llama exclusivamente a `loadAdminOverview()`: recarga perfiles y resumen de torneos. No refresca explícitamente usuarios de Auth, historial de accesos ni la caché de Jugadores activos/Datos completos.

### Métricas

| Tarjeta | Cálculo | Actualización |
|---|---|---|
| `Cuentas` | `profiles.length`; para `admin` excluye `super_admin`, para `super_admin` los incluye | Carga y Actualizar |
| `Acceso admin` | Perfiles con `role === 'admin'`; no incluye `super_admin` | Carga y Actualizar |
| `Torneos activos` | Torneos con `status === 'activo'` | Carga y Actualizar |
| `Jugadores registrados` | Suma `playerCount` de todos los torneos; incluye inactivos y cuenta una persona una vez por torneo | Carga y Actualizar |

Sin `overview`, las tarjetas muestran `—`.

Consulta exacta:

```ts
profiles
  .select('id, display_name, nickname, avatar_url, role, created_at')
  .order('created_at', { ascending: false })

tournaments
  .select('id, owner_id, name, format, status, is_public, created_at, players(count), rounds(count)')
  .order('created_at', { ascending: false })
```

### Pestaña Cuentas

Columnas, en orden:

1. `Usuario`: avatar, `displayName` y debajo `nickname`.
2. `Correo`: solo superadministración; para `admin`, `—`.
3. `Rol`: `Organizador`, `Administrador`, `Superadministrador` o `Jugador`.
4. `Registro`: `profiles.created_at`, formateado como `es-CR` o `en-US`.
5. `Último acceso`: solo superadministración; último `login_accesses.accessed_at` o `Sin registros`; para `admin`, `Restringido`.
6. `Desde`: ciudad/país y, en tooltip, navegador, sistema y dispositivo; para `admin`, `Restringido`.
7. `ID`: UUID de perfil.
8. `Acciones`: solo superadministración y nunca para la cuenta actual: `Editar`, `Eliminar`.

Búsqueda:

- Placeholder `Buscar cuenta`.
- Local, sin mayúsculas/minúsculas; busca `displayName`, `nickname`, rol y correo si está disponible.
- Contador `{{count}} en total` previo al filtro.
- Sin filtro por rol/fecha/estado/actividad/país, sin orden por columnas y sin paginación.
- La tabla tiene scroll interno y ancho mínimo de `1080px`.

Para superadministración llama a:

```ts
supabase.functions.invoke('admin-users', { body: { action: 'list' } })
```

La Function lista la primera página de hasta 1.000 usuarios de Supabase Auth y la combina con perfiles y `latest_login_accesses`.

### Pestaña Torneos

Columnas:

1. `Torneo`: nombre, y debajo `formato · fecha de creación`.
2. `Organizador`: `displayName` del propietario o `Organizador eliminado`.
3. `Estado`: badge.
4. `Participantes`: todas las filas de `players`, no solo activas.
5. `Rondas`: filas de `rounds`.
6. `Visibilidad`: `Público` o `Privado`.
7. `Acciones`: superadministración recibe `Gestionar` y `Eliminar`; `admin` recibe `—`.

Búsqueda:

- Placeholder `Buscar torneo`.
- Busca nombre, formato y nombre de organizador de forma local.
- Sin paginación ni filtros por estado, fecha, formato o visibilidad.
- Tabla de ancho mínimo `780px`, con scroll interno.

`Gestionar` abre `/tournaments/:id`; `super_admin` puede gestionar cualquier torneo.

### Pestaña Jugadores activos

Se monta aun oculta y carga todos los torneos completos:

```ts
tournaments
  .select('*, players(*), rounds(*, pods(*, pod_players(*), pod_results(*)))')
  .order('created_at')
```

Los torneos se ordenan ascendente por `created_at`; no hay orden explícito para jugadores, mesas ni resultados. La vista aplana solo `player.active === true` como `{ tournament, player }`.

Para superadministración muestra:

- `Superadministrador`.
- `Jugadores activos`.
- `Crea cada jugador dentro de un torneo y administra sus datos desde aquí.`
- Formulario con `Selecciona un torneo`, `Nombre del jugador` y `Crear jugador`.
- Búsqueda `Buscar jugador o torneo`.
- Tabla: `Nombre`, `Torneo`, `Estado`, `Acciones`.
- Cada fila ofrece nombre editable, estado `Activo`, `Guardar` y `Eliminar`.

Para `admin` normal muestra solamente `Consulta de jugadores activos por torneo.`, búsqueda y tarjetas de solo lectura.

Reglas actuales:

- Crear genera un jugador manual activo, UUID de navegador y `tieBreaker = tournament.players.length + 1`.
- No valida en frontend duplicados, cupo máximo, torneo finalizado ni rondas existentes.
- Editar jugador vinculado puede fallar: el trigger prohíbe cambiar su nombre.
- Eliminar falla si tiene referencias en mesas/resultados.
- No existe acción para activar/desactivar.

### Pestaña Datos completos

Muestra:

- `Datos completos`.
- `Consulta de solo lectura de cada torneo, con reglas, jugadores, rondas, mesas y resultados. No incluye credenciales ni datos de autenticación.`
- Búsqueda `Buscar detalle de torneo`.

Cada torneo es un `<details>` con resumen `{{players}} jugadores · {{rounds}} rondas`; al abrirlo usa `JSON.stringify(tournament, null, 2)`.

Incluye los campos transformados de `Tournament`: torneo, jugadores, rondas, mesas, resultados, `tracksKills`, `tracksFirstBlood` y la copia del mazo elegida. No incluye:

- `scoring_rules`.
- `pods.result_type`.
- `pod_results.position` e `is_dead`.
- `players.normalized_name` ni `deck_id`.
- Invitaciones, correos, IPs, accesos, consentimientos o credenciales.

Estados: `Cargando detalle…`; error `No se pudo cargar el detalle de los torneos.`; no hay texto específico para lista vacía.

### Acciones

| Acción | Quién | Llamada | Validación / resultado |
|---|---|---|---|
| Actualizar resumen | `admin`, `super_admin` | `loadAdminOverview()` | Deshabilitado durante carga; no refresca todas las fuentes |
| Editar cuenta | `super_admin`, excepto propia | Function `admin-users`, `update` | Nombre, apodo, correo, contraseña opcional, avatar y rol `player`/`organizer`/`admin` |
| Historial de accesos | `super_admin` desde el modal | Function `history` | Se carga al abrir; sin límite ni paginación |
| Eliminar cuenta ajena | `super_admin`, excepto propia | Function `delete` | Confirmación nativa; elimina usuario Auth y cascadas |
| Gestionar torneo | `super_admin` | Navegación | Abre el gestor normal del torneo |
| Eliminar torneo | `super_admin` | RPC `delete_tournament` | Confirmación; elimina jugadores, rondas, mesas y resultados; toast `Listo — Torneo eliminado.` |
| Crear jugador manual | `super_admin` | `players.insert` | Campos HTML requeridos; sin toast de éxito |
| Renombrar jugador | `super_admin` | `players.update` | Campo requerido; sin confirmación |
| Eliminar jugador | `super_admin` | `players.delete` | Confirmación `¿Eliminar a {{name}}?` |

Acciones existentes sin UI administrativa actual: `create`, `delete-self` y `log-login` de la Function. `createManagedUser()` está implementada pero no se invoca desde una pantalla.

### Modal Editar perfil

- Título `Editar perfil: {{name}}`.
- Descripción `Deja la contraseña vacía para conservarla.`
- Avatar: `Cambiar foto`, `Quitar foto`; JPG/PNG/WebP hasta 2 MB.
- Campos: `Nombre`, `Apodo`, `Correo`, `Nueva contraseña`, `Rol`.
- Roles elegibles: `Jugador`, `Organizador`, `Administrador`.
- Historial: `Historial de inicios de sesión`, `Visible solo para superadministradores.`, `Cargando historial…`, `No hay inicios de sesión registrados.`
- Botones `Cancelar`, `Guardar cambios`, `Guardando…`.

Valida nombre requerido, apodo requerido de 2–24 caracteres normalizados, correo válido y contraseña opcional de mínimo 8 caracteres. Mueve el foco al primer campo inválido. No hay confirmación al guardar.

### Estados de carga, vacío y error

| Área | Carga | Vacío | Error |
|---|---|---|---|
| Guarda | `Verificando permisos de administración…` | — | Redirección según sesión/rol |
| Resumen | `Cargando información de Supabase…` | Métricas `—` | `No se pudo cargar la información administrativa.` o error crudo |
| Cuentas | No tiene spinner propio | `No hay perfiles registrados.` | `No se pudieron cargar los perfiles editables.` |
| Torneos | No tiene spinner propio | `No hay torneos registrados.` | Error global |
| Jugadores | No tiene spinner propio | `No hay jugadores activos que coincidan.` | `No se pudieron cargar los jugadores.` |
| Datos completos | `Cargando detalle…` | No existe texto | `No se pudo cargar el detalle de los torneos.` |
| Historial | `Cargando historial…` | `No hay inicios de sesión registrados.` | `No se pudo cargar el historial de accesos.` |

### Responsive y sidebar

- `Layout wide`: máximo de `88rem`.
- Desktop desde `1024px`: sidebar sticky de `15.5rem`, topbar sticky y navegación administrativa.
- Móvil: sidebar oculto, topbar y barra inferior fija.
- Métricas: una columna por defecto, dos desde `sm`, cuatro desde `lg`.
- Tabs con scroll horizontal.
- Tablas con scroll horizontal: Cuentas `1080px`, Torneos `780px`, Jugadores `680px`.
- Crear jugador pasa de tres columnas desde `md` a una debajo.
- Respeta `prefers-reduced-motion`.
- El control de colapsar sidebar cambia estado, icono y atributos ARIA, pero no existe CSS para `.is-sidebar-collapsed`: no hay colapso visual ni persistencia.

## 3. Modelo de datos disponible

| Tabla | Campos | Relaciones | Administración actual |
|---|---|---|---|
| `profiles` | `id uuid`, `display_name text`, `nickname text`, `created_at timestamptz`, `role app_role`, `auth_provider text`, `terms_accepted_at timestamptz`, `terms_version text`, `privacy_accepted_at timestamptz`, `privacy_version text`, `legal_consent_required boolean`, `role_locked boolean`, `avatar_url text` | `auth.users`, jugadores, mazos, accesos, torneos | Parcial |
| `login_accesses` | `id bigint identity`, `account_id uuid`, `accessed_at timestamptz`, `ip_address inet`, `country text`, `city text`, `browser text`, `operating_system text`, `device_type text` | Perfil | Parcial, por Function |
| `tournaments` | `id`, `owner_id`, `name`, `format`, `planned_rounds`, `status`, `is_public`, `public_slug`, `created_at`, `max_players`, `max_tables`, `information`, `tracks_kills`, `tracks_first_blood` | Perfil, jugadores, rondas, reglas, invitación | Parcial/completo transformado |
| `players` | `id`, `tournament_id`, `name`, `normalized_name generado`, `is_active`, `tie_breaker`, `profile_id nullable`, `avatar_url`, `deck_id nullable`, `deck_name`, `deck_url`, `deck_commander`, `deck_commander_image`, `deck_colors` | Torneo, perfil, mazo, mesas/resultados | Parcial/casi completo |
| `rounds` | `id`, `tournament_id`, `number`, `status`, `seed`, `started_at`, `ended_at` | Torneo, mesas | Inspector |
| `pods` | `id`, `round_id`, `number`, `result_type nullable`, `notes nullable`, `finished_at nullable` | Ronda, asientos, resultados | Inspector parcial |
| `pod_players` | `pod_id`, `player_id` | Mesa, jugador | Inspector como `playerIds` |
| `pod_results` | `pod_id`, `player_id`, `position nullable`, `kills`, `is_dead`, `points`, `outcome nullable`, `first_blood` | Mesa, jugador | Inspector parcial |
| `scoring_rules` | `tournament_id`, `first_place`, `second_place`, `third_place`, `fourth_place`, `combo_winner`, `combo_other`, `tie_points` | Torneo | No se muestra |
| `tournament_join_links` | `tournament_id`, `token`, `created_at`, `revoked_at nullable`, `code` | Torneo | No se muestra |
| `decks` | `id`, `profile_id`, `name`, `url`, `commander_name nullable`, `commander_image nullable`, `color_identity`, `created_at` | Perfil, jugadores | No directamente |

Recursos adicionales:

- Vista `latest_login_accesses`: último acceso por cuenta.
- Vista `published_tournament_snapshot`: no usada por Administración.
- Bucket `profile-avatars`.
- `auth.users` es interno de Supabase; el repositorio consume `id`, `email`, `created_at`, metadata y proveedor.
- Vercel Analytics solo registra visitas/transiciones agregadas; no hay eventos de negocio.

### Fechas, sesiones, estado y auditoría

| Dato | Existe | Ubicación / comportamiento |
|---|---|---|
| Registro de cuenta | Sí | `profiles.created_at`; fallback `auth.users.created_at` |
| Último acceso | Sí | Vista `latest_login_accesses` |
| Historial de accesos | Sí | Una fila por inicio exitoso en `login_accesses`; sin retención implementada |
| Intentos fallidos | No | Solo se guarda `SIGNED_IN` |
| Creación de torneo | Sí | `tournaments.created_at` |
| Creación de jugador/inscripción | No | `players` no tiene `created_at` |
| Creación de ronda/mesa/resultado | No | Solo hay `started_at`, `ended_at`, `finished_at` |
| Estado de cuenta | No | No existe activo/suspendido/bloqueado en `profiles` |
| Estado de torneo | Sí | `borrador`, `activo`, `finalizado`; no existe cancelado |
| Auditoría de rol/acciones admin | No | No hay tabla, trigger ni eventos |
| Ubicación | Parcial | Ciudad/país por inicio en `login_accesses`; no es un atributo permanente |
| IP | Sí | Se guarda completa; la UI recibe una versión enmascarada |

Un login se registra cuando `AuthContext` recibe `SIGNED_IN`, invoca `admin-users` con `log-login`, obtiene IP desde headers, intenta geolocalizar con `ipwho.is`, deriva datos de `user-agent` e inserta la fila. Si falla, el acceso sigue funcionando sin aviso.

## 4. Métricas y vistas posibles

### Sin cambiar el esquema

| Vista | Campos / consulta | ¿Endpoint nuevo? |
|---|---|---|
| Registros por día/semana/mes | `profiles.created_at`, `date_trunc` | No estrictamente; recomendable para agregados grandes |
| Distribución de roles y número de superadmins | `profiles.role` | No |
| Consentimientos pendientes | `profiles.legal_consent_required` | No |
| Cuentas por proveedor / con avatar | `auth_provider`, `avatar_url` | No |
| Torneos por período, formato, estado, visibilidad | `tournaments.created_at`, `format`, `status`, `is_public` | No |
| Organizadores con más torneos | `tournaments.owner_id`, perfil, `COUNT(*)` | No |
| Torneos sin jugadores/rondas | joins y conteos | No |
| Participantes, activos, retirados | `players.tournament_id`, `is_active` | No |
| Manuales vs. vinculados | `players.profile_id IS NULL` | No |
| Jugadores en varios torneos | `players.profile_id`, `COUNT(DISTINCT tournament_id)` | No |
| Mazos/comandantes/colores usados | Campos `deck_*` de jugador | No |
| Rondas por estado y duración | `rounds.status`, `started_at`, `ended_at` | No |
| Duración de mesas | `pods.finished_at - rounds.started_at` | No |
| Mesas pendientes | Comparar asientos y resultados | No |
| Puntos, kills, primeras sangres, resultados | `pod_results` | No |
| Invitaciones activas/revocadas | `tournament_join_links` | Sí; no tiene lectura administrativa RLS |
| Mazos creados por período | `decks.created_at` | Sí; la tabla solo permite al dueño |
| Últimos accesos por cuenta | Acción existente `list` | No |
| Historial individual de accesos | Acción existente `history` | No |
| Accesos por país/navegador/período | `login_accesses` agrupado | Sí; RLS no permite al cliente leer la tabla |
| Cuentas inactivas X días | Último acceso unido a perfiles | Sí, ampliando Function/RPC |

### Requiere cambios de backend o esquema

- `players.created_at` para altas e inscripciones por período.
- `created_at` en rondas, mesas y resultados.
- Tabla de auditoría con actor, objetivo, acción, fecha y payload seguro.
- Registro de intentos fallidos, recuperación, rate limiting y bloqueo.
- Estado de cuenta y reglas que lo apliquen.
- Estado `cancelado` para torneos, motivo y fechas.
- Eventos de uso de producto.
- Registro de aceptación y conversión de invitaciones.
- Registro explícito de cierres automáticos frente a manuales.

## 5. Ajustes solo de frontend

| Ajuste | Existe | Persistencia posible | Restricción |
|---|---|---|---|
| Mostrar/ocultar columnas | No | `localStorage` por usuario | No evita cargar datos |
| Densidad de filas | No | `localStorage` | Requiere clases CSS alternativas |
| Tamaño de página | No | `localStorage` | Solo paginación local hoy |
| Filtros/orden guardados | No | `localStorage` | No sincroniza dispositivos |
| Vista tabla/tarjetas | No | `localStorage` | Requiere UI alternativa |
| Exportar CSV | No | Descarga desde arrays cargados | Respeta lo visible para el rol |
| Atajos | No | Estado React/listeners | No debe interferir con inputs |
| Tema oscuro | No | Clase en `<html>` + `localStorage` | No existe tokenización dark actual |
| Idioma | Sí | `torneos-tcg.language` | Solo `es` y `en` |
| Pestaña actual | Parcial | Caché en memoria | Se pierde al recargar |
| Búsquedas | No | `useState` | Se pierden al desmontar/recargar |
| Sidebar colapsado | Parcial | `useState` | No se persiste ni cambia visualmente |

El proyecto ya usa `localStorage` para idioma y modo demo. Las preferencias nuevas deben incluir el ID de cuenta en la clave, no guardar información sensible y asumir que se pueden borrar desde el navegador.

## 6. Sistema visual actual

### Tokens

| Token | Valor |
|---|---|
| `--background` | `#FCFAEC` |
| `--foreground` | `#111111` |
| `--card` | `#FFFFFF` |
| `--primary` / `--primary-strong` | `#21B876` / `#168050` |
| `--accent` | `#3D5AFB` |
| `--violet` | `#5B1FE0` |
| `--red` | `#C1272D` |
| `--ink-soft` | `#514D45` |
| `--muted-foreground` | `#6B675C` |
| `--border` / `--border-strong` | `#E7E2D2` / `#DED6C5` |
| `--paper` | `#FFFDF7` |
| `--highlight` | `#FFF6CB` |
| `--accent-soft` | `#E9EDFF` |
| `--violet-soft` | `#EEE9FF` |
| `--success-soft` | `#E5F7EC` |

- Fuente: `Fredoka, ui-rounded, system-ui, sans-serif`.
- Radios: `0.65rem 0.3rem`, `1rem 0.4rem`, `1.35rem 0.65rem`, `999px`.
- Sombras: `3px 4px`, `5px 6px`, `8px 9px`, con color negro translúcido.

### Implementación visual

- Fondo crema con `public/edh-bg-pattern.svg` y capa crema translúcida; fijo en desktop.
- `.app-panel`: borde de 1.5px, fondo papel, radio irregular y sombra corta.
- Las tabs son `Button`; activa verde, inactiva papel; nav con scroll horizontal.
- Botones usan radio de pastilla, borde de 1.5px y elevación de 2px al hover.
- `global.css` convierte las clases administrativas `slate-*`, `amber-*`, `emerald-*` y `red-*` a la paleta clara mediante reglas globales.
- Tablas administrativas repiten estructura de buscador, tabla y vacío entre componentes.

### Coherencia con otras secciones

- Torneos usa `Layout wide`, `Metric`, `Badge`, botones, paneles, tablas y navegación lateral.
- Jugadores de torneo usan modales, confirmaciones y toasts.
- Perfil usa `app-panel`, `app-field`, avatar circular, modal accesible y zona destructiva; el modal administrativo reutiliza este lenguaje.
- Dashboard usa tarjetas de torneo, métricas y estados vacíos compartidos.
- Accesibilidad: modales con foco atrapado/Escape/retorno de foco; inputs con `aria-invalid`; iconos decorativos con `aria-hidden`.

## 7. Restricciones y riesgos

### No debe romperse

1. Acceso a `/admin` solo para `admin` y `super_admin`.
2. Mutaciones visibles solo para `super_admin`.
3. No editar/eliminar cuenta propia desde consola.
4. No seleccionar `super_admin` como rol en UI.
5. Historial de accesos solo para superadministración.
6. Ocultar correo/accesos/origen a `admin` normal.
7. Borrado de torneo con dependencias.
8. Gestión global de torneos por superadministración.
9. Gestión de jugadores manuales.
10. Inspector de JSON sin credenciales.
11. Búsquedas locales y caché temporal.
12. Avatar con inicial de respaldo.
13. Formato localizado, responsive y `prefers-reduced-motion`.

### Riesgos detectados

1. El sidebar no se colapsa visualmente: falta CSS para su clase de estado.
2. La consola descarga todos los torneos con jugadores, rondas, mesas y resultados aunque no se abra el inspector; escalará mal.
3. No hay paginación; Auth lista solo hasta 1.000 cuentas en la primera página.
4. `Actualizar` no refresca todo lo mostrado.
5. Datos completos promete reglas, pero no consulta `scoring_rules`.
6. `admin` normal puede leer todos los datos operativos por RLS.
7. La Edge Function permite a un superadministrador modificar, degradar o borrar a otro `super_admin`; solo se protege a sí mismo.
8. El borrado administrativo de cuentas no elimina explícitamente sus archivos de avatar, por lo que puede dejar objetos huérfanos.
9. No hay auditoría de acciones sensibles.
10. No existe suspensión de cuenta ni cancelación de torneo.
11. Errores de Supabase/Function suelen mostrarse sin traducir.
12. El comentario de `AdminDashboard` dice que la Function no devuelve apodo/foto, pero la Function actual sí los devuelve.
13. La base permite apodos de hasta 30 caracteres; frontend y Function limitan a 24.
14. La acción `create` de la Function no tiene UI y crea perfiles con `role_locked = false`; debe revisarse antes de exponerse.
15. CORS está abierto; la seguridad depende del JWT y comprobación de rol.

## 8. Datos de ejemplo

### Cuentas

La tabla une `AdminProfile` y `ManagedUser` por `id`.

```json
{
  "profile": {
    "id": "11111111-1111-4111-8111-111111111111",
    "displayName": "Ana Mora",
    "nickname": "AnaM",
    "avatarUrl": "https://example.test/profile-avatars/111/avatar?v=1",
    "role": "organizer",
    "createdAt": "2026-10-30T14:20:00.000Z"
  },
  "managedUser": {
    "id": "11111111-1111-4111-8111-111111111111",
    "email": "ana@example.test",
    "displayName": "Ana Mora",
    "nickname": "AnaM",
    "avatarUrl": "https://example.test/profile-avatars/111/avatar?v=1",
    "role": "organizer",
    "createdAt": "2026-10-30T14:20:00.000Z",
    "lastAccess": {
      "accessedAt": "2026-11-17T18:42:00.000Z",
      "location": "San José, CR",
      "browser": "Chrome",
      "operatingSystem": "Windows",
      "deviceType": "Escritorio",
      "maskedIp": "203.0.xxx.xxx"
    }
  }
}
```

```json
{
  "profile": {
    "id": "22222222-2222-4222-8222-222222222222",
    "displayName": "Bruno León",
    "nickname": "BrunoEDH",
    "role": "player",
    "createdAt": "2026-11-01T09:30:00.000Z"
  },
  "managedUser": {
    "id": "22222222-2222-4222-8222-222222222222",
    "email": "bruno@example.test",
    "displayName": "Bruno León",
    "nickname": "BrunoEDH",
    "avatarUrl": null,
    "role": "player",
    "createdAt": "2026-11-01T09:30:00.000Z",
    "lastAccess": null
  }
}
```

```json
{
  "profile": {
    "id": "33333333-3333-4333-8333-333333333333",
    "displayName": "Carla Rojas",
    "nickname": "CarlaR",
    "role": "admin",
    "createdAt": "2026-11-05T12:00:00.000Z"
  },
  "managedUser": {
    "id": "33333333-3333-4333-8333-333333333333",
    "email": "carla@example.test",
    "displayName": "Carla Rojas",
    "nickname": "CarlaR",
    "avatarUrl": null,
    "role": "admin",
    "createdAt": "2026-11-05T12:00:00.000Z",
    "lastAccess": null
  }
}
```

### Torneos

```json
[
  {
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "ownerId": "11111111-1111-4111-8111-111111111111",
    "name": "Liga Commander Noviembre",
    "format": "Commander",
    "status": "activo",
    "isPublic": true,
    "createdAt": "2026-11-03T18:00:00.000Z",
    "playerCount": 18,
    "roundCount": 2
  },
  {
    "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "ownerId": "33333333-3333-4333-8333-333333333333",
    "name": "Mesa cEDH semanal",
    "format": "cEDH",
    "status": "finalizado",
    "isPublic": false,
    "createdAt": "2026-10-25T16:00:00.000Z",
    "playerCount": 12,
    "roundCount": 3
  },
  {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "ownerId": "11111111-1111-4111-8111-111111111111",
    "name": "Prueba de pods",
    "format": "Commander",
    "status": "borrador",
    "isPublic": false,
    "createdAt": "2026-11-18T10:00:00.000Z",
    "playerCount": 0,
    "roundCount": 0
  }
]
```

### Jugadores activos

La pestaña genera `{ tournament, player }` localmente; `tournament` conserva la forma completa de `Tournament`.

```json
[
  {
    "tournament": {
      "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "ownerId": "11111111-1111-4111-8111-111111111111",
      "name": "Liga Commander Noviembre",
      "format": "Commander",
      "information": "",
      "plannedRounds": 3,
      "status": "activo",
      "isPublic": true,
      "publicSlug": "liga-commander-noviembre",
      "maxPlayers": 32,
      "maxTables": 8,
      "tracksKills": true,
      "tracksFirstBlood": false,
      "players": [],
      "rounds": [],
      "createdAt": "2026-11-03T18:00:00.000Z"
    },
    "player": {
      "id": "d1111111-1111-4111-8111-111111111111",
      "name": "AnaM",
      "active": true,
      "tieBreaker": 1,
      "profileId": "22222222-2222-4222-8222-222222222222",
      "deck": {
        "name": "Atraxa contadores",
        "url": "https://moxfield.com/decks/example",
        "commander": "Atraxa, Praetors' Voice",
        "commanderImage": "https://cards.scryfall.io/example.jpg",
        "colors": "WUBG"
      }
    }
  },
  {
    "tournament": {
      "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "ownerId": "11111111-1111-4111-8111-111111111111",
      "name": "Liga Commander Noviembre",
      "format": "Commander",
      "information": "",
      "plannedRounds": 3,
      "status": "activo",
      "isPublic": true,
      "publicSlug": "liga-commander-noviembre",
      "maxPlayers": 32,
      "maxTables": 8,
      "tracksKills": true,
      "tracksFirstBlood": false,
      "players": [],
      "rounds": [],
      "createdAt": "2026-11-03T18:00:00.000Z"
    },
    "player": {
      "id": "d2222222-2222-4222-8222-222222222222",
      "name": "Diego",
      "active": true,
      "tieBreaker": 2
    }
  }
]
```

### Datos completos

```json
{
  "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "ownerId": "11111111-1111-4111-8111-111111111111",
  "name": "Liga Commander Noviembre",
  "format": "Commander",
  "information": "Trae tu mazo y registra resultados al final de cada mesa.",
  "plannedRounds": 3,
  "status": "activo",
  "isPublic": true,
  "publicSlug": "liga-commander-noviembre",
  "maxPlayers": 32,
  "maxTables": 8,
  "tracksKills": true,
  "tracksFirstBlood": false,
  "players": [
    {
      "id": "d1111111-1111-4111-8111-111111111111",
      "name": "AnaM",
      "active": true,
      "tieBreaker": 1,
      "profileId": "22222222-2222-4222-8222-222222222222"
    }
  ],
  "rounds": [
    {
      "id": "e1111111-1111-4111-8111-111111111111",
      "number": 1,
      "status": "completada",
      "seed": 172000001,
      "startedAt": "2026-11-03T18:30:00.000Z",
      "endedAt": "2026-11-03T20:00:00.000Z",
      "pods": [
        {
          "id": "f1111111-1111-4111-8111-111111111111",
          "number": 1,
          "playerIds": ["d1111111-1111-4111-8111-111111111111"],
          "finishedAt": "2026-11-03T19:45:00.000Z",
          "results": [
            {
              "playerId": "d1111111-1111-4111-8111-111111111111",
              "points": 3,
              "kills": 2,
              "firstBlood": false,
              "outcome": "win"
            }
          ]
        }
      ]
    }
  ],
  "createdAt": "2026-11-03T18:00:00.000Z"
}
```

## Dudas o cosas que no pude determinar

- No encontré credenciales ni conexión a producción para comprobar datos, conteos o migraciones remotas.
- No encontré un modelo propio completo de `auth.users`; esa tabla pertenece a Supabase Auth y el repositorio solo consume campos concretos.
- No encontré pruebas automatizadas específicas para Administración ni para `admin-users`.
- No encontré política de retención para `login_accesses`.
- No encontré manera de distinguir un cierre automático de uno manual.
- No encontré persistencia de preferencias de Administración.
- No encontré datos de suspensión, cancelación, auditoría o intentos fallidos de autenticación.
