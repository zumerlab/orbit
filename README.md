# grid


## LAYOUT

### Radial Grid
- rows: Son rings o levels
- columns: sectors
- angles & distances: se pueden definir independientemte (a32; d453)
- initial angle: importantes para saber desde donde empieza
- diameter: importante para estabelcer tamano del arco 90° o 360° x ej.
- quadrants? una forma de ubicar elementis: q1, q2... 
- geostationary/gyroscope: comportamiento de lo selementos
- responsiveness: con media queries
- alignment: ubicacion del elementos izq, centro, der; arriba medio, abajo
- distribucion: ver tipo flex-bos
- draw rings and sectors

## ELEMENTS


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


### css first
por eso elipsis solo andan en ffox
anim en chrome.
