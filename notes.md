OK rows: rings OR orbits
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
- OK Rings. permitir que cada ring tenga su ---radio pueda ser cmabiada por el usuario. Default que sea como hasta ahora
- ARC BG:
  1. OK (FALTA TESTEO) los rings tienen z-index el mas arriba siempre es el mas cercano al centro. (ver cóm osolucionar... porque es al reves, quizas ya setar en el css un orden de 10 a core y de ahi para abajo, o teneinedo en cta nro de rings...ESto :)
  2. OK se crea un elemento con borde irrgulArc.
  3. OK se crea un :before con tamano del ring, pero con transformOrigin al centro
  4. OK se use un clip-path polygon y
  5. ~~OK un radial-gradient con hard stop al inicio de ring.~~
  6. OK ARCS como elemento independiente.
  <https://bennettfeely.com/clippy/>
  <https://9elements.github.io/fancy-border-radius/full-control.html#0.0.85.0-100.0.15.0-100.100>
  Juices
  <https://garden.bradwoods.io/notes/css/3d>
  <https://garden.bradwoods.io/notes/css/blend-modes>
- ~~ISSUE arc & arc-* same bug as items~~
- NOT NOW angles & distances, ETC: definir independientemte (a32; d453)? TAMBIEN SIZES
- responsiveness: crear dos versiones? media query & vh vw units? ...
-  layer para CONTENIDO ACOMODAR dentro de los items. Todo lo referido a alignment: ubicacion del elementos izq, centro, der; arriba medio, abajo qued aara el usuario o algo para armar especialemnte
- OK Abstraer variables de color, backgrpund etc
- WIP separar grid, de otras cosas
- WIP CHANGE NAMES AVOID CONFLICTS
- add manual overrride of items-n
- OK NEST ARCS 
- ITEMS AND ARCS HARMONIC

*******
- OK Separar css custom flavor de css radial stuff (para que se pueda usar con otros css frameworks facil)
- Terminar modal
- Terminar popover o usar labels
- Incluir opcion de translateZ by default en el core
- js arc text (dsp?)
- OK ADAPTAR ARC A RINGS
- NOP arcs as shapes with contenido???? ver
- OK svg? SIP ADAPTAR A RINGS
- OK REPLICAR MODELO DE SVG PERCENT. DESCARGAR LO SCAMBIOS A VARIABLES NO A TODO EL ELEMENTO
- CASI OK Armonizar toda la libreria 
- Documentar en .md
- Invitar a repo cerrado
- Landing & Docs con Docusaurus
*******

## ELEMENTS

- items: content containers with different #shapes flavor, #sizes, #aligment. Radial positioned. Nestable
  - shapes: circle, box, rounded box, blob
  - sizes: xxl, xl, l, m, s, xs, xxs
  - alignemnt: upper, lower, middle
- arcs: radial columns. visual support with basic interactivity and some cool customizations (gap, width, radius, POSITION). Should be nestable
- rings: radial rows. visual support. Nestable
- labels: item label with optional conector and predefined positions
- zr-MODAL
- zr-POPOVER
- zr-PROGRESS
- zr-KNOB
- zr-docker
- zr-orbit
- zr-suborbit (mantiene mismo nivel de orbita que el orbit parent)
- zr-orbiter
- zr-pod (content inside orbiter)
- zr-sector
- zr-label





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

### COSAS PARA AHORA
TITULOS // LABELS PARA ORBITS
.CONTENT NO RADIAL GRID
.PROGRESS
.KNOB: asegurar que el selector queda enmedio del grosos del progress seria lower by deafult
.MARKERS
OK .CORE .... AJUSTAR. HAY QUE VER VARIOS TEMAS: SI HAY UN SOLO ORBITER, SI HAY MAS...
OK ver temas de z-index.... ESTA BIEN ASI
. margin 0 issue
OK. adjuts size to view port  @media
OK? TEMA RADIAL SIZE. ADD AJUSTE MANUAL. add ajustes eslabonado?
OK. Visual css changes
BUG: upper, lower... no anda en todos lados ej watch


### COSAS PARA DESPUES
ELIPSES USANDO COS SIN (SOLO EN FFOX)
CSS TYPES PARA ANIMAR (SOLO CHROME)
GOEY EFFECT
TEXTO CURVO (JS)
data-* para JS
