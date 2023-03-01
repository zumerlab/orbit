# grid


## LAYOUT

### Radial Grid
- rows
- columns
- angles & distances
- span rows
- span cols
- initial angle
- diameter
- quadrants?
- geostationary/gyroscope
- responsiveness
- alignment

## ELEMENTS


## COMPONENTS
- progress
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
