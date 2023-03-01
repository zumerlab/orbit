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



function getEllipsePoints(width, height, n) {
  const a = width / 2;
  const b = height / 2;
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (360 / n) * i;
    const radians = angle * (Math.PI / 180);
    const x = a * Math.cos(radians);
    const y = b * Math.sin(radians);
    points.push({ x, y });
  }
  return points;
}
