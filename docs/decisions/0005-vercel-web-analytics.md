# ADR 0005: Vercel Web Analytics

- Estado: aceptada
- Fecha: 2026-10-28

## Decisión

La aplicación monta una sola instancia de `Analytics` de `@vercel/analytics/react` en `src/App.tsx`. No se envían eventos personalizados ni datos de cuenta: Vercel Web Analytics registra automáticamente vistas de página y transiciones del cliente durante los despliegues en Vercel.

## Consecuencias

- Para recibir datos, Web Analytics debe estar habilitado en el proyecto de Vercel y debe hacerse un nuevo despliegue.
- La política de privacidad identifica a Vercel como proveedor de alojamiento y analítica, y describe el uso de estadísticas agregadas sin cookies de terceros.
- Cualquier evento personalizado futuro debe revisar y filtrar previamente URLs, parámetros y atributos que puedan contener datos personales.
