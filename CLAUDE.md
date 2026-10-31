# Claude Code

Las reglas del proyecto viven en `AGENTS.md`; este archivo solo las importa y agrega notas propias de Claude Code.

@AGENTS.md
@src/AGENTS.md
@supabase/AGENTS.md

## Notas para Claude Code

- Estructura: rutas en `src/app/AppRouter.tsx`, pantallas en `src/features/<área>/`, compartidos en `src/components/`, estilos en `src/styles/`, textos en `src/i18n/es.ts` y `en.ts`. Detalle en `docs/architecture.md`.
- Auditoría visual (lo resuelto y lo pendiente): `docs/auditoria-visual.md`. Backlog de producto: `docs/pendientes.md`.
- Validación habitual: `npm run build` y `npm run lint`. Corre `npm test` solo si cambia lógica de `src/domain/` o si se pide.
- Para revisar componentes visualmente, usá `/muestrario` (solo en localhost). Las pantallas que exigen sesión (estadísticas, contador) tienen ahí una variante con datos de ejemplo en `src/features/showcase/fixtures.ts`; para capturas, Chrome en modo headless (`C:/Program Files/Google/Chrome/Application/chrome.exe`) con el servidor de Vite en un puerto libre.
- El entorno es Windows con Git Bash: para pasar rutas tipo `/muestrario` como argumentos, usa `MSYS_NO_PATHCONV=1`.
- No hagas commit ni push salvo que se pida.
