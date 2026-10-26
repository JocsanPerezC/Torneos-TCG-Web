# Prompts reutilizables para Codex

## Orientación antes de una tarea amplia

> Lee `AGENTS.md`, el `AGENTS.md` más específico de la carpeta objetivo y `docs/architecture.md`. Para backlog, consulta `PENDIENTES.md`; para decisiones existentes, consulta `docs/decisions/`. Identifica las rutas y archivos activos relacionados con la solicitud. No edites nada todavía; resume alcance, archivos relevantes, riesgos y validación mínima.

## Cambio de interfaz

> Localiza la ruta activa desde `src/App.tsx` antes de editar. Reutiliza componentes y estilos existentes. Añade español e inglés en `src/i18n.ts` para cualquier texto visible. No modifiques módulos paralelos sin comprobar que estén cargados. Implementa solo el cambio pedido y valida con la compilación.

## Cambio de datos o Supabase

> Lee `supabase/AGENTS.md`, los tipos de dominio y el repositorio de datos relacionados. Describe primero el impacto en esquema, RLS, RPCs, modo demo e interfaz. Crea una migración nueva solo si se aprobó el cambio de base de datos; no ejecutes migraciones ni despliegues.

## Revisión antes de entregar

> Revisa el diff contra la solicitud. Confirma que las rutas modificadas son las activas, que los textos nuevos tienen español e inglés y que los cambios de dominio tienen pruebas pertinentes. Ejecuta la validación mínima y reporta únicamente archivos modificados, evidencia observada y riesgos pendientes.
