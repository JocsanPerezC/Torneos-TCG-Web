# ADR 0002: cuentas de jugador e invitaciones de torneo

- Estado: aceptada
- Fecha: 2026-10-27

## Contexto

La aplicación solo distinguía cuentas con capacidades de organización y participantes identificados por nombre dentro de cada torneo. Se requiere que una cuenta de jugador conserve sus torneos e historial, sin eliminar el flujo de agregar asistentes manualmente.

## Decisión

Se añade el rol inmutable `player`. Después de autenticarse por primera vez, una persona elige `player` u `organizer`; si llega mediante una invitación `/unirse/:token`, la plataforma asigna y bloquea automáticamente `player` para continuar la inscripción. La ruta se conserva temporalmente en la sesión del navegador para reanudar la invitación al volver de OAuth. Únicamente un `super_admin` puede cambiar ese valor después. Hasta que confirma la elección, no puede organizar torneos ni inscribirse. Las cuentas de organizador, administración y superadministración no se pueden vincular como participantes.

`players.profile_id` es opcional. Un registro nulo representa un participante manual; un valor presente enlaza una inscripción a una cuenta `player`. Cada torneo admite a lo sumo una inscripción vinculada por cuenta.

Un nombre puede coincidir temporalmente entre una cuenta vinculada y un participante manual, para no impedir una inscripción legítima. Antes de generar cualquier ronda, el organizador debe renombrar al participante manual; la aplicación y la base de datos rechazan la generación mientras la ambigüedad exista.

Los organizadores comparten una única invitación activa por torneo. El token no adivinable se entrega como enlace o QR, se puede rotar o revocar y se procesa solo mediante funciones `security definer`. La misma invitación tiene un código manual corto, único y fácil de compartir; ambos formatos se resuelven exclusivamente mediante esas funciones. La inscripción verifica rol, cupo, estado activo y nombre de participante antes de crear el vínculo.

## Consecuencias

- Los jugadores solo consultan sus propios torneos mediante una función de lectura acotada.
- Las cuentas `admin` y `super_admin` usan la consola administrativa y no pueden crear torneos; esa capacidad pertenece solo a `organizer`.
- Los participantes manuales continúan disponibles para el organizador y entran al emparejamiento igual que los vinculados.
- Las políticas, triggers y RPCs de Supabase impiden que un jugador cree torneos o que una cuenta que no sea `player` se inscriba.
- El QR se genera localmente a partir del enlace activo; no se envía el token a servicios externos.
