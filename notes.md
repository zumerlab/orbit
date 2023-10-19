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
- o-MODAL
- o-POPOVER
- o-PROGRESS
- o-KNOB
- o-pod
- o-orbit
- o-suborbit (mantiene mismo nivel de orbita que el orbit parent)
- o-orbiter
- o-pod (content inside orbiter)
- o-sector
- o-label





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
OK. adjuts size to view port  @media
OK? TEMA RADIAL SIZE. ADD AJUSTE MANUAL. add ajustes eslabonado?
OK. Visual css changes
ok: upper, lower... no anda en todos lados. Queda chequear scss ejemplo en arcgrid.



explicar y mejorear y diferecniar los progress.

o-progress
o-svg
o-svg-progress
o-knob

o-title o label?




### COSAS PARA DESPUES
titulos para orbiter y orbit
OK elipse usar container perspective para tener todo cool
OK alternativamente se puede pensar en orbit eliptical con orbinters aliptical usando sen y cos
OK GOEY EFFECT
data-o* para JS

CSS TYPES PARA ANIMAR (SOLO CHROME pero sale en breve en firefox)




TEXTO CURVO (JS)

OK separar el test como repo independiente para testeo local (y luego remoto as service con server less?)

los estilos en clases o las variables en clases?

EJEMPLOS:

BASICO de cada elementos para documentacion y testeo
o-container : 
multiple containers con diferentes tamaños

o-orbit y orbit orbit: 
dibujar orbits, y sus propiedades (pensar en eliminar los orbits lajanos en caso de responsive o algo asi)

o-orbiter: tamanos,nesting, geostationary, aligment. Falta CONTENT,  (+ OFFSET, LIMITS)

o-sector: borders, background, gaps, content (+ OFFSET, LIMITS), ORBIT NESTING, multiples sectors. remember  sector shapes

o-labels: FALTA METERLO EN SECTORS, angle, offset, connector

o-svg-progress: props, colors, percentaje

o-svg-markers: same above

o-progress: propr, colors

"o-knob": ver

o-modal/dialog: ver

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

diagrama de anillo, diagrama de cinturón y mapa de árbol radialp.

grafico de barras curvas

Este tipo de visualización muestra jerarquía a través de una serie de anillos que se cortan para cada nodo de categoría. Cada anillo corresponde a un nivel de jerarquía, con el círculo central representando el nodo raíz y la jerarquía moviéndose hacia fuera de él.

Los anillos se cortan y se dividen en función de su relación jerárquica con la porción primaria. El ángulo de cada porción se divide igualmente en su nodo primario o puede ser proporcionar a un valor.

Se puede utilizar color para resaltar las agrupaciones jerárquicas o las categorías específicas.



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