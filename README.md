# grid

## LAYOUT

### Radial Grid

- OK rows: rings OR orbits
- OK columns: sectors relates to angles. quadrants... cordinal points... > ARCS
- OK offset angle: importantes para saber desde donde empieza
- OK arc: importante para estabelcer tamano del arco 90° o 360° x ej. DESAMBIGUAR
- OK Reverse angle...
- OK orbit alignment> lower upper DEFAULT MIDDLE
- OK Stationary- geostationary/gyroscope: comportamiento de lo selementos
- OK draw rings and ARCS
- ~~Armar defaults~~
- ~~WIP armar progress en svg~~
- ~~FIX offset~~
- OK issue core.item angle
- OK? Rings. permitir que cada ring tenga su ---radio pueda ser cmabiada por el usuario. Default que sea como hasta ahora
- ARC BG:
  1. OK (FALTA TESTEO) los rings tienen z-index el mas arriba siempre es el mas cercano al centro. (ver cóm osolucionar... porque es al reves, quizas ya setar en el css un orden de 10 a core y de ahi para abajo, o teneinedo en cta nro de rings...ESto :)
  2. OK se crea un elemento con borde irrgulArc.
  3. OK se crea un :before con tamano del ring, pero con transformOrigin al centro
  4. OK se use un clip-path polygon y
  5. ~~OK un radial-gradient con hard stop al inicio de ring.~~
  6. border curvo irregular en surface
  7. ARCS como elemento independiente.
  <https://bennettfeely.com/clippy/>
  <https://9elements.github.io/fancy-border-radius/full-control.html#0.0.85.0-100.0.15.0-100.100>
  Juices
  <https://garden.bradwoods.io/notes/css/3d>
  <https://garden.bradwoods.io/notes/css/blend-modes>
- ~~ISSUE arc & arc-* same bug as items~~
- angles & distances, ETC: definir independientemte (a32; d453)? TAMBIEN SIZES
- responsiveness: crear dos versiones? media query & vh vw units? ...
-  layer para CONTENIDO ACOMODAR dentro de los items. Todo lo referido a alignment: ubicacion del elementos izq, centro, der; arriba medio, abajo qued aara el usuario o algo para armar especialemnte
- Abstraer variables de color, backgrpund etc
- separar grid, de otras cosas
- CHANGE NAMES AVOID CONFLICTS
- add manual overrride of items-n
- NEST ARCS 
- ITEMS AND ARCS HARMONIC

## ELEMENTS

- items: content containers with different #shapes flavor, #sizes, #aligment. Radial positioned. Nestable
  - shapes: circle, box, rounded box, blob
  - sizes: xxl, xl, l, m, s, xs, xxs
  - alignemnt: upper, lower, middle
- arcs: radial columns. visual support with basic interactivity and some cool customizations (gap, width, radius, POSITION). Should be nestable
- rings: radial rows. visual support. Nestable
- labels: item label with optional conector and predefined positions
- MODALS
- POPOVERS
- PROGRESS
- KNOB

## COMPONENTS
- progress casi OK
- knob casi OK
- ~~sectors svg~~ css arcs OK
- modals
- labels OK
- tooltips
- ARC TEXT

- cards
- buttons
- forms

## UTILITIES
LAS MINIMAS ARC TEXT

### css first

por eso elipsis solo andan en ffox
anim en chrome.
