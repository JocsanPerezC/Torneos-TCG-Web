# Prompts reutilizables para Codex

## Auditoría de diseño

> Usa `$tcg-ui-designer` para auditar esta pantalla. Confirma primero la implementación activa y consulta `docs/design-system.md`. No edites código: identifica los problemas más importantes y propone hasta dos mejoras que preserven la identidad visual, el responsive y los idiomas ES/EN.

## Orientación antes de una tarea amplia

> Lee `AGENTS.md`, el `AGENTS.md` más específico de la carpeta objetivo y `docs/architecture.md`. Para backlog, consulta `docs/pendientes.md`; para decisiones existentes, consulta `docs/decisions/`. Identifica las rutas y archivos activos relacionados con la solicitud. No edites nada todavía; resume alcance, archivos relevantes, riesgos y validación mínima.

## Cambio de interfaz

> Localiza la ruta activa desde `src/app/AppRouter.tsx` y su pantalla en `src/features/<área>/` antes de editar. Reutiliza componentes de `src/components/`, clases existentes y los tokens de `src/styles/base.css` (ver `docs/design-system.md`). Añade español e inglés en `src/i18n/es.ts` y `src/i18n/en.ts` con las mismas claves para cualquier texto visible. No modifiques módulos paralelos sin comprobar que estén cargados. Implementa solo el cambio pedido, valida con `npm run build` y `npm run lint`, y revisa el resultado en `/muestrario` (solo localhost).

## Cambio de datos o Supabase

> Lee `supabase/AGENTS.md`, los tipos de dominio y el repositorio de datos relacionados. Describe primero el impacto en esquema, RLS, RPCs, modo demo e interfaz. Crea una migración nueva solo si se aprobó el cambio de base de datos; no ejecutes migraciones ni despliegues.

## Revisión antes de entregar

> Revisa el diff contra la solicitud. Confirma que las rutas modificadas son las activas, que los textos nuevos tienen español e inglés y que los cambios de dominio tienen pruebas pertinentes. Ejecuta la validación mínima y reporta únicamente archivos modificados, evidencia observada y riesgos pendientes.
