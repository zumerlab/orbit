- OK rows: rings OR orbit
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
- ~~ISSUE arc & arc-\* same bug as items~~
- NOT NOW angles & distances, ETC: definir independientemte (a32; d453)? TAMBIEN SIZES
- responsiveness: crear dos versiones? media query & vh vw units? ...
- layer para CONTENIDO ACOMODAR dentro de los items. Todo lo referido a alignment: ubicacion del elementos izq, centro, der; arriba medio, abajo qued aara el usuario o algo para armar especialemnte
- OK Abstraer variables de color, backgrpund etc
- WIP separar grid, de otras cosas
- WIP CHANGE NAMES AVOID CONFLICTS
- add manual overrride of items-n
- OK NEST ARCS
- ITEMS AND ARCS HARMONIC

---

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

---

## ELEMENTS

- items: content containers with different #shapes flavor, #sizes, #aligment. Radial positioned. Nestable
  - shapes: circle, box, rounded box, blob
  - sizes: xxl, xl, l, m, s, xs, xxs
  - alignemnt: upper, lower, middle
- arcs: radial columns. visual support with basic interactivity and some cool customizations (gap, width, radius, POSITION). Should be nestable
- rings: radial rows. visual support. Nestable
- labels: item label with optional conector and predefined positions
- MODAL
- POPOVER
- PROGRESS
- KNOB
- pod
- orbit
- suborbit (mantiene mismo nivel de orbita que el orbit parent)
- orbiter
- pod (content inside orbiter)
- sector
- label

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

OK. mejorar labels para orbiters
OK.CONTENT para sector y orbiters
ok .PROGRESS
.KNOB: asegurar que el selector queda enmedio del grosos del progress seria lower by deafult
ok .svg-markers
OK .CORE .... AJUSTAR. HAY QUE VER VARIOS TEMAS: SI HAY UN SOLO ORBITER, SI HAY MAS...
OK ver temas de z-index.... ESTA BIEN ASI
ok . margin 0 issue
OK. adjuts size to view port @media
OK? TEMA RADIAL SIZE. ADD AJUSTE MANUAL. add ajustes eslabonado?
OK. Visual css changes
ok: upper, lower... no anda en todos lados. Queda chequear scss ejemplo en arcgrid.

explicar y mejorear y diferecniar los progress.

progress
svg
svg-progress
knob

title o label?

### COSAS PARA DESPUES

titulos para orbiter y orbit
OK elipse usar container perspective para tener todo cool
OK alternativamente se puede pensar en orbit eliptical con orbinters aliptical usando sen y cos
OK GOEY EFFECT
data-o\* para JS

agrgar vas vars que incidan sobre las vars de los compoenentes cmo en sector
pensar en mejores nombres de variables.
pensar en span sectors...
mas orbits..

CSS TYPES PARA ANIMAR (SOLO CHROME pero sale en breve en firefox)

TEXTO CURVO (JS)

OK separar el test como repo independiente para testeo local (y luego remoto as service con server less?)

los estilos en clases o las variables en clases?

EJEMPLOS:

BASICO de cada elementos para documentacion y testeo
container :
multiple containers con diferentes tamaños

orbit y orbit orbit:
dibujar orbits, y sus propiedades (pensar en eliminar los orbits lajanos en caso de responsive o algo asi)

orbiter: tamanos,nesting, geostationary, aligment. Falta CONTENT, (+ OFFSET, LIMITS)

sector: borders, background, gaps, content (+ OFFSET, LIMITS), ORBIT NESTING, multiples sectors. remember sector shapes

labels: FALTA METERLO EN SECTORS, angle, offset, connector

svg-progress: props, colors, percentaje

svg-markers: same above

progress: propr, colors

" knob": ver

modal/dialog: ver

custom vars: explanation / data-o-

0content as utilities

MENU RADIAL SIMPLE y COMPLEJO
simple es un par de sectores con iconos control volumen, complejo es con varios orbits y sectores control playlista?

SELECTOR DE COLORES
un progress con colores y escalas con varios orbits...

CALENDARIO
fecha al centro y aano; mes; dia. Que gire....

ORGANIZACION DE TIEMPO
ver esos esquemas raros

RELOG ANALOGICO

DATA VIS CON SECTORES

ROSA DE NOTHINGALE

CLASSIC PIE

BARRAS RADIALES

RAYOS DE SOL

SIMON GAME?
seh

INDICADORes
instrumentales raduales

PANEL DE CONTROL
ver

INFOGRAFIA RADIAL
con labels

SIMULADOR ECOSISTEMA/SOLAR
sep

BUG

CORE.... borrar? no anda core/orbiter.

CORE: ELIMINAR, USAR ORBIT ZERO Y que sirva pra todas las orbitas

offset y limit ampliar valores

rotation ampliar angulos

sectors... pensar en un nest

nombres... elimnar prefijossss

orbit size cambiar nombre

penssar en algo tipo span sectors, orbiters

// Define the custom SVG progress bar element
// todos: componente sector tiene que tener posibilidad de bordes. acomoder el angulo inicial que esta en -90
// OK aramr un componentes de progress.
// satelite... up and low tangential
// comoentes... up/center/low?
// OK orbit -ratios
// OK armar class vector
// OK usar nth type para evitar conflictos. OJO ERROR EN ORBIT HAS
// USAR ESBUILD para el bundle de cwc y sass. OK probar luego
// trabajar en los satelittes NO
// curved text component
// label component
// pesnar el tema de los sector/ progress con medidas desiguales para ponner el sunburst charts
// SEPARAR BASE DE STILO
//
// mostrar cada estado de cada elemento posible en los docs, chiquito minimalista
// armar templates para descargar con $
// - graficos: sunburst/pie/donut/gauges/rose
// - knobs
// - futurist
// - menu
// - mandalas
//
//
//


### TODO
* Fix orbit-0 ok by adding ortbit-nth 0.1  OK
* Add center position for vector, satellite  OK
* Add .ccv for all orbit child ok
* correjir sector y progress ok
* add content radial aligment y 
  * hacerlo rsponsive llegado el caso al espacio.. ver esto no esta bien del todo
= add slot content para w-c NO HACE X AHORA XQ SE CUBRE CON SATELLITE O TEXT
* CORREJIR ALINEACION TODO DESDE 0 A LAS 12 OK
* probar sacar cambio de tamano en nested xq confunde mucho. ok
* arreglar lenght.... para que sea responsive.. OK con una funcion
* UN COMPOENENT DE TEXTO CURVO WIP.  text size and color from class style. 
* eliminar sttributos innecsarios hacerlosmasstndars para progres y sector tb
* bug no gap when one sector/text. 
* bug alineacion gaps ... 180 on mas de un sector/ o-label
* separar vector de constellation... o vector to spoke / vector.is-poligon to segment
* ornit-nth cambiar nombre
* resize orbit as optional function.
* trabajar con spoke as container... tiene que alinearse siempre a la mitad asi, si tiene una imagen dentro queda alineada tambien.
* add rules to support chek
* add gooey
* textLength y space. 
* el gap en label no anda super duper con texto invertido
* agregar quarters a secto, label, progress
* dar vuelta texto camniando 1 por 0.. meterlo en function
* ver orbit reduce que no anda del todo bien , tmpoco en label
* a los sectors y progress ver de meter otras linecaps tipo >
- ver algop ara labels... tipo https://www.benchling.com/
* reset styles to avoid conflcits
- create basic theme
* volver a chequear documentacion
