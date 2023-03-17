# grid


## LAYOUT

### Radial Grid

- OK rows: rings OR orbits
- columns: sectors relates to angles. quadrants... cordinal points...
- angles & distances: definir independientemte (a32; d453)?
- OK initial angle: importantes para saber desde donde empieza
- OK arc: importante para estabelcer tamano del arco 90° o 360° x ej.
- OK Reverse angle...
- OK orbit alignment> lower upper
- OK Stationary- geostationary/gyroscope: comportamiento de lo selementos
- responsiveness: crear dos versiones? media query & vh vw units? ...
- dentro de los items ver alignment: ubicacion del elementos izq, centro, der; arriba medio, abajo
- OK draw rings and sectors
- Armar defaults
- Abstraer variables de color, backgrpund etc
- separar grid, de otras cosas
- armar progress en svg
- 

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


### css first
por eso elipsis solo andan en ffox
anim en chrome.
