# Siguientes pasos

Pendientes técnicos tras reacomodar el repo (29-10-2026).

## Antes de seguir

- [ ] Abrir la app y revisar las pantallas principales: landing, login, dashboard, torneo (jugadores, rondas, clasificación), vista pública y admin.
- [ ] Hacer commit del reacomodo.
- [ ] Descartar el stash viejo de `Local` en GitHub Desktop: cambios sobre el landing anterior, ya no sirven.
- [ ] Decidir qué pasa con la rama `demo` y su stash de septiembre; va a chocar con la estructura nueva.
- [ ] Actualizar `PROMPTS.md`: todavía menciona `src/App.tsx` y `src/i18n.ts`.

## Fase 6: normalización visual

La lista completa está en `docs/showcase-audit.md`. Propuesta aprobada el 29-10-2026; los valores y las decisiones están abajo. Marcá cada bloque al terminarlo.

- [x] 1. Declarar tokens en `src/styles/base.css` (`:root` y `@theme`) y documentarlos en `docs/design-system.md`. Sin usarlos todavía.
- [x] 2. Reemplazar hex idénticos por `var()` en `app-tools.css`, `app-shell.css`, `battle-ledger.css`, `global.css` y `showcase.css` (un archivo por vez). En `landing.css` y `landing-scroll.css`, solo valores idénticos.
- [x] 3. Consolidar valores casi iguales (variantes de `--paper` y `--border-strong`, radios y sombras) con la escala nueva.
- [x] 4. Quitar hex de `className` (`Badge`, `accordion`, `button`, `AccountLock`, `TrialPage`, `CompleteRolePage`, `LegalPages`, `accent-[#21B876]`).
- [x] 5. Eliminar las copias locales de `classes.ts` (`TrialPage`, `ConfirmModal`, `PodCard`, `RoundEditor`, `PodResults`, `AccountLock`, `AdminMetric`).
- [x] 6. Unificar `Metric` (tournaments, trial y `AdminMetric`) en un solo componente.
- [x] 7. Llevar `Card`, `Accordion` y `LanguageSelector` a los tokens de radio y sombra.
- [x] 8. `Modal` con el estilo de `.app-panel`.
- [x] 9. `Button` (shadcn) con el lenguaje visual de `.app-button`.
- [x] 10. Cajas de error en línea (`QrScannerModal`, `AdminDashboard`) con `--red` / `--danger-text`.
- [x] 11. Admin (`slate-*`, `amber-*`, `emerald-*`) y `AppErrorBoundary` a la paleta clara.
- [x] 12. Responsive: `.rounds-deck__tables` y `.pod-entry__metrics` en anchos angostos.
- [x] 13. i18n de textos fijos (`AppErrorBoundary`, `ELIMINAR`/`DELETE`, `R{n}`, placeholder de correo, `organizador`).

### Resultado de la ejecución (29-10-2026)

Validado con build, lint, Prettier, tests y capturas antes/después de `/muestrario`, `/`, `/trial`, `/login`, `/privacy` y `/terms` a 1280, 900 y 390 px.

- Bloques 1, 2, 5: sin cambios visibles (capturas idénticas píxel a píxel).
- Radios y sombras usan el prefijo `--app-` (`--app-radius-md`, `--app-shadow-md`…) porque Tailwind ya usa `--radius-*` y `--shadow-*` para `rounded-*` y `shadow-*`.
- Bloque 3: quedaron sin consolidar los radios decorativos de `battle-ledger.css` (incluida `.battle-note--bloodiest`), las sombras de 1–2 px, `3px 3px .06`, `3px 4px .2`, `8px 9px .25`, las azules y las `inset`. El landing solo recibió reemplazos idénticos.
- Bloque 4: los bordes de `Badge` (`#BDE8CC`, `#D6DEFF`, `#DDD0FF`) siguen en hex porque no hay token. El bloque «DUPLICADO» del muestrario conserva sus hex a propósito.
- Bloque 7: `Accordion` no se tocó porque su único uso es el FAQ del landing. En `LanguageSelector` solo cambió el menú desplegable; el botón sigue igual porque aparece en el header del landing.
- Bloque 9: `Button` tiene borde de 1.5 px (`--primary-strong` en `default`, `--foreground` en `outline`) y al pasar el mouse sube 2 px con sombra corta (solo con `motion-safe`) en lugar de crecer. En el landing no cambia nada visible porque su CSS ya define esos botones.
- Bloque 10: nueva clase `.app-inline-error` en `app-tools.css`, con el mismo aspecto que ya tenía el error de admin.
- Bloque 11: admin ya se veía con la paleta clara gracias a los puentes de `global.css`; sus clases `slate-*`, `amber-*` y `text-red-300` se dejaron para no romper la prioridad `!important`. `AppErrorBoundary` usa `.app-panel` y `.app-button--primary` (hoy no está montado en ninguna ruta).
- Bloque 12: `.rounds-deck__tables` pasa a una columna según el ancho disponible; `.pod-entry__metrics` usa una container query de 23rem.
- Bloque 13: `ELIMINAR`/`DELETE` sale de `app.profile.deleteKeyword`; el cliente sigue enviando `ELIMINAR` a la Edge Function, que no se modificó. `organizador` no se tradujo porque se guarda como nombre de jugador al unirse a un torneo.

### Tokens aprobados

| Token               | Valor                              | Absorbe                                    |
| ------------------- | ---------------------------------- | ------------------------------------------ |
| `--ink-soft`        | `#514d45`                          | —                                          |
| `--primary-strong`  | `#168050`                          | —                                          |
| `--primary-hover`   | `#1b9563`                          | —                                          |
| `--danger-text`     | `#a44840`                          | —                                          |
| `--border-strong`   | `#ded6c5`                          | `#d9d2c1`                                  |
| `--paper`           | `#fffdf7`                          | `#fffdf6`, `#fffdf5`, `#fffefa`            |
| `--highlight`       | `#fff6cb`                          | —                                          |
| `--accent-soft`     | `#e9edff`                          | —                                          |
| `--violet-soft`     | `#eee9ff`                          | `#eee4ff`, `#f0e9ff`                       |
| `--success-soft`    | `#e5f7ec`                          | — (`#d9f6e7` queda aparte)                 |
| `--app-radius-sm`   | `0.65rem 0.3rem`                   | `0.55rem 0.25rem`, `0.8rem 0.35rem`        |
| `--app-radius-md`   | `1rem 0.4rem`                      | `1rem 0.45rem`                             |
| `--app-radius-lg`   | `1.35rem 0.65rem`                  | `1.25rem 0.55rem`, `1.5rem 0.6rem/0.65rem` |
| `--app-radius-pill` | `999px`                            | —                                          |
| `--app-shadow-sm`   | `3px 4px 0 rgba(17, 17, 17, 0.1)`  | sombras de 2–3 px                          |
| `--app-shadow-md`   | `5px 6px 0 rgba(17, 17, 17, 0.1)`  | `4px 5px` y `5px 6px` con alfa `.07`–`.12` |
| `--app-shadow-lg`   | `8px 9px 0 rgba(17, 17, 17, 0.12)` | `7px 9px`, `8px 10px` (modales y overlays) |

Los literales `#111`, `#3d5afb`, `#fff` y `#c1272d` pasan a `--foreground`, `--accent`, `--card` y `--red`. Fuera de la escala quedan `50%`, los radios decorativos del landing, las sombras azules, las `inset` y `1px 1px 0 #111`.

### Decisiones tomadas

- `Metric`: queda la pastilla `.app-stat-pill` de tournaments, movida a `src/components/ui/`, con ícono opcional. Trial y admin la usan.
- Paneles con borde claro (`--border-strong`); el borde oscuro `#111` queda para botones y chips.
- `Modal`: estilo de `.app-panel` (radio `--app-radius-lg`, `--app-shadow-lg`, borde 1.5 px), sin `backdrop-blur`; se conserva el fondo oscuro `bg-black/35`.
- `Button` (shadcn): borde de 1.5 px y elevación con `translateY` como `.app-button`, sin `scale`.
- Se aceptan diferencias visuales mínimas al consolidar (bloque 3).
- Landing: solo reemplazos idénticos; su arte no se toca.
- Admin y `AppErrorBoundary` pasan a la paleta clara en esta fase.
- La palabra de confirmación es `ELIMINAR` en español y `DELETE` en inglés. «Commander» y «EDH Tournaments» no se traducen.

## Prompt para ejecutar la fase 6

```text
Lee AGENTS.md, src/AGENTS.md, docs/architecture.md, docs/design-system.md,
docs/showcase-audit.md y docs/siguientes-pasos.md.

Ejecutá la fase 6 (normalización visual) siguiendo los bloques, los tokens y las
decisiones aprobadas en docs/siguientes-pasos.md. No vuelvas a proponer ni a preguntar
lo que ya está decidido ahí.

Prioridad absoluta: no romper nada. Me gusta cómo se ve la app hoy.
- Los bloques 1 y 2 no deben producir ningún cambio visible: solo reemplazá valores
  idénticos. Si un valor no coincide exactamente, dejalo para el bloque 3.
- Desde el bloque 3, los cambios deben ser mínimos y coherentes con el estilo actual.
  Si una consolidación cambia algo de forma notoria (color, tamaño, espaciado, layout),
  no la apliques: dejá el valor original y anotalo en el resumen.
- No cambies comportamiento, lógica, rutas, props públicas, animaciones ni textos
  (salvo el bloque 13, que solo mueve textos a i18n y agrega DELETE en inglés).
- Conservá ES/EN con las mismas claves, accesibilidad (foco visible, aria, contraste,
  prefers-reduced-motion) y responsive desde 320 px.
- No toques el arte del landing más allá de reemplazos idénticos.
- No instales dependencias ni cambies configuración.

Forma de trabajo:
- Un bloque por vez, en orden. Cambios pequeños y en el estilo existente.
- Al terminar cada bloque: npm run build y npm run lint (sin tests), revisión en
  /muestrario (solo localhost; en Git Bash usá MSYS_NO_PATHCONV=1) y marcá el bloque
  en docs/siguientes-pasos.md.
- Si build o lint fallan, corregí antes de seguir. Si algo se ve roto o dudoso,
  detenete y avisame en lugar de continuar.
- Al terminar el bloque 1, agregá los tokens a docs/design-system.md. Al final,
  actualizá docs/showcase-audit.md con lo resuelto.
- No hagas commit ni push.

Al final de cada bloque reportá en 2–3 líneas: qué cambió, archivos tocados,
resultado de build/lint y cualquier valor que dejaste sin consolidar.
```
