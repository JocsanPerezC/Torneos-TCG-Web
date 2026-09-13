# Prompt para Codex: Commander Tournament Manager

Quiero que construyas dentro de este repositorio una aplicación web completa para organizar torneos casuales o competitivos de Commander y otros TCG multijugador. No quiero solamente una maqueta visual: implementa las pantallas, la navegación, la lógica de negocio, la persistencia y las pruebas descritas aquí.

## Forma de trabajo

1. Antes de modificar archivos, inspecciona el repositorio y explica brevemente lo que encontraste.
2. Crea un plan de implementación y ejecútalo de principio a fin sin detenerte en cada paso para pedir confirmación.
3. Conserva cualquier código útil que ya exista y no sobrescribas cambios ajenos sin revisarlos.
4. Instala las dependencias necesarias y usa versiones compatibles con el proyecto.
5. Si faltan credenciales de Supabase, no detengas todo el desarrollo: crea `.env.example`, deja la integración preparada y documenta exactamente qué valores debo colocar. Nunca incluyas secretos reales en el repositorio.
6. Al terminar, ejecuta lint, pruebas y build. Corrige los errores encontrados.
7. Actualiza el `README.md` con instrucciones claras para configurar Supabase, ejecutar el proyecto, aplicar las migraciones y desplegarlo.

## Stack requerido

- React con TypeScript y Vite.
- React Router para las rutas.
- Supabase para PostgreSQL, autenticación y persistencia.
- Tailwind CSS para estilos.
- Vitest y React Testing Library para las pruebas.
- Formularios accesibles, validación clara y diseño responsive.

Puedes elegir librerías pequeñas adicionales cuando aporten valor, pero evita dependencias innecesarias. Mantén separadas la interfaz, la lógica de emparejamientos, los cálculos de puntuación y el acceso a datos.

## Idioma y diseño

Toda la interfaz debe estar en español. El diseño debe sentirse relacionado con torneos de cartas, con una apariencia moderna, clara y sobria, pero no debe copiar imágenes, cartas, logotipos ni recursos protegidos de Magic: The Gathering. Debe funcionar correctamente tanto en computadora como en teléfono, ya que el organizador probablemente registrará resultados desde el lugar del torneo.

Incluye estados de carga, mensajes de error, confirmaciones, estados vacíos y notificaciones de éxito. No uses botones decorativos que no funcionen.

## Modelo de acceso

- Solamente el organizador necesita una cuenta.
- Implementa registro, inicio de sesión, cierre de sesión y recuperación de contraseña para el organizador mediante Supabase Auth.
- Un organizador puede crear y administrar varios torneos desde su panel.
- Los jugadores no crean cuentas en esta primera versión. El organizador los agrega mediante un nombre visible.
- Los nombres de jugadores deben ser únicos dentro de un torneo, ignorando mayúsculas, minúsculas y espacios accidentales al inicio o al final.
- Cada torneo debe tener un enlace público difícil de adivinar para consultar mesas, rondas y clasificación sin iniciar sesión.
- La vista pública es de solo lectura.
- Configura Row Level Security en Supabase: únicamente el propietario puede crear, editar o borrar información de sus torneos. Los usuarios anónimos solo pueden consultar los datos permitidos de torneos publicados mediante la ruta pública.

## Creación y configuración del torneo

El formulario para crear un torneo debe permitir:

- Nombre del torneo.
- Juego o formato, con `Commander` como valor inicial pero sin limitar la aplicación permanentemente a ese formato.
- Cantidad inicial de rondas planificadas.
- Reglas de puntuación propias para ese torneo.
- Estado: borrador, activo o finalizado.
- Opción para habilitar o deshabilitar la vista pública.

Valida que la cantidad de rondas sea un entero positivo.

## Reglas de puntuación configurables por torneo

Cada torneo debe guardar su propia configuración. Usa estos valores iniciales, pero permite editarlos:

| Resultado | Puntos iniciales |
| --- | ---: |
| Primer lugar | 3 |
| Segundo lugar | 2 |
| Tercer lugar | 1 |
| Cuarto lugar | 0 |
| Ganador por combo | 3 |
| Cada jugador que no ganó cuando hubo combo | 1 |

Requisitos:

- La puntuación no es una preferencia global del usuario; pertenece al torneo.
- En una victoria normal, calcula los puntos según la posición registrada.
- En una victoria por combo, el ganador recibe los puntos configurados para ganador por combo y todos los demás reciben los puntos configurados para no ganadores por combo.
- Permite valores enteros iguales o mayores que cero.
- Si se cambian las reglas después de haber registrado resultados, muestra una advertencia explícita y exige confirmación. Al confirmar, recalcula de manera consistente toda la clasificación del torneo.
- No permitas que una edición deje resultados históricos parcialmente recalculados.

## Jugadores

El organizador puede:

- Agregar jugadores individualmente.
- Agregar varios nombres mediante un campo multilínea, uno por línea.
- Editar el nombre de un jugador.
- Marcar un jugador como activo o retirado.
- Eliminar un jugador únicamente si todavía no ha participado en ninguna ronda.
- Consultar su historial de mesas, resultados, puntos y kills dentro del torneo.

La primera ronda no se puede generar con menos de seis jugadores activos. No existe una modalidad de torneo para cinco jugadores. Si antes de una ronda posterior quedan menos de seis jugadores activos, no permitas generar esa ronda y explica el motivo.

## Administración flexible de rondas

La cantidad de rondas debe poder cambiarse por torneo incluso después de crearlo.

- El organizador puede aumentar las rondas planificadas cuando necesite extender el torneo.
- Puede reducir rondas futuras que todavía no hayan sido generadas.
- Las rondas se generan una por una mediante un botón `Generar siguiente ronda`.
- No generes automáticamente todas las rondas al crear el torneo.
- Solo puede existir una ronda activa sin resultados completos.
- Permite eliminar únicamente la última ronda generada.
- Si la última ronda generada todavía no tiene resultados, pide confirmación y permite eliminarla.
- Si ya tiene uno o más resultados, muestra una advertencia más fuerte indicando que se eliminarán sus mesas y resultados; exige confirmación explícita y luego recalcula la clasificación.
- No permitas eliminar una ronda intermedia mientras existan rondas posteriores.
- Finalizar el torneo requiere que no exista una ronda activa incompleta.
- Un torneo finalizado debe quedar en modo de solo lectura, pero el propietario puede reabrirlo mediante una confirmación explícita.

## Tamaño de mesas

- Cada mesa debe tener un mínimo de tres y un máximo de cuatro jugadores.
- Los torneos necesitan por lo menos seis jugadores activos.
- Para cada ronda, encuentra una combinación de mesas de tres y cuatro que asigne exactamente una vez a cada jugador activo.
- Siempre que existan varias combinaciones válidas, prioriza la que tenga la mayor cantidad posible de mesas de cuatro.
- Nunca crees mesas de uno, dos o cinco jugadores.

Ejemplos obligatorios:

| Jugadores activos | Distribución |
| ---: | --- |
| 6 | 3 + 3 |
| 7 | 4 + 3 |
| 8 | 4 + 4 |
| 9 | 3 + 3 + 3 |
| 10 | 4 + 3 + 3 |
| 11 | 4 + 4 + 3 |
| 12 | 4 + 4 + 4 |
| 13 | 4 + 3 + 3 + 3 |

Implementa esta lógica como una función pura, independiente de React y con pruebas unitarias.

## Emparejamiento de jugadores

### Primera ronda

- Mezcla aleatoriamente a todos los jugadores activos.
- Guarda una semilla o información equivalente para que una ronda ya creada no cambie al recargar la página.
- Asigna los jugadores a la distribución válida de mesas calculada anteriormente.

### Segunda ronda y posteriores

Genera las mesas usando estas prioridades, en este orden:

1. Asignar a todos los jugadores activos exactamente una vez.
2. Respetar mesas de tres o cuatro integrantes.
3. Minimizar la cantidad de enfrentamientos repetidos entre pares de jugadores.
4. Agrupar jugadores con puntuaciones totales iguales o cercanas.
5. Usar un desempate aleatorio reproducible cuando varias asignaciones tengan el mismo costo.

No basta con ordenar la tabla y partirla en grupos, porque eso puede repetir exactamente las mismas mesas. Implementa una función de costo para evaluar candidatos y una estrategia razonable de optimización, como múltiples mezclas con semilla y mejoras mediante intercambios. Documenta la estrategia y mantenla aislada para poder sustituirla más adelante.

Permite al organizador revisar las mesas antes de activar la ronda. En ese estado puede intercambiar manualmente dos jugadores entre mesas, siempre que todas las mesas sigan teniendo tres o cuatro participantes y ningún jugador aparezca dos veces. Una vez activada la ronda, las mesas quedan bloqueadas, salvo que el organizador use una acción explícita para volver al estado de borrador antes de registrar resultados.

## Registro de resultados

En cada mesa, el organizador debe registrar:

- Tipo de resultado: victoria normal o victoria por combo.
- Posición de cada jugador.
- Cantidad de kills de cada jugador, como entero igual o mayor que cero.
- Notas opcionales de la mesa.

Validaciones:

- En resultado normal, las posiciones deben ser únicas y consecutivas desde 1 hasta el tamaño de la mesa.
- En resultado por combo, debe existir exactamente un ganador. El ganador ocupa la primera posición; las demás posiciones se pueden registrar para conservar el orden, pero todos los no ganadores reciben la puntuación especial configurada para combo.
- No permitas guardar números negativos, posiciones duplicadas, jugadores faltantes ni resultados incompletos.
- Debe poder editarse el resultado de una mesa mientras el torneo no esté finalizado. Cualquier cambio debe actualizar la clasificación inmediatamente.
- Una ronda pasa a completada únicamente cuando todas sus mesas tienen resultados válidos.

## Clasificación y desempates

La clasificación debe recalcularse a partir de los resultados guardados. No mantengas dos fuentes de verdad que puedan quedar desincronizadas.

Muestra al menos:

- Posición general.
- Nombre.
- Puntos totales.
- Primeros lugares o victorias.
- Kills totales.
- Rondas jugadas.
- Fuerza de oponentes.

Orden de desempate:

1. Puntos totales.
2. Cantidad de victorias o primeros lugares.
3. Fuerza de oponentes, calculada y documentada de forma consistente a partir de los puntos acumulados por las personas contra las que jugó.
4. Kills totales.
5. Desempate aleatorio estable si todos los valores anteriores coinciden.

El desempate aleatorio debe ser estable: no debe cambiar cada vez que se renderiza o recarga la página.

## Pantallas y rutas

Implementa como mínimo:

- `/`: presentación breve y acciones para iniciar sesión o registrarse.
- `/login`: inicio de sesión.
- `/register`: registro del organizador.
- `/forgot-password`: recuperación de contraseña.
- `/dashboard`: torneos del organizador, separados por borrador, activos y finalizados.
- `/tournaments/new`: creación.
- `/tournaments/:id`: resumen del torneo.
- `/tournaments/:id/players`: administración de jugadores.
- `/tournaments/:id/rounds`: rondas y mesas.
- `/tournaments/:id/standings`: clasificación.
- `/tournaments/:id/settings`: reglas, cantidad de rondas, publicación y estado.
- `/t/:publicSlug`: vista pública de solo lectura con ronda actual, mesas y clasificación.

Puedes usar rutas anidadas para evitar duplicar el diseño del panel.

## Base de datos

Diseña una estructura relacional clara para representar como mínimo:

- Perfiles de organizadores vinculados a `auth.users`.
- Torneos y su propietario.
- Configuración de puntuación por torneo.
- Participantes.
- Rondas.
- Mesas o pods.
- Participantes asignados a las mesas.
- Resultados, posiciones, kills y tipo de victoria.

Incluye:

- Migraciones SQL versionadas dentro del repositorio.
- Claves foráneas, restricciones, índices y reglas de borrado coherentes.
- Restricciones únicas para impedir números de ronda repetidos, números de mesa repetidos dentro de una ronda y asignaciones duplicadas.
- Políticas RLS completas.
- Una estrategia atómica para acciones sensibles como cerrar resultados, borrar la última ronda y recalcular tras cambiar reglas. Usa funciones SQL/RPC cuando sea necesario para evitar estados parciales.
- Datos de demostración o un método documentado para crear un torneo de prueba, sin incluir usuarios ni secretos reales.

No expongas la clave `service_role` en el frontend. El cliente solo debe utilizar la URL pública de Supabase y la clave pública/anon correspondiente.

## Organización sugerida del código

La estructura exacta puede adaptarse al repositorio, pero separa claramente:

- Componentes reutilizables.
- Páginas y rutas.
- Contexto o estado de autenticación.
- Cliente y repositorios de Supabase.
- Tipos de dominio.
- Validaciones.
- Algoritmo de distribución de tamaños de mesa.
- Algoritmo de emparejamiento.
- Cálculo de puntos, clasificación y desempates.
- Pruebas.

Evita colocar toda la aplicación en `App.tsx`.

## Pruebas obligatorias

Agrega pruebas unitarias para:

- Rechazar torneos con menos de seis jugadores al generar la primera ronda.
- Todas las distribuciones de mesa mostradas en la tabla anterior y varios números mayores.
- Garantizar que cada jugador aparezca exactamente una vez por ronda.
- Evitar mesas fuera del rango de tres a cuatro personas.
- Puntuación normal configurable.
- Puntuación por combo configurable.
- Recalcular clasificación cuando cambia un resultado o una regla.
- Orden y estabilidad de todos los desempates.
- Agregar rondas y reducir únicamente rondas futuras.
- Impedir la eliminación de una ronda intermedia.
- Minimización de enfrentamientos repetidos en casos donde existe una solución mejor.

Agrega también pruebas de componentes para los flujos críticos de formularios y validaciones.

## Criterios de aceptación

La tarea solo está terminada cuando:

- Un organizador puede registrarse, entrar y salir.
- Puede crear un torneo con reglas de puntuación propias.
- Puede agregar al menos seis jugadores sin crearles cuentas.
- Puede generar, revisar y activar la primera ronda.
- Puede registrar resultados normales y por combo con kills.
- La clasificación se actualiza correctamente.
- La segunda ronda usa puntuación y antecedentes para reducir mesas repetidas.
- Puede añadir rondas al plan y quitar rondas futuras no generadas.
- Puede borrar de forma segura únicamente la última ronda generada con las confirmaciones correspondientes.
- Una recarga no elimina ni altera el torneo.
- Otro usuario autenticado no puede modificar el torneo.
- El enlace público permite consultar sin editar.
- La aplicación es utilizable en móvil.
- `npm run lint`, `npm test` y `npm run build` terminan correctamente.
- El README explica todos los pasos necesarios para que otra persona pueda ejecutar el proyecto.

## Entrega final

Al finalizar, resume:

1. Qué implementaste.
2. Qué archivos y migraciones son los más importantes.
3. Qué variables de entorno debo configurar.
4. Qué pasos debo realizar en Supabase.
5. Qué comandos ejecutaste para verificar el proyecto y sus resultados.
6. Cualquier limitación real pendiente, sin presentar funciones incompletas como terminadas.
