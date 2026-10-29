# ADR 0004: eliminación de cuenta propia

- Estado: aceptada
- Fecha: 2026-10-28

## Decisión

La eliminación de la propia cuenta se ejecuta mediante la Edge Function `admin-users` con la acción `delete-self`. La función obtiene la cuenta desde el JWT autenticado y exige la confirmación literal `ELIMINAR`; no recibe ni confía en un identificador de destino enviado por el cliente.

La función rechaza la eliminación si la cuenta es propietaria de uno o más torneos, sin distinguir si están activos o finalizados. La transferencia de torneos no está disponible aún. Cuando la cuenta no posee torneos, la función elimina los archivos de su carpeta en `profile-avatars`, desvincula sus filas de `players` y borra la cuenta de Auth. Así se conserva la inscripción y los resultados históricos, sin asociarlos a una cuenta eliminada.

## Consecuencias

- La pantalla Perfil solicita confirmación antes de habilitar la acción irreversible.
- El mensaje de bloqueo explica que primero se deben eliminar los torneos; no se promete una transferencia inexistente.
- Al volver a iniciar sesión se crea una cuenta nueva, sin recuperar las inscripciones desvinculadas ni el avatar anterior.
- Las eliminaciones administrativas siguen separadas y solo están disponibles para superadministradores.
