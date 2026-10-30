# ADR 0001: interfaz

- Estado: aceptada
- Fechas: 2026-10-25 (fuentes activas), 2026-10-28 (analítica), actualizada el 2026-10-29
- Reúne los antiguos ADR 0001 (fuentes activas de la interfaz) y 0005 (Vercel Web Analytics).

## Fuentes activas de la interfaz

### Contexto

El repositorio conservaba módulos paralelos en `src/pages/app/` y `src/routes/`, que no se cargaban desde el punto de entrada, y casi toda la interfaz activa vivía en un único `src/pages/AppRouter.tsx`. Editar una pantalla sin comprobar el árbol de imports podía aplicar un cambio a una implementación que no llegaba al usuario.

### Decisión

- Se eliminaron `src/pages/app/` y `src/routes/`; ya no existen implementaciones paralelas.
- `src/app/AppRouter.tsx` es la única fuente de rutas y solo declara rutas y guardas.
- Cada pantalla vive en `src/features/<área>/`; los componentes compartidos entre áreas viven en `src/components/`.
- Los imports dentro de `src/` usan el alias `@/`.

### Consecuencias

- Un cambio de pantalla se hace en su carpeta de `src/features/`; si una pieza pasa a usarse en varias áreas, se mueve a `src/components/`.
- Los textos visibles se registran en `src/i18n/es.ts` y `src/i18n/en.ts`, con las mismas claves.
- Si se agregan rutas o áreas nuevas, se actualiza `docs/architecture.md`.

## Analítica con Vercel Web Analytics

### Decisión

La aplicación monta una sola instancia de `Analytics` de `@vercel/analytics/react` en `src/app/App.tsx`. No se envían eventos personalizados ni datos de cuenta: Vercel Web Analytics registra automáticamente vistas de página y transiciones del cliente durante los despliegues en Vercel.

### Consecuencias

- Para recibir datos, Web Analytics debe estar habilitado en el proyecto de Vercel y debe hacerse un nuevo despliegue.
- La política de privacidad identifica a Vercel como proveedor de alojamiento y analítica, y describe el uso de estadísticas agregadas sin cookies de terceros.
- Cualquier evento personalizado futuro debe revisar y filtrar previamente URLs, parámetros y atributos que puedan contener datos personales.
