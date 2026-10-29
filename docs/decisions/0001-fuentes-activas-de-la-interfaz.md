# ADR 0001: fuentes activas de la interfaz

- Estado: aceptada (actualizada el 2026-10-29)
- Fecha: 2026-10-25

## Contexto

El repositorio conservaba módulos paralelos en `src/pages/app/` y `src/routes/`, que no se cargaban desde el punto de entrada, y casi toda la interfaz activa vivía en un único `src/pages/AppRouter.tsx`. Editar una pantalla sin comprobar el árbol de imports podía aplicar un cambio a una implementación que no llegaba al usuario.

## Decisión

- Se eliminaron `src/pages/app/` y `src/routes/`; ya no existen implementaciones paralelas.
- `src/app/AppRouter.tsx` es la única fuente de rutas y solo declara rutas y guardas.
- Cada pantalla vive en `src/features/<área>/`; los componentes compartidos entre áreas viven en `src/components/`.

## Consecuencias

- Un cambio de pantalla se hace en su carpeta de `src/features/`; si una pieza pasa a usarse en varias áreas, se mueve a `src/components/`.
- Los textos visibles se registran en `src/i18n/es.ts` y `src/i18n/en.ts`, con las mismas claves.
- Si se agregan rutas o áreas nuevas, se actualiza `docs/architecture.md`.
