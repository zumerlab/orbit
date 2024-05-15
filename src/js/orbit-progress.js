/*! 
## o-progress

`<o-progress>` is a standard web-component for rendering a radial progress bar. Just one o-progress can be used per orbit.
It has two elements: a progress bar and a background bar that show the max range progress bar can achieve.

o-progress has some special attributes and css variables to customize it:
  - Attribute `value`: To set a number that represents the progress bar value.
  - Attribute `max`: To set the max allowed `value`.
  - Attribute `bar-color`: To set a color for progress bar. Default `orange`
  - Attribute `bg-color`: To set a color for background bar. Default `transparent`
  - Attribute `shape`: To set a different endings looks. Currently, you can choose between `circle`, `arrow`, `slash`, `backslash` and `zigzag` shapes. Default `none`


  - Utility class `.range-*`: Default '360deg'
  - Utility class `.from-*`: Default '0deg'
  - Utility class `.grow-*x`: To increase `o-progress` height by multiplying orbit radius. Default '1x'
  - Utility class `.reduce-*`: To reduce `o-progress` height by reducing current orbit percentage. Default '100'
  - Utility class `.inner-orbit`: To place `o-progress` just below its orbit
  - Utility class `.outer-orbit`: To place `o-progress` just above its orbit
  - Utility class `.quarter-inner-orbit`: To place `o-progress` a 25% into its orbit.
  - Utility class `.quarter-outer-orbit`: To place `o-progress` a 25% outer its orbit.


  - CSS styles. You can customize `o-progress` by adding CSS properties to `o-progress path` 
  
**Important:** `<o-progress>` can only be used into `.orbit` or `.orbit-*`

### Usage

```html
<div class="orbit"> 
  <o-progress value="75" max="100" shape="circle" />
</div>
```
*/
export class OrbitProgress extends HTMLElement {
  connectedCallback() {
    this.update()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          this.update()
        }
      })
    })

    observer.observe(this, { attributes: true })
  }

  generateRandomString() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let randomString = '';
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      randomString += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      randomString += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    // Shuffle the string to randomize the order of letters and numbers
    randomString = randomString.split('').sort(() => Math.random() - 0.5).join('');
  
    return randomString;
  }
  
  update() {
    const {shape} = this.getAttributes()
    const randomId = this.generateRandomString()
    const svg = this.createSVGElement()
    if (shape !== 'none') {
      const defs = this.createDefs()
      const markerDefs = this.createMarker('head'+randomId, 'end');
      defs.appendChild(markerDefs);
      const markerDefs1 = this.createMarker('tail'+randomId, 'start');
      defs.appendChild(markerDefs1);
      svg.appendChild(defs)
    }
    const progressArc1 = this.createProgressArc(true, randomId)
    svg.appendChild(progressArc1)
    const progressArc = this.createProgressArc(false, randomId)
    svg.appendChild(progressArc)
    this.innerHTML = ''
    this.appendChild(svg)
  }

  createSVGElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 100 100')
    svg.setAttribute('width', this.getAttribute('width') || '100%')
    svg.setAttribute('height', this.getAttribute('height') || '100%')

    return svg
  }

  createProgressArc(full, randomId) {
    const progressArc = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    const {
      strokeWidth,
      realRadius,
      ellipseX,
      ellipseY,
      progressBarColor,
      progressBgColor,
      maxAngle,
      shape
    } = this.getAttributes()
    const angle = this.getProgressAngle(maxAngle, full)
    const { d } = this.calculateArcParameters(
      angle,
      realRadius,
      ellipseX,
      ellipseY
    )
    progressArc.setAttribute('d', d)
    progressArc.setAttribute(
      'stroke',
      full ? progressBgColor : progressBarColor
    )
    progressArc.setAttribute(
      'fill', 'transparent'
    )
    shape !== 'none' && progressArc.setAttribute('marker-end', `url(#head${randomId})`)
    shape !== 'none' && progressArc.setAttribute('marker-start', `url(#tail${randomId})`)
    progressArc.setAttribute('stroke-width', strokeWidth)
    full && progressArc.setAttribute('class', 'full')
    
    progressArc.setAttribute('vector-effect', 'non-scaling-stroke')
    return progressArc
  }

  getAttributes() {
    const orbitRadius = parseFloat(
      getComputedStyle(this).getPropertyValue('r') || 0
    )
    const range = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-range') || 360
    )
    const ellipseX = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-ellipse-x') || 1
    )
    const ellipseY = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-ellipse-y') || 1
    )
    const progress = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-progress') ||
      this.getAttribute('value') ||
      0
    )
    const shape = this.getAttribute('shape') || 'none'
    const progressBarColor = this.getAttribute('bar-color') || 'orange'
    const progressBgColor = this.getAttribute('bg-color') || 'transparent'
    const strokeWidth = parseFloat(
      getComputedStyle(this).getPropertyValue('stroke-width') || 1
    )
    let strokeWithPercentage = ((strokeWidth / 2) * 100) / orbitRadius / 2
    // default aligment at middle
    let innerOuter = strokeWithPercentage
    if (this.classList.contains('outer-orbit')) {
      innerOuter = strokeWithPercentage * 2
    }
    if (this.classList.contains('quarter-outer-orbit')) {
      innerOuter = strokeWithPercentage * 1.75
    }
    if (this.classList.contains('inner-orbit')) {
      innerOuter = 0
    }
    if (this.classList.contains('quarter-inner-orbit')) {
      innerOuter = strokeWithPercentage * 0.75
    }
    const realRadius = 50 + innerOuter - strokeWithPercentage
    const maxAngle = range // User-defined max angle
    return {
      orbitRadius,
      ellipseX,
      ellipseY,
      progress,
      progressBarColor,
      progressBgColor,
      strokeWidth,
      realRadius,
      maxAngle,
      shape
    }
  }

  getProgressAngle(maxAngle, full) {
    const progress = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-progress') ||
      this.getAttribute('value') ||
      0
    )
    const maxValue = parseFloat(this.getAttribute('max')) || 100 // User-defined max value
    return full ?
      ((maxValue - 0.00001) / maxValue ) * maxAngle
      : (progress / maxValue) * maxAngle
  }

  calculateArcParameters(angle, realRadius, ellipseX, ellipseY) {
    const radiusX = realRadius / ellipseX
    const radiusY = realRadius / ellipseY
    const startX = 50 + radiusX * Math.cos(-Math.PI / 2)
    const startY = 50 + radiusY * Math.sin(-Math.PI / 2)
    const endX = 50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180)
    const endY = 50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180)
    const largeArcFlag = angle <= 180 ? 0 : 1
    const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`
    return { startX, startY, endX, endY, largeArcFlag, d }
  }

  createDefs() {
    // Create <defs> element
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    return defs;
  }

  createMarker(id, position = 'end') {
    const {
      shape
    } = this.getAttributes()
    // Create <marker> element
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('viewBox', '0 0 10 10');
    position === 'start' && shape !== 'circle' ? marker.setAttribute('refX', '2'):
    position === 'start' && shape === 'circle' ? marker.setAttribute('refX', '5'):
    marker.setAttribute('refX', '0.1')
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '1');
    marker.setAttribute('markerHeight', '1');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth')
    marker.setAttribute('fill', 'context-stroke' )

    // Create <path> element inside <marker>
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const shapes = {
      arrow: {
        head: 'M 0 0 L 2 5 L 0 10 z',
        tail: 'M 2 0 L 0 0 L 1 5 L 0 10 L 2 10 L 2 5 z'
      },
      slash: {
        head: 'M 0 0 L 0 0 L 1 5 L 2 10 L 0 10 L 0 5 z',
        tail: 'M 2 0 L 0 0 L 1 5 L 2 10 L 2 10 L 2 5 z'
      },
      backslash: {
        head: 'M 0 0 L 2 0 L 1 5 L 0 10 L 0 10 L 0 5 z',
        tail: 'M 2 0 L 2 0 L 1 5 L 0 10 L 2 10 L 2 5 z'
      },
      circle: {
        head: 'M 0 0 C 7 0 7 10 0 10 z',
        tail: 'M 6 0 C -1 0 -1 10 6 10 z'
      },
      zigzag: {
        head: 'M 1 0 L 0 0 L 0 5 L 0 10 L 1 10 L 2 7 L 1 5 L 2 3 z',
        tail: 'M 0 0 L 2 0 L 2 5 L 2 10 L 0 10 L 1 7 L 0 5 L 1 3 z'
      }
    }
    position === 'end' ? path.setAttribute('d', shapes[shape].head) :
      path.setAttribute('d', shapes[shape].tail)

    marker.appendChild(path);

    return marker
  }
}
