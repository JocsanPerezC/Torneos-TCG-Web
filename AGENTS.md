# Guía de trabajo

- Responde en español y de forma concisa.
- Inspecciona únicamente los archivos relevantes antes de editar.
- Mantén los cambios pequeños, enfocados y compatibles con el estilo existente.
- No modifiques archivos ajenos a la solicitud ni reescribas código sin necesidad.
- No instales dependencias, no cambies configuraciones ni ejecutes migraciones salvo que sea necesario para la tarea.
- Ejecuta la validación mínima pertinente: formato para estilo, pruebas para lógica y compilación para cambios de integración.
- No expliques pasos internos; al terminar, indica el resultado, los archivos modificados y la validación realizada.
- Reutiliza utilidades y componentes existentes antes de crear otros nuevos.

## Contexto persistente para agentes

- Para cambios transversales, de rutas, estado, persistencia o idiomas, consulta `docs/architecture.md` antes de editar. No hace falta leerlo para ajustes estrictamente locales.
- Para auditorías o cambios visuales, consulta `docs/design-system.md` y conserva accesibilidad, responsive e i18n.
- La interfaz autenticada que se ejecuta actualmente está en `src/pages/AppRouter.tsx`; `src/pages/app/` y `src/routes/` no se cargan desde `src/App.tsx`. Confirma el árbol de imports antes de modificar esos módulos paralelos.
- `PENDIENTES.md` es el backlog de producto; `docs/decisions/` conserva decisiones técnicas duraderas. No dupliques su contenido en otros archivos.
- Mantén `src/i18n.ts` sincronizado para español e inglés cuando agregues texto visible.
- Crea o actualiza una decisión en `docs/decisions/` solo si cambia una frontera arquitectónica, una fuente de verdad, una integración externa o una regla que afectará trabajo futuro.
- Si cambian las rutas activas, las capas de datos, el modelo de persistencia o los comandos de validación, actualiza también `docs/architecture.md`.
