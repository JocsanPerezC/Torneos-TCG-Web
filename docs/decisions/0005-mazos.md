# ADR 0005: mazos

- Estado: aceptada
- Fecha: 2026-11-02

## Enlaces de Moxfield o Archidekt, no listas importadas

### Decisión

"Mis mazos" (`/mazos`, tabla `decks` con RLS por dueño) guarda el **enlace** del mazo, su nombre y, opcionalmente, el comandante. No se lee ni se copia la lista de cartas: Moxfield no tiene una API pública y sus accesos no oficiales se bloquean o cambian sin aviso. Solo se aceptan enlaces de mazo de `moxfield.com/decks/<id>` y `archidekt.com/decks/<número>`; `src/lib/deckValidation.ts` los valida y normaliza, y la base repite la regla con un `CHECK`.

### Consecuencias

- La lista completa se consulta en el sitio de origen con "Ver en Moxfield" o "Ver en Archidekt".
- Si en el futuro se quiere importar la lista, Archidekt tiene una API pública; Moxfield requeriría pedir acceso.

## Comandante desde Scryfall, en el navegador

### Decisión

El comandante se busca con la API pública de Scryfall directamente desde el navegador (`src/lib/scryfall.ts`), sin clave ni backend propio: permite CORS y no requiere autenticación. La búsqueda espera a que se deje de escribir (300 ms) para respetar su límite de solicitudes. Del resultado se guardan el nombre, la URL del recorte de arte (`art_crop`) y la identidad de color en orden WUBRG.

### Consecuencias

- El arte se sirve desde los servidores de Scryfall; si cambian la URL, la tarjeta muestra el reverso genérico.
- Si Scryfall no responde, el mazo se puede guardar igual, sin comandante.

## "Foto" del mazo en cada inscripción

### Decisión

Elegir un mazo para un torneo es opcional y lo hace el propio jugador con la RPC `set_my_tournament_deck`, que solo acepta mazos propios en torneos donde está inscrito. En vez de enlazar al mazo, copia sus datos en la inscripción (`players.deck_name`, `deck_url`, `deck_commander`, `deck_commander_image`, `deck_colors`; `deck_id` queda como referencia con `ON DELETE SET NULL`). Se puede cambiar hasta que empieza la primera ronda (`tournament_deck_locked`), y la base lo rechaza después.

### Consecuencias

- El historial de un torneo muestra con qué se jugó ese día, aunque luego el mazo se edite o se borre.
- El organizador no elige ni cambia el mazo de un jugador; los participantes manuales no tienen mazo.
- La vista pública expone el mazo de cada jugador (sin su id interno), igual que su nombre y su foto.
