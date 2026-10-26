# Sistema de diseño

## Propósito

Esta guía conserva la identidad de Torneos TCG al diseñar o modificar pantallas. La interfaz debe sentirse lúdica, clara y orientada a administrar torneos sin perder legibilidad en datos densos.

## Principios

- Prioriza información de torneo, acciones claras y tablas legibles.
- Mantén una sola acción primaria visible por contexto.
- Usa detalles juguetones con moderación; la información debe dominar sobre la decoración.
- Reutiliza patrones existentes antes de introducir componentes, colores o efectos nuevos.

## Fundamentos visuales

| Elemento                 | Uso                                                 |
| ------------------------ | --------------------------------------------------- |
| Fondo                    | Crema `#FCFAEC` con el patrón `edh-bg-pattern.svg`. |
| Superficies              | Blanco cálido `#FFFFFF` para tarjetas y secciones.  |
| Texto y bordes           | Negro suave `#111111`.                              |
| Acción principal         | Verde `#21B876`.                                    |
| Navegación e información | Azul `#3D5AFB`.                                     |
| Superficie secundaria    | Crema grisácea `#F2F0E5`.                           |
| Estados apagados         | Gris cálido `#6B675C`.                              |
| Bordes suaves            | `#E7E2D2`.                                          |
| Acción destructiva       | Rojo `#C1272D`.                                     |
| Acento excepcional       | Violeta `#5B1FE0`.                                  |

La tipografía base es **Fredoka**. Combina esquinas redondeadas ligeramente irregulares, bordes oscuros de 1.5–2 px y sombras cortas desplazadas. No conviertas esos elementos en un efecto pesado.

## Componentes y estados

- Reutiliza `Button`, `Modal`, `LanguageSelector` y las clases compartidas, como `.app-button`, antes de crear equivalentes.
- Las acciones primarias usan verde; las secundarias, una superficie clara con borde; las peligrosas, rojo.
- Usa azul para navegación, selección e información breve, no para competir con la acción primaria.
- Un estado deshabilitado debe verse inactivo y conservar una explicación si la razón no es evidente.
- Las animaciones deben ser breves y opcionales; respeta `prefers-reduced-motion`.

## Diseño responsive y accesible

- Diseña desde 320 px de ancho y evita depender de una vista de escritorio.
- En pantallas pequeñas, apila controles sin ocultar acciones esenciales ni forzar desplazamiento horizontal innecesario.
- Conserva foco visible, navegación por teclado, objetivos táctiles cómodos, etiquetas accesibles y contraste suficiente.
- Los iconos decorativos son `aria-hidden`; los iconos interactivos requieren nombre accesible.

## Contenido e idiomas

- Todo texto visible nuevo debe incorporarse en español e inglés mediante `src/i18n.ts`.
- Prefiere etiquetas breves y directas, especialmente en botones y controles de torneo.
- No codifiques textos de interfaz directamente en componentes cuando exista el sistema de traducciones.

## Evitar

- Fuentes nuevas, gradientes genéricos, glassmorphism o un rediseño global sin aprobación explícita.
- Nuevos valores de color, espaciado o radios cuando un token o patrón existente resuelva el caso.
- Cambios visuales en rutas no activas o implementaciones paralelas.
