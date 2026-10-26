# Arquitectura del proyecto

## Propósito

Torneos TCG administra torneos multijugador de Commander y otros TCG. El organizador gestiona participantes, rondas, resultados y clasificación; la vista pública es de solo lectura.

## Punto de entrada y rutas activas

- `src/main.tsx` carga estilos, traducciones y `App`.
- `src/App.tsx` monta `AuthProvider`, `TournamentProvider` y carga de forma diferida `src/pages/AppRouter.tsx`.
- `src/pages/AppRouter.tsx` contiene las rutas activas del sitio, incluida la UI autenticada de torneos.

`src/pages/app/` y `src/routes/` contienen una implementación paralela que no es importada por `src/App.tsx`. Antes de editarlos, verifica que una ruta activa los use; para cambios de producto actuales, modifica primero la implementación en `AppRouter.tsx`.

## Capas

| Capa            | Responsabilidad                                                                 | Ubicación                       |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------- |
| Dominio         | Tipos, distribución de mesas, emparejamientos, puntuación y estadísticas puros. | `src/domain/`                   |
| Estado          | Sesión, torneos, modo demo y reglas de transición de rondas.                    | `src/state/`                    |
| Datos           | Mapeo y operaciones de Supabase.                                                | `src/data/`                     |
| Infraestructura | Cliente Supabase y utilidades compartidas.                                      | `src/lib/`                      |
| Presentación    | Rutas, páginas y componentes reutilizables.                                     | `src/pages/`, `src/components/` |
| Idiomas         | Recursos español/inglés.                                                        | `src/i18n.ts`                   |
| Persistencia    | Esquema, RLS, RPCs, migraciones y Edge Functions.                               | `supabase/`                     |

## Flujos importantes

### Torneos y rondas

`AppRouter.tsx` usa `TournamentContext`. El contexto aplica las reglas del torneo y delega el emparejamiento a `src/domain/pairing.ts`; la clasificación se calcula con `src/domain/scoring.ts`. En modo remoto, los cambios se persisten mediante `src/data/tournamentRepository.ts`; sin Supabase, el estado se conserva en `localStorage` como modo demo.

Las mesas contienen de 3 a 5 jugadores. El emparejamiento prioriza evitar rivales repetidos y luego aproxima las puntuaciones. Una ronda solo se termina cuando todas sus mesas tienen resultados válidos.

### Autenticación y permisos

`AuthContext` expone la sesión y los roles. Los roles de aplicación son `organizer`, `admin` y `super_admin`. Las restricciones reales deben estar protegidas por RLS y funciones del lado de Supabase, no solo por la interfaz.

### Internacionalización

La interfaz activa usa `src/i18n.ts`. Cualquier texto nuevo visible debe existir en español e inglés. No agregues cadenas visibles hardcodeadas cuando ya se use una clave de traducción en esa pantalla.

## Fuentes de verdad de trabajo

- `AGENTS.md`: reglas de trabajo y contexto duradero.
- `PENDIENTES.md`: backlog de producto.
- `docs/decisions/`: decisiones técnicas con impacto futuro.
- `README.md`: uso local, configuración y referencia de producto.

## Validación

- Estilo estático: `npm run lint`.
- Lógica de dominio: `npm test`.
- Integración del cliente: `npm run build`.

Ejecuta solo la validación proporcional al cambio; compila cuando se modifiquen rutas, estado, dependencias de interfaz o integración.
