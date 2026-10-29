# Siguientes pasos

Pendientes técnicos tras reacomodar el repo (29-10-2026).

## Antes de seguir

- [ ] Abrir la app y revisar las pantallas principales: landing, login, dashboard, torneo (jugadores, rondas, clasificación), vista pública y admin.
- [ ] Hacer commit del reacomodo.
- [ ] Descartar el stash viejo de `Local` en GitHub Desktop: cambios sobre el landing anterior, ya no sirven.
- [ ] Decidir qué pasa con la rama `demo` y su stash de septiembre; va a chocar con la estructura nueva.
- [ ] Actualizar `PROMPTS.md`: todavía menciona `src/App.tsx` y `src/i18n.ts`.

## Fase 6: normalización visual

La lista completa está en `docs/showcase-audit.md`. Lo más importante:

- [ ] Tokens nuevos para los hex repetidos (`--ink-soft`, `--primary-strong`, `--danger-text`, `--paper`, `--accent-soft`, `--violet-soft`…).
- [ ] Escala de radios y sombras (3 de cada uno) en lugar de los 70 radios y 34 sombras actuales.
- [ ] Unificar las 3 métricas (`Metric` de tournaments y de trial, y `AdminMetric`).
- [ ] Alinear `Modal`, `Card`, `Accordion` y `Button` con el estilo de `.app-panel` y `.app-button`.
- [ ] Llevar a i18n los textos fijos (`AppErrorBoundary`, `ELIMINAR`, `R{n}`…).
- [ ] Responsive: `.rounds-deck__tables` y `.pod-entry__metrics` se cortan en anchos angostos.

## Prompt para retomar

```text
Lee AGENTS.md, src/AGENTS.md, docs/architecture.md, docs/design-system.md,
docs/showcase-audit.md y docs/siguientes-pasos.md.

Quiero avanzar con la fase 6 (normalización visual). Antes de editar:
1. Mostrame una propuesta corta de tokens (colores, radios y sombras) con sus valores,
   basada en lo que más se repite en src/styles/.
2. Proponé el orden de trabajo por bloques pequeños, empezando por tokens y luego componentes.
3. Decime qué decisiones necesitás de mí (por ejemplo, qué Metric queda o si Modal
   adopta el estilo de .app-panel).

Reglas: no cambies comportamiento ni textos, conservá ES/EN, accesibilidad y responsive.
Validá cada bloque con build y lint (no hace falta correr tests) y revisalo en /muestrario.
Al terminar cada bloque, marcá lo hecho en docs/siguientes-pasos.md.
```
