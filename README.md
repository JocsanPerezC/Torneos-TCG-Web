# Mesa Mayor — gestor de torneos TCG

Aplicación React/TypeScript para organizar torneos multijugador de Commander u otros TCG: participantes sin cuenta, mesas de 3–4, resultados normales o por combo, clasificación con desempates y vista pública de solo lectura.

## Ejecutar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Sin configurar Supabase, la aplicación funciona en **modo demostración**: usa `localStorage`, incluye un torneo de ejemplo y conserva los cambios al recargar. Esto permite probar toda la lógica de torneo sin secretos.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Copia `.env.example` como `.env.local` y completa únicamente estas variables públicas:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
   ```

3. Instala la CLI de Supabase e inicia sesión; después vincula el proyecto y aplica la migración:

   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```

   Alternativamente, ejecuta `supabase/migrations/20260913000000_tournament_manager.sql` desde el SQL Editor.
4. En Authentication configura las URLs de redirección de tu entorno para recuperación de contraseña. Nunca uses ni expongas `service_role` en el frontend.

La migración crea perfiles, torneos, reglas, jugadores, rondas, mesas, asignaciones y resultados, con restricciones de integridad, trigger para no repetir a una persona en la misma ronda, índices y RLS por propietario. La vista `published_tournament_snapshot` es el punto de lectura previsto para anónimos; para publicar datos de mesas/resultados completos en producción, añade vistas específicas limitadas a torneos `is_public`.

## Arquitectura

- `src/domain/`: tipos, distribución de mesas, emparejamiento, puntuación y clasificación puros.
- `src/state/TournamentContext.tsx`: persistencia local de demostración y operaciones de torneo.
- `src/routes/AppRouter.tsx`: rutas, formularios accesibles y pantallas en español.
- `src/lib/supabase.ts`: cliente preparado con URL y clave anónima públicas.
- `supabase/migrations/`: modelo PostgreSQL y políticas RLS.

El emparejamiento usa múltiples mezclas deterministas por semilla. Su costo penaliza los pares que ya compartieron mesa (peso 100) antes de ponderar la diferencia de puntos, para priorizar no repetir enfrentamientos. En la clasificación: puntos, victorias, fuerza de oponentes (suma de puntos de quienes enfrentó), kills y una semilla estable resuelven los empates.

## Verificación y despliegue

```bash
npm run lint
npm test
npm run build
```

Para desplegar, configura las dos variables `VITE_` como variables de build en tu proveedor y publica el directorio generado `dist`. Configura fallback de SPA para que las rutas `/tournaments/*` y `/t/*` resuelvan `index.html`.
