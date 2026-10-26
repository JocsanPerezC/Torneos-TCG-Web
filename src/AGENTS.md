# Contexto del frontend

- La aplicación arranca en `src/main.tsx` y `src/App.tsx`; la UI autenticada y las rutas activas viven en `src/pages/AppRouter.tsx`.
- Antes de tocar una pantalla, confirma que el componente esté importado por la ruta activa. `src/pages/app/` y `src/routes/` son módulos paralelos no cargados por `src/App.tsx` actualmente.
- El estado de autenticación y torneos vive en `src/state/`. La lógica pura de emparejamientos, puntuación y clasificación vive en `src/domain/`; no la dupliques en componentes.
- La persistencia pasa por `src/data/` y `src/lib/supabase.ts`. El modo demo usa `localStorage` cuando Supabase no está configurado.
- Todo texto visible nuevo debe tener claves equivalentes en español e inglés dentro de `src/i18n.ts` y consumirlas desde la interfaz activa.
- Para cambios de UI, reutiliza las clases y componentes existentes antes de añadir estilos nuevos. Valida con compilación; agrega pruebas cuando cambie lógica observable.
