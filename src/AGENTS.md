# Contexto del frontend

- La aplicación arranca en `src/main.tsx` y `src/app/App.tsx`; `src/app/AppRouter.tsx` solo declara las rutas.
- Importa siempre con el alias `@/` (por ejemplo, `@/components/ui/button`), no con rutas relativas.
- Cada pantalla vive en `src/features/<área>/`, con sus piezas propias en `components/`. Lo que comparten varias áreas va en `src/components/` (`ui/`, `layout/`, `feedback/`).
- Los estilos están en `src/styles/`, importados en orden desde `src/index.css`; agrega reglas en el archivo de su área y respeta ese orden.
- El estado de autenticación y torneos vive en `src/state/`. La lógica pura de emparejamientos, puntuación y clasificación vive en `src/domain/`; no la dupliques en componentes.
- La persistencia pasa por `src/data/` y `src/lib/supabase.ts`. El modo demo usa `localStorage` cuando Supabase no está configurado.
- Todo texto visible nuevo debe tener claves equivalentes en español e inglés en `src/i18n/es.ts` y `src/i18n/en.ts`, y consumirlas desde la interfaz activa.
- Para cambios de UI, reutiliza las clases y componentes existentes antes de añadir estilos nuevos. Valida con compilación; agrega pruebas cuando cambie lógica observable.
- Para cambios visuales, consulta `docs/design-system.md` y conserva los tokens, responsive, accesibilidad e i18n.
