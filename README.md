# Guía de uso y funcionalidades

Torneos TCG permite administrar torneos multijugador de Commander y otros TCG desde una cuenta de organizador. Los participantes no requieren una cuenta: el organizador los agrega y controla sus resultados.

## Flujo del organizador

1. Crea una cuenta, inicia sesión y selecciona **Nuevo torneo**.
2. Define nombre, formato y cantidad de rondas. Los puntos se asignan manualmente a cada jugador al registrar su mesa.
3. En **Jugadores**, agrega participantes, busca por nombre, edítalos, retíralos o elimínalos antes de que entren a una ronda.
4. En **Rondas**, genera la siguiente ronda. Se requieren al menos 3 jugadores activos y las mesas se distribuyen en grupos de 3, 4 o 5 cuando corresponde.
5. Inicia la ronda, registra el resultado de cada mesa y termina la ronda cuando todas estén completas. La clasificación se recalcula de inmediato.
6. Cuando todas las rondas estén completadas, puedes finalizar el torneo para bloquear nuevas ediciones, o reabrirlo si hace falta corregir algo.

## Funcionalidades principales

- Autenticación con correo y contraseña, inicio de sesión con Google, confirmación de cuenta, recuperación de contraseña y cierre de sesión.
- Panel del organizador con torneos activos y finalizados; cada tarjeta abre el torneo directamente.
- Creación y configuración de torneos con nombre, formato, cantidad de rondas, límite de jugadores, límite de mesas y visibilidad pública.
- Administración de jugadores: alta por lista, búsqueda, edición de nombre, activación o retiro y eliminación antes de participar en una ronda.
- Generación de rondas con mesas de 3, 4 o 5 participantes y emparejamiento determinista que prioriza evitar rivales repetidos y aproxima jugadores con puntuaciones similares.
- Gestión completa de rondas: borrador, inicio, temporizador, navegación entre rondas, ajuste manual de jugadores entre mesas y eliminación de la última ronda.
- Registro de resultados con puntos manuales y kills por jugador; la ronda solo se completa cuando todas sus mesas tienen resultados válidos.
- Clasificación actualizada al instante, ordenada por puntos, fuerza de oponentes, kills y semilla estable para desempates.
- Vista pública de solo lectura mediante un enlace único del torneo, con clasificación, ronda actual, mesas y temporizador.
- Mensajes de confirmación, avisos de error y notificaciones temporales para las acciones del organizador.
- Roles `organizer`, `admin` y `super_admin`, con panel administrativo global y gestión de usuarios para super administradores.
- Persistencia en Supabase mediante operaciones atómicas para conservar configuración, jugadores, rondas, mesas y resultados.
- Modo demostración con `localStorage` cuando Supabase no está configurado.

## Puntuación

El organizador registra un número entero no negativo de puntos para cada jugador de una mesa. No existe un límite funcional de 100: se pueden registrar 1, 100 u otro valor acordado. La vista pública no expone esos puntos por mesa.

## Mejoras pendientes

- Añadir victorias, derrotas, empates y porcentaje de victorias a la clasificación y a la base de datos. Un empate contará como medio triunfo para calcular el porcentaje.

## Contenido técnico anterior

La documentación original se conserva a continuación como referencia de instalación, arquitectura y despliegue.

---

# Torneos — gestor de torneos TCG

Aplicación React/TypeScript para organizar torneos multijugador de Commander u otros TCG: participantes sin cuenta, mesas de 3–4, puntos manuales por jugador, clasificación con desempates y vista pública de solo lectura.

## Ejecutar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Sin configurar Supabase, la aplicación funciona en **modo demostración**: usa `localStorage`, incluye un torneo de ejemplo y conserva los cambios al recargar. Esto permite probar toda la lógica de torneo sin secretos.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Copia `.env.example` como `.env.local` y completa únicamente estas variables públicas:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
   ```

3. Instala la CLI de Supabase e inicia sesión; después vincula el proyecto y aplica la migración:

   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```

   Alternativamente, ejecuta `supabase/migrations/20260913000000_tournament_manager.sql` desde el SQL Editor.
4. En Authentication configura las URLs de redirección de tu entorno para recuperación de contraseña. Nunca uses ni expongas `service_role` en el frontend.

La migración crea perfiles, torneos, reglas, jugadores, rondas, mesas, asignaciones y resultados, con restricciones de integridad, trigger para no repetir a una persona en la misma ronda, índices y RLS por propietario. La vista `published_tournament_snapshot` es el punto de lectura previsto para anónimos; para publicar datos de mesas/resultados completos en producción, añade vistas específicas limitadas a torneos `is_public`.

## Arquitectura

- `src/domain/`: tipos, distribución de mesas, emparejamiento, puntuación y clasificación puros.
- `src/state/TournamentContext.tsx`: persistencia local de demostración y operaciones de torneo.
- `src/pages/AppRouter.tsx`: rutas, formularios accesibles y pantallas en español.
- `src/lib/supabase.ts`: cliente preparado con URL y clave anónima públicas.
- `supabase/migrations/`: modelo PostgreSQL y políticas RLS.

El emparejamiento usa múltiples mezclas deterministas por semilla. Su costo penaliza los pares que ya compartieron mesa (peso 100) antes de ponderar la diferencia de puntos, para priorizar no repetir enfrentamientos. En la clasificación: puntos, fuerza de oponentes (suma de puntos de quienes enfrentó), kills y una semilla estable resuelven los empates.

## Administración

La migración `20260913000013_admin_roles.sql` incorpora los roles `organizer` y `admin`. Todas las cuentas nuevas comienzan como `organizer` y no pueden cambiar su propio rol desde el navegador.

Después de aplicar las migraciones, asigna el primer administrador desde el SQL Editor de Supabase, usando el UUID de **Authentication > Users**:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID-DEL-USUARIO';
```

Al volver a iniciar sesión, esa cuenta verá `/admin`: un panel global de consulta con cuentas, torneos, participantes, rondas y visibilidad. RLS también protege estas consultas, por lo que ocultar el enlace no es la única barrera de acceso.

### Niveles de acceso

- `organizer`: administra únicamente sus propios torneos.
- `admin`: conserva las capacidades de organizador y puede consultar todas las tablas funcionales desde el panel global `/admin`.
- `super_admin`: conserva las capacidades de admin, puede gestionar cualquier torneo con la misma interfaz CRUD y es el único rol autorizado para cambiar entre `organizer` y `admin` mediante `set_profile_role`. Este rol solo se asigna desde la base de datos.

La migración `20260913000014_super_admin_roles.sql` añade el último nivel. Para promover tu cuenta actual, ejecuta en el SQL Editor:

```sql
update public.profiles
set role = 'super_admin'
where id = 'UUID-DEL-USUARIO';
```

La migración `20260913000016_super_admin_tournament_crud.sql` permite que el super admin abra **Gestionar** en cualquier torneo y use la misma interfaz completa del organizador. No existe un CRUD global separado de torneos.

## CRUD de usuarios para super admins

La función `supabase/functions/admin-users` usa la API administrativa de Supabase únicamente después de verificar que quien hace la solicitud tiene `role = 'super_admin'`. Permite crear, editar y eliminar cuentas desde el panel; solo admite los roles `organizer` y `admin`.

```bash
npx supabase functions deploy admin-users --no-verify-jwt
```

No copies una clave `service_role` al frontend ni a `.env.local`. Supabase entrega esa clave de forma segura a la Edge Function durante su ejecución.

## Verificación y despliegue

```bash
npm run lint
npm run build
```

Para desplegar, configura las dos variables `VITE_` como variables de build en tu proveedor y publica el directorio generado `dist`. Configura fallback de SPA para que las rutas `/tournaments/*` y `/t/*` resuelvan `index.html`.
