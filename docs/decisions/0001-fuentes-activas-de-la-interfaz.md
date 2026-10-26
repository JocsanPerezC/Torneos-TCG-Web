# ADR 0001: fuentes activas de la interfaz

- Estado: aceptada
- Fecha: 2026-10-25

## Contexto

El repositorio conserva módulos en `src/pages/app/` y `src/routes/`, mientras que `src/App.tsx` carga `src/pages/AppRouter.tsx`. Editar una pantalla sin comprobar el árbol de imports puede aplicar un cambio a una implementación que no llega al usuario.

## Decisión

`src/pages/AppRouter.tsx` se considera la fuente activa de rutas y de la interfaz autenticada mientras `src/App.tsx` la cargue. Los módulos de `src/pages/app/` y `src/routes/` se tratan como implementaciones paralelas hasta que una migración explícita los conecte al punto de entrada.

## Consecuencias

- Antes de cambios de interfaz se verifica la ruta y el import activo.
- Los cambios de texto visible en la interfaz activa se registran en `src/i18n.ts` para español e inglés.
- Una futura migración hacia `src/pages/app/` o `src/routes/` debe actualizar esta decisión y `docs/architecture.md`.
