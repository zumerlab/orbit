# grid

## LAYOUT

### Radial Grid

- OK rows: rings OR orbits
- columns: sectors relates to angles. quadrants... cordinal points... > ARCS
- angles & distances: definir independientemte (a32; d453)?
- OK initial angle: importantes para saber desde donde empieza
- OK arc: importante para estabelcer tamano del arco 90° o 360° x ej.
- OK Reverse angle...
- OK orbit alignment> lower upper
- OK Stationary- geostationary/gyroscope: comportamiento de lo selementos
- responsiveness: crear dos versiones? media query & vh vw units? ...
- OK layer para contenido dentro de los items. Todo lo referido a alignment: ubicacion del elementos izq, centro, der; arriba medio, abajo qued aara el usuario o algo para armar especialemnte
- OK draw rings and sectors
- ~~Armar defaults~~
- Abstraer variables de color, backgrpund etc
- separar grid, de otras cosas
- WIP armar progress en svg
- ~~FIX offset~~
- CHANGE NAMES
- OK issue core.item angle
- add manual overrride of items-n
- OK? Rings. permitir que cada ring tenga su ---radio pueda ser cmabiada por el usuario. Default que sea como hasta ahora
- ARC BG:
  1. OK (FALTA TESTEO) los rings tienen z-index el mas arriba siempre es el mas cercano al centro. (ver cóm osolucionar... porque es al reves, quizas ya setar en el css un orden de 10 a core y de ahi para abajo, o teneinedo en cta nro de rings...ESto :)
  2. OK se crea un elemento con borde irrgulArc.
  3. OK se crea un :before con tamano del ring, pero con transformOrigin al centro
  4. OK se use un clip-path polygon y
  5. ~~OK un radial-gradient con hard stop al inicio de ring.~~
  5. border curvo irregular en surface
  6. ARCS como elemento independiente.

  https://bennettfeely.com/clippy/
  https://9elements.github.io/fancy-border-radius/full-control.html#0.0.85.0-100.0.15.0-100.100


## ELEMENTS

- shapes

## COMPONENTS

- progress
- sectors svg
- modals
- labels
- tooltips
- cards
- buttons
- forms

## UTILITIES

```js
function getEllipsePoints(width, height, n, dist) {
  const a = width / 2;
  const b = height / 2;
  const points = [];
  for (let i = 1; i <= n; i++) {
    const angle = (360 / n) * i;
    const radians = angle * (Math.PI / 180);
    const x = a * Math.cos(radians) + dist;
    const y = b * Math.sin(radians) + dist;
    console.log('angle', angle, 'radians', radians, 'xy', x,y)
    points.push({ x, y });
  }
  return points;
}

@property --angle {
  syntax: "<number>";
  initial-value: 1;
  inherits: false;
}

@keyframes progress {
  50% {
    --angle: 360;
  }
}

.item, .label__text, .label__conector {
  animation: 16s progress infinite;
}

article::before {
  content: attr(data-parent);
}

You can also use the attribute selectors in CSS to change styles according to the data:

article[data-columns="3"] {
  width: 400px;
}
article[data-columns="4"] {
  width: 600px;
}
```

### css first

por eso elipsis solo andan en ffox
anim en chrome.
