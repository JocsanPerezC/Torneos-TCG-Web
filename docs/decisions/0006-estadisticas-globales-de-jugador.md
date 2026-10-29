# ADR 0006: estadísticas globales de jugador

- Estado: aceptada
- Fecha: 2026-10-28

## Decisión

El historial global de una cuenta `player` se entrega mediante la RPC `get_my_player_statistics()`. La función usa exclusivamente `auth.uid()` para localizar inscripciones con `players.profile_id`, agrega torneos, rondas, resultados, puntos y kills, y calcula los podios al clasificar torneos finalizados o que ya completaron todas sus rondas planificadas con las mismas reglas de la tabla de posiciones.

## Consecuencias

- El cliente no lee resultados de otros participantes para calcular el historial.
- Las inscripciones manuales (`profile_id` nulo) no tienen estadísticas globales.
- La ruta autenticada `/estadisticas` solo se presenta a cuentas con rol `player`.
