# ADR 0003: perfil

- Estado: aceptada
- Fecha: 2026-10-28, actualizada el 2026-10-29
- Reúne los antiguos ADR 0003 (fotos de perfil en Supabase Storage) y 0004 (eliminación de cuenta propia).

## Fotos de perfil en Supabase Storage

### Decisión

Las fotos se almacenan en el bucket público `profile-avatars`, limitado a JPG, PNG y WebP de 2 MB. Cada cuenta solo puede modificar objetos dentro de su propia carpeta. `profiles.avatar_url` es la fuente de verdad y un trigger la replica en los participantes vinculados para que los organizadores puedan mostrarla sin ampliar el acceso a perfiles ajenos.

### Consecuencias

- Las cuentas sin foto y los participantes manuales conservan el monograma de iniciales.
- Una foto actualizada se refleja en todas las inscripciones vinculadas de la cuenta.

## Eliminación de cuenta propia

### Decisión

La eliminación de la propia cuenta se ejecuta mediante la Edge Function `admin-users` con la acción `delete-self`. La función obtiene la cuenta desde el JWT autenticado y exige la confirmación literal `ELIMINAR`; no recibe ni confía en un identificador de destino enviado por el cliente.

En la interfaz, la persona escribe la palabra de su idioma (`ELIMINAR` en español, `DELETE` en inglés, clave `app.profile.deleteKeyword`). El cliente valida esa palabra y envía siempre `ELIMINAR` a la función, que no cambió.

La función rechaza la eliminación si la cuenta es propietaria de uno o más torneos, sin distinguir si están activos o finalizados. La transferencia de torneos no está disponible aún. Cuando la cuenta no posee torneos, la función elimina los archivos de su carpeta en `profile-avatars`, desvincula sus filas de `players` y borra la cuenta de Auth. Así se conserva la inscripción y los resultados históricos, sin asociarlos a una cuenta eliminada.

### Consecuencias

- La pantalla Perfil solicita confirmación antes de habilitar la acción irreversible.
- El mensaje de bloqueo explica que primero se deben eliminar los torneos; no se promete una transferencia inexistente.
- Al volver a iniciar sesión se crea una cuenta nueva, sin recuperar las inscripciones desvinculadas ni el avatar anterior.
- Las eliminaciones administrativas siguen separadas y solo están disponibles para superadministradores.
