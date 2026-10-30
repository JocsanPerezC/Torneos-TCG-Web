# Auditoría visual

Normalización visual de la interfaz: qué se resolvió en la fase 6, qué queda pendiente y el inventario original que la motivó. Los tokens vigentes están en `docs/design-system.md`.

## Estado (29-10-2026)

Resuelto (detalle por bloque más abajo):

- Tokens de color, radio (`--app-radius-*`) y sombra (`--app-shadow-*`) en `src/styles/base.css`; los hex repetidos de `src/styles/` y de los `className` listados en la sección 2 ya usan tokens.
- Una sola `Metric` en `src/components/ui/Metric.tsx`; se eliminaron las versiones de tournaments, trial y `AdminMetric`.
- Constantes de clase: las siete copias locales importan `src/components/ui/classes.ts`.
- `Modal` y `Card` usan el estilo de panel (radio irregular, borde de 1.5 px, sombra desplazada) y el modal ya no usa `backdrop-blur`.
- `Button` (shadcn) con el borde y la elevación de `.app-button`.
- Cajas de error en línea: `.app-inline-error`.
- `AppErrorBoundary` se eliminó: no estaba montado en ninguna ruta.
- i18n: `ELIMINAR`/`DELETE`, `R{n}` y el placeholder de correo.
- Responsive: `.rounds-deck__tables` y `.pod-entry__metrics` dependen del ancho disponible.

Sigue pendiente: `Accordion` (solo se usa en el FAQ del landing), el botón de `LanguageSelector`, los bordes de `Badge`, las clases `slate-*` de admin (hoy cubiertas por puentes en `global.css`), la escala tipográfica y de paddings, el nombre de respaldo `organizador` y los duplicados de la sección 1 que no son visuales (podio, marca, estado vacío, avatar, `validationMessages`, editor de resultados de trial).

Referencia: `docs/design-system.md` pide bordes oscuros de 1.5–2 px, sombras cortas desplazadas, esquinas irregulares, colores de la paleta y nada de glassmorphism.

## Notas de la fase 6 por bloque

Validado con build, lint, Prettier, tests y capturas antes/después de `/muestrario`, `/`, `/trial`, `/login`, `/privacy` y `/terms` a 1280, 900 y 390 px.

- Bloques 1, 2, 5: sin cambios visibles (capturas idénticas píxel a píxel).
- Radios y sombras usan el prefijo `--app-` (`--app-radius-md`, `--app-shadow-md`…) porque Tailwind ya usa `--radius-*` y `--shadow-*` para `rounded-*` y `shadow-*`.
- Bloque 3: quedaron sin consolidar los radios decorativos de `battle-ledger.css` (incluida `.battle-note--bloodiest`), las sombras de 1–2 px, `3px 3px .06`, `3px 4px .2`, `8px 9px .25`, las azules y las `inset`. El landing solo recibió reemplazos idénticos.
- Bloque 4: los bordes de `Badge` (`#BDE8CC`, `#D6DEFF`, `#DDD0FF`) siguen en hex porque no hay token. El bloque «DUPLICADO» del muestrario conserva sus hex a propósito.
- Bloque 7: `Accordion` no se tocó porque su único uso es el FAQ del landing. En `LanguageSelector` solo cambió el menú desplegable; el botón sigue igual porque aparece en el header del landing.
- Bloque 9: `Button` tiene borde de 1.5 px (`--primary-strong` en `default`, `--foreground` en `outline`) y al pasar el mouse sube 2 px con sombra corta (solo con `motion-safe`) en lugar de crecer. En el landing no cambia nada visible porque su CSS ya define esos botones.
- Bloque 10: nueva clase `.app-inline-error` en `app-tools.css`, con el mismo aspecto que ya tenía el error de admin.
- Bloque 11: admin ya se veía con la paleta clara gracias a los puentes de `global.css`; sus clases `slate-*`, `amber-*` y `text-red-300` se dejaron para no romper la prioridad `!important`. `AppErrorBoundary` usa `.app-panel` y `.app-button--primary` ; después se eliminó durante la reestructuración porque no estaba montado.
- Bloque 12: `.rounds-deck__tables` pasa a una columna según el ancho disponible; `.pod-entry__metrics` usa una container query de 23rem.
- Bloque 13: `ELIMINAR`/`DELETE` sale de `app.profile.deleteKeyword`; el cliente sigue enviando `ELIMINAR` a la Edge Function, que no se modificó. `organizador` no se tradujo porque se guarda como nombre de jugador al unirse a un torneo.

## Decisiones de la fase 6

- `Metric`: queda la pastilla `.app-stat-pill` de tournaments, movida a `src/components/ui/`, con ícono opcional. Trial y admin la usan.
- Paneles con borde claro (`--border-strong`); el borde oscuro `#111` queda para botones y chips.
- `Modal`: estilo de `.app-panel` (radio `--app-radius-lg`, `--app-shadow-lg`, borde 1.5 px), sin `backdrop-blur`; se conserva el fondo oscuro `bg-black/35`.
- `Button` (shadcn): borde de 1.5 px y elevación con `translateY` como `.app-button`, sin `scale`.
- Se aceptan diferencias visuales mínimas al consolidar (bloque 3).
- Landing: solo reemplazos idénticos; su arte no se toca.
- Admin y `AppErrorBoundary` pasan a la paleta clara en esta fase.
- La palabra de confirmación es `ELIMINAR` en español y `DELETE` en inglés. «Commander» y «EDH Tournaments» no se traducen.

## Inventario original

Generado al ampliar `/muestrario` antes de la fase 6; las referencias `archivo:línea` pueden haber cambiado.

### 1. Componentes duplicados o casi iguales

| Qué                                | Dónde                                                                                                                                                                                                                                    | Diferencia                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Métrica (3 versiones)              | `src/features/tournaments/components/Metric.tsx:3` · `src/features/trial/components/Metric.tsx:3` · `src/features/admin/components/AdminMetric.tsx:3`                                                                                    | Pastilla `.app-stat-pill` con ícono; caja `rounded-2xl bg-secondary/60` sin borde; `app-panel` con ícono `text-amber-300`. Mismo propósito, tres estilos. |
| Editor de resultados de ronda      | `src/features/trial/components/RoundEditor.tsx:8` + `src/features/trial/components/PodResults.tsx:5` frente a `src/features/tournaments/components/PodCard.tsx:13` + `src/features/tournaments/components/OutcomeButtons.tsx:6`          | El modo prueba usa `<select>` y una tabla propia; la app usa chips `.outcome-chips` y `.game-table`.                                                      |
| Podio de clasificación             | `src/features/tournaments/components/Standings.tsx:44` · `src/features/public/PublicView.tsx:179`                                                                                                                                        | Mismo markup `.standings-podium` copiado; la versión pública no anima movimientos.                                                                        |
| Marca «EDH Tournaments»            | `src/components/layout/PublicHeader.tsx:19` · `src/features/trial/TrialPage.tsx:621` (TrialShell) · `src/features/landing/components/LandingHeader.tsx:53` · `src/components/layout/AuthenticatedShell.tsx:215`                          | Cuatro copias del logo con texto, con tres clases distintas (`app-shell-header__brand`, `landing-header__brand`, `app-sidebar__brand`).                   |
| Headers de página                  | `PublicHeader.tsx` · `TrialShell` en `TrialPage.tsx:614` · `LandingHeader.tsx`                                                                                                                                                           | Comparten `.app-shell-header`, salvo el landing; los botones de acción tienen tamaños distintos.                                                          |
| Estado vacío                       | `.app-empty-state` (`src/styles/app-tools.css`) · `EmptyMark` en `src/features/tournaments/components/BattleGlyphs.tsx:143` · `.battle-ledger__empty` en `BattleLedger.tsx:56`                                                           | Tres presentaciones de «no hay datos».                                                                                                                    |
| Iniciales de avatar                | `src/components/ui/Avatar.tsx:21` (1 letra) · `initials()` en `src/features/tournaments/components/battleText.ts:7` (2 letras) · `src/features/public/PublicView.tsx:142` (1 letra, sin `Avatar`)                                        | Un mismo jugador aparece como «A» o «AR» según la pantalla.                                                                                               |
| Badge de estado                    | `src/components/ui/Badge.tsx:3` · antiguo bloque manual del muestrario (se conserva marcado en la sección Estados)                                                                                                                       | Mismos colores escritos a mano en dos sitios.                                                                                                             |
| Card con estilo de panel           | Muestrario, sección Contenedores (`Card` con `border-[#DED6C5] bg-[#FFFDF7] shadow-[…]`) · `.app-panel`                                                                                                                                  | Recrea `.app-panel` sobre `Card` con clases arbitrarias.                                                                                                  |
| Clasificación de mensajes de error | `src/components/feedback/Notice.tsx:12` · `src/features/tournaments/components/PodCard.tsx:55`                                                                                                                                           | Misma lista `validationMessages` duplicada para decidir si un toast es de error.                                                                          |
| Constantes de clase                | Existe `src/components/ui/classes.ts` (`primary`, `panel`, `field`), pero se redefinen en `TrialPage.tsx:17`, `ConfirmModal.tsx:5`, `PodCard.tsx:10`, `RoundEditor.tsx:5`, `PodResults.tsx:3`, `AccountLock.tsx:3` y `AdminMetric.tsx:1` | Siete copias locales del mismo alias.                                                                                                                     |
| Cajas de error en línea            | `src/features/tournaments/components/QrScannerModal.tsx:51` (`red-50/red-200/red-700`) · `src/features/admin/AdminDashboard.tsx:138` (`red-950/red-700/red-300`)                                                                         | Dos rojos de Tailwind distintos y ninguno es `--red`.                                                                                                     |

### 2. Colores hex hardcodeados en `className`

| Archivo:línea                                                           | Valor                                                     | Token propuesto                                                                   |
| ----------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/components/ui/Badge.tsx:4`                                         | `border-[#E7E2D2] bg-[#F4F1E7]`                           | `border-border bg-secondary` (`#F2F0E5`; `#F4F1E7` es casi igual)                 |
| `src/components/ui/Badge.tsx:5,7`                                       | `border-[#BDE8CC] bg-[#E5F7EC] text-[#168050]`            | Nuevos `--success-soft`, `--success-border` y `--primary-strong: #168050`         |
| `src/components/ui/Badge.tsx:6`                                         | `border-[#D6DEFF] bg-[#E9EDFF] text-[#3D5AFB]`            | `text-accent` + nuevo `--accent-soft: #E9EDFF`                                    |
| `src/components/ui/Badge.tsx:8`                                         | `border-[#DDD0FF] bg-[#F0E9FF] text-[#5B1FE0]`            | `text-[var(--violet)]` + nuevo `--violet-soft: #F0E9FF`                           |
| `src/components/ui/accordion.tsx:9`                                     | `hover:bg-[#F4F1E7]`                                      | `hover:bg-secondary`                                                              |
| `src/components/ui/button.tsx:11`                                       | `hover:bg-[#1B9563]`                                      | Nuevo `--primary-hover` (también lo usa `.app-button--primary:hover` en CSS)      |
| `src/features/trial/components/AccountLock.tsx:8`                       | `bg-[#eee9ff] text-[#5B1FE0]`                             | `--violet-soft` / `--violet`                                                      |
| `src/features/trial/TrialPage.tsx:324`                                  | `bg-[#e5f7ec] bg-[#eee9ff] text-[#168050] text-[#5B1FE0]` | `--success-soft`, `--violet-soft`, `--primary-strong`, `--violet`                 |
| `src/features/trial/TrialPage.tsx:230`                                  | `text-[#a44840]`                                          | Nuevo `--danger-text: #A44840` (19 usos en CSS) o `--red`                         |
| `src/features/trial/TrialPage.tsx:422`                                  | `text-[#168050]`                                          | `--primary-strong`                                                                |
| `src/features/trial/TrialPage.tsx:551,592`                              | `text-[#5B1FE0]`                                          | `--violet`                                                                        |
| `src/features/auth/CompleteRolePage.tsx:147,158,174`                    | `bg-[#E9EDFF]`                                            | `--accent-soft`                                                                   |
| `AuthPage.tsx:110` · `LegalConsent.tsx:51` · `CompleteRolePage.tsx:103` | `accent-[#21B876]`                                        | `accent-primary`                                                                  |
| `src/features/legal/LegalPages.tsx:24`                                  | `text-[#514d45]`                                          | Nuevo `--ink-soft: #514D45` (53 usos en CSS, el hex fuera de paleta más repetido) |

**Colores de Tailwind fuera de la paleta.** `AdminMetric.tsx:14` (`text-amber-300`), `QrScannerModal.tsx:51` (`red-*`) y `AppErrorBoundary.tsx:35-43` (tema oscuro `slate-*` / `amber-*`, con texto sin i18n). Además, las pantallas de `src/features/admin/` (`AdminDashboard.tsx`, `SuperAdminPlayerManagement.tsx`, `UserProfileModal.tsx`: `slate-700/800`, `emerald-300`, `amber-400`) depende de reglas CSS que reasignan `[class*='bg-slate-900']`.

**Hex más repetidos en `src/styles/*.css` que no son tokens** (89 hex distintos en total): `#514d45` (53), `#168050` (22), `#a44840` (19), `#ded6c5` (18), `#fffdf7` (17), `#fff6cb` (14), `#fffdf6` (10), `#e9edff` (10), `#d9d2c1` (10). Propuesta: `--ink-soft`, `--primary-strong`, `--danger-text`, `--border-strong` (`#ded6c5`/`#d9d2c1`), `--paper` (`#fffdf7`/`#fffdf6`/`#fffdf5`/`#fffefa`, casi idénticos) y `--highlight` (`#fff6cb`).

### 3. Radios, sombras, paddings y tipografía

| Elemento                                          | Valor actual                                                                                                   | Choque con `design-system.md`                                                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Modal` (`src/components/ui/modal.tsx`)           | `rounded-3xl border border-border shadow-2xl shadow-black/15`; fondo `backdrop-blur-sm`                        | Sombra difusa en lugar de desplazada, borde suave de 1 px y desenfoque tipo glassmorphism.                                                                                                   |
| `Card` (`src/components/ui/card.tsx:3`)           | `rounded-3xl border shadow-sm`                                                                                 | Radio simétrico, borde de 1 px claro y sombra difusa.                                                                                                                                        |
| `Accordion` (`src/components/ui/accordion.tsx:4`) | `rounded-3xl border border-border`                                                                             | Igual que `Card`. Tampoco existe la clase `ds-accordion`.                                                                                                                                    |
| `LanguageSelector`                                | Botón `shadow-sm`; menú `rounded-2xl shadow-xl`                                                                | Sombras difusas.                                                                                                                                                                             |
| `Button` (shadcn)                                 | `rounded-full`, sin borde en `default`, `hover:scale-[1.02]`                                                   | `.app-button` lleva un borde de 1.5 px `#111` y sube con `translateY`: hay dos lenguajes de botón. No existe `.app-button--ghost`.                                                           |
| `.app-panel`                                      | Borde 1.5 px `#ded6c5`                                                                                         | Borde claro, no oscuro. `.app-panel--sheet` no existe.                                                                                                                                       |
| `.app-field`                                      | Borde 1.5 px `#d9d2c1`, radio `0.7rem 0.4rem`                                                                  | Sin estado de error visual propio; solo validación nativa.                                                                                                                                   |
| Trial `Metric` / `PodResults`                     | `rounded-2xl`, sin borde o con `border-border` de 1 px                                                         | Sin esquinas irregulares ni sombra desplazada.                                                                                                                                               |
| `QrScannerModal`                                  | `rounded-xl` / `rounded-2xl border-2`                                                                          | Radios simétricos.                                                                                                                                                                           |
| `AppErrorBoundary`                                | `rounded-xl` / `rounded-lg`, `shadow-xl`, tema oscuro                                                          | Fuera de la identidad visual.                                                                                                                                                                |
| Radios en `src/styles/`                           | **70 valores distintos** de `border-radius`                                                                    | Los más usados (`1.5rem 0.65rem`, `1rem 0.4rem`, `1rem 0.45rem`, `1.25rem 0.55rem`, `1.35rem 0.65rem`) podrían ser 3 tokens: `--radius-sm`, `-md` y `-lg`.                                   |
| Sombras en `src/styles/`                          | **34 valores distintos** de `box-shadow`                                                                       | Alfas casi iguales (`.07`, `.08`, `.09`, `.1`, `.11`, `.12`) con offsets `4px 5px` / `5px 6px`. Propuesta: `--shadow-sm` (`3px 4px`), `--shadow-md` (`4px 5px`) y `--shadow-lg` (`8px 9px`). |
| Tamaños de fuente                                 | **63 valores distintos** de `font-size`; 31 reglas por debajo de `0.7rem` (mínimo `0.56rem` ≈ 9 px)            | Choca con la pauta de legibilidad. También hay valores arbitrarios en clases como `!text-[.82rem]` (`PublicHeader.tsx`).                                                                     |
| Paddings                                          | Mezcla de utilidades Tailwind (`p-4`, `p-6`, `px-5 py-3`) y valores CSS sueltos (`0.62rem 0.75rem`, `1.35rem`) | Sin escala común entre `Card` (`p-6`), `.app-panel` (`1.25rem`) y `Modal` (`p-6`).                                                                                                           |

### 4. Textos sin clave i18n

| Archivo:línea                                          | Texto                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `src/components/AppErrorBoundary.tsx:38-45`            | «Ha ocurrido un error», «Actualiza la página para intentarlo de nuevo.» y el botón |
| `src/features/profile/ProfilePage.tsx:545`             | Palabra de confirmación `ELIMINAR` (fija en español también en inglés)             |
| `src/features/auth/AuthPage.tsx:175`                   | `placeholder="correo@gmail.com"`                                                   |
| `NewTournament.tsx:83` · `TrialPage.tsx:63,248`        | Formato por defecto `Commander` (nombre propio; decidir si se traduce)             |
| `src/features/tournaments/Overview.tsx:37`             | Abreviatura `R${número}` de ronda                                                  |
| `src/lib/userProfile.ts:20-21`                         | Nombre de respaldo `organizador`                                                   |
| `src/features/landing/components/LandingFooter.tsx:43` | `title="GitHub"` (nombre propio)                                                   |
| `src/components/layout/AuthenticatedShell.tsx:216`     | `aria-label="EDH Tournaments"` (marca)                                             |
| `src/state/TournamentContext.tsx` (`localInitial`)     | Datos demo locales: nombre `Liga` y jugadores de ejemplo                           |

La marca «EDH Tournaments» aparece sin traducir en varios headers. Es un nombre propio, así que probablemente está bien, pero conviene confirmarlo.

### 5. Notas del inventario

- **Componentes del landing que ya no existen:** `Hero`, `HowItWorks`, `ConceptPanel`, `StandingsPreview` y `ProjectIdea` se eliminaron al rediseñar el landing. El muestrario muestra los actuales: `IntroScene`, `NightScroll`, `TableRail`, `FeatureList`, `Faq`, `FinalCta`, `LandingHeader` y `LandingFooter`.
- **`RoundTimer`** es un cronómetro: no tiene estado «vencido».
- **`FormLimits`** aplica límites y mensajes de validación, pero no muestra contador de caracteres.
- **`ArrowGlyph`** siempre antepone «+», incluso con valores negativos o cero.
- **Propiedades nuevas, solo para el muestrario:** `QrScannerModal` recibe `preview` (no enciende la cámara) y `TournamentJoinLink` recibe `preview` (token de ejemplo, sin Supabase). Por defecto se comportan igual que antes.
- El toggle «Ancho mobile (390 px)» limita el ancho del lienzo, pero las media queries siguen al viewport. Para validar el responsive de verdad, usá los marcos del landing (iframes) o DevTools. Aun así revela un hallazgo: en un contenedor de 390 px, `.rounds-deck__tables` sigue en dos columnas y `.pod-entry__metrics` corta «Resultado» y su valor, porque esas reglas dependen del ancho de pantalla y no del contenedor.
