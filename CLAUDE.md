# Claude Code

Las reglas del proyecto viven en `AGENTS.md`; este archivo solo las importa y agrega notas propias de Claude Code.

@AGENTS.md
@src/AGENTS.md
@supabase/AGENTS.md

## Notas para Claude Code

- Estructura: rutas en `src/app/AppRouter.tsx`, pantallas en `src/features/<área>/`, compartidos en `src/components/`, estilos en `src/styles/`, textos en `src/i18n/es.ts` y `en.ts`. Detalle en `docs/architecture.md`.
- Pendientes técnicos y prompt para retomar: `docs/siguientes-pasos.md`. Auditoría visual: `docs/showcase-audit.md`.
- Validación habitual: `npm run build` y `npm run lint`. Corre `npm test` solo si cambia lógica de `src/domain/` o si se pide.
- Para revisar componentes visualmente, usá `/muestrario` (solo en localhost).
- El entorno es Windows con Git Bash: para pasar rutas tipo `/muestrario` como argumentos, usa `MSYS_NO_PATHCONV=1`.
- No hagas commit ni push salvo que se pida.
