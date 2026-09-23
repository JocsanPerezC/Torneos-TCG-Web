# Prompt de implementación: torneo de prueba sin iniciar sesión

## Objetivo

Implementa una experiencia mínima de **torneo de prueba** para visitantes. Al pulsar el botón del CTA final que hoy dice **“Crear mi primer torneo”**, la persona debe poder configurar un torneo ficticio sin crear una cuenta, sin iniciar sesión y sin que se guarde ningún dato real.

La palabra “ventanas” de este requerimiento significa dos vistas de una misma pantalla SPA: el formulario y su resumen de confirmación. No abras una ventana del navegador, no uses `window.open` y no uses `target="_blank"`.

## Resultado esperado

1. El CTA final de la página inicial abre la ruta pública `/demo` en la misma pestaña.
2. `/demo` muestra un formulario simple para crear un torneo de prueba con:
   - Nombre (obligatorio).
   - Formato/juego (por defecto: `Commander`).
   - Rondas planificadas (por defecto: `3`).
   - Máximo de jugadores (por defecto: `32`).
   - Máximo de mesas (por defecto: `8`).
3. Al enviar valores válidos, la vista cambia a una confirmación visual con los datos elegidos y el aviso claro: **“Modo de prueba: este torneo no se guarda, no se publica y se pierde al recargar.”**
4. La confirmación debe permitir volver a empezar la prueba y volver a la página inicial. Puede incluir un enlace secundario a `/register` para quien quiera guardar torneos reales, pero nunca debe redirigir allí automáticamente.
5. Al recargar `/demo`, el estado vuelve al formulario inicial. No usar `localStorage` ni `sessionStorage` en esta primera versión.

Este alcance es deliberadamente pequeño: no se deben implementar jugadores, rondas, resultados, clasificación ni enlace público dentro del demo todavía. El objetivo actual es probar la creación y explicar que la persistencia requiere una cuenta.

## Contexto técnico comprobado

- La aplicación activa carga `src/pages/AppRouter.tsx` desde `src/App.tsx`. Ese es el único router que debe modificarse.
- El botón de la captura está en `src/components/landing/FinalCta.tsx`; actualmente enlaza a `/register`.
- `src/pages/LandingPage.tsx` compone el CTA final y usa el estilo de landing actual.
- `src/routes/*` y `src/pages/app/*` existen, pero no están conectados al árbol activo. No los modifiques para esta función.
- Los componentes reutilizables adecuados son `src/components/ui/button.tsx`, `src/components/landing/LandingHeader.tsx` y `src/components/landing/LandingFooter.tsx`.
- Las traducciones viven en `src/i18n.ts` y deben existir en español e inglés.
- `FormLimits` ya se monta globalmente y aplica límites a campos llamados `name`, `format`, `rounds`, `maxPlayers` y `maxTables`; aun así, el `submit` debe validar los valores de nuevo.

## Restricción crítica de seguridad e integración

No reutilices `TournamentContext`, `useTournaments`, `createTournament`, `tournamentRepository`, `supabase`, ni las rutas reales `/dashboard`, `/tournaments/*` o `/t/:slug`.

Cuando Supabase está configurado, `TournamentContext` intenta persistir las mutaciones y las políticas RLS solo permiten crear torneos cuyo `owner_id` coincide con `auth.uid()`. Un visitante anónimo fallaría y podría generar errores o datos inconsistentes. El demo debe usar únicamente estado local de React dentro de su propia página.

No crear ni editar migraciones, políticas RLS, Edge Functions, variables de entorno, configuración de Vercel o dependencias.

## Archivos a crear o modificar

1. Modificar `src/components/landing/FinalCta.tsx`.
   - Conserva el estilo actual del botón.
   - Cambia exclusivamente su destino de `/register` a `/demo`.
   - Mantén intactos los CTA del hero, cabecera, autenticación y panel real.

2. Crear `src/pages/DemoTournamentPage.tsx`.
   - Debe ser una página autónoma y pública.
   - Reutiliza `LandingHeader`, `LandingFooter`, `Button`, `Link` y `useTranslation` para mantener la identidad visual existente.
   - Usa una estructura parecida a la landing: contenedor `landing-theme min-h-screen pt-[72px]`, cabecera, `main` centrado y pie.
   - Mantén el estado local en memoria, por ejemplo:

     ```ts
     type DemoTournament = {
       name: string
       format: string
       plannedRounds: number
       maxPlayers: number
       maxTables: number
     }
     ```

     Usa `useState<DemoTournament | null>(null)`. No hace falta usar el tipo completo `Tournament`, generar IDs ni importar lógica de Supabase.
   - Estado `null`: formulario de creación.
   - Estado con datos: tarjeta de confirmación/resumen con un distintivo visible de “Modo de prueba”, los cinco valores elegidos y acciones **“Reiniciar prueba”** y **“Volver al inicio”**.
   - El botón de reinicio debe limpiar el estado local y volver al formulario; el de volver debe enlazar a `/`.

3. Modificar `src/pages/AppRouter.tsx`.
   - Importa `DemoTournamentPage`.
   - Añade `<Route path="/demo" element={<DemoTournamentPage />} />` antes del comodín `*`.
   - No envolver esta ruta con `ConsentGuard` y no tocar las protecciones de las rutas existentes.

4. Modificar `src/i18n.ts`.
   - Añade claves nuevas bajo `landing.demo` para título, explicación, aviso de no persistencia, estado de éxito, reinicio y regreso.
   - Añade las mismas claves en `resources.es` y `resources.en`.
   - Actualiza `landing.cta.description` en ambos idiomas para no prometer que es obligatorio crear una cuenta antes de pulsar el CTA. Mantén el texto del botón **“Crear mi primer torneo”** / **“Create my first tournament”** si no hay una razón de diseño para cambiarlo.
   - No dejes textos nuevos hardcodeados en JSX.

## Reglas de formulario y accesibilidad

- Usa los mismos `name` de campo: `name`, `format`, `rounds`, `maxPlayers`, `maxTables`.
- En el navegador y en el `submit`, valida:
  - nombre no vacío después de `trim()` y máximo de 80 caracteres;
  - formato máximo de 50 caracteres;
  - rondas: entero entre 1 y 30;
  - máximo de jugadores: entero entre 3 y 50;
  - máximo de mesas: entero entre 1 y 25.
- Muestra un error comprensible y localizado sin borrar lo que la persona escribió.
- El campo nombre debe recibir foco inicial (`autoFocus`), las etiquetas deben estar asociadas a sus controles y los botones secundarios deben tener `type="button"`.
- Usa el componente `Button` existente y las clases/paleta actuales; no introducir otra biblioteca visual.
- Debe funcionar tanto con Supabase configurado como sin él, y tanto en español como en inglés.

## Criterios de aceptación

- Un visitante en `/` pulsa el CTA final y llega a `/demo` sin pasar por inicio de sesión ni registro.
- Puede crear un resumen de prueba con valores válidos.
- Los valores inválidos no avanzan y muestran el error localizado.
- El resumen deja claro que no es un torneo real, no se guarda y desaparece al recargar.
- “Reiniciar prueba” limpia todos los valores de la prueba y “Volver al inicio” navega a `/`.
- No se realizan solicitudes a Supabase ni se modifica el dashboard, torneos reales, autenticación o base de datos.
- La landing, el registro, el inicio de sesión y la creación autenticada de torneos mantienen su comportamiento actual.

## Validación solicitada al finalizar

Sin instalar dependencias ni cambiar configuración, ejecutar cuando Node/npm esté disponible:

```powershell
npm run format:check
npm run lint
npm run build
```

Además, comprobar manualmente `/demo` en español e inglés, con y sin variables de Supabase: apertura desde el CTA, validaciones, creación del resumen, reinicio, regreso al inicio y recarga de página. Informar cualquier fallo preexistente por separado de los cambios de esta función.
