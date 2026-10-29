# ADR 0003: fotos de perfil en Supabase Storage

- Estado: aceptada
- Fecha: 2026-10-28

## Decisión

Las fotos se almacenan en el bucket público `profile-avatars`, limitado a JPG, PNG y WebP de 2 MB. Cada cuenta solo puede modificar objetos dentro de su propia carpeta. `profiles.avatar_url` es la fuente de verdad y un trigger la replica en los participantes vinculados para que los organizadores puedan mostrarla sin ampliar el acceso a perfiles ajenos.

## Consecuencias

- Las cuentas sin foto y los participantes manuales conservan el monograma de iniciales.
- Una foto actualizada se refleja en todas las inscripciones vinculadas de la cuenta.
