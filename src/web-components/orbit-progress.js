/*! 
## o-progress

`<o-progress>` is a standard web-component for rendering a radial progress bar. 
It has a progress bar and a range bar.

It has some special attributes and css variables to customize it:
  - Attribute `value`: To set a number that represents the progress bar value.
  - Attribute `max`: To set the max allowed `value`.
  - Attribute `bar-color`: To set a color for progress bar. Default `orange`
  - Attribute `bg-color`: To set a color for range bar. Default `transparent`

  - Class `.rounded`: to set ending caps. Default 'butt'
  - Class utility `.range-*`: Default '360deg'
  - Class utility `.begint-at-*`: Default '0deg'
  - Class utility `.inner`: To place `o-progress` at a "low-orbit". Default midle-orbit
  - Class utility `.outer`: To place `o-progress` at a "high-orbit". Default midle-orbit

  - CSS styles. User can customize `o-progress` by adding CSS properties to `o-progress path` 
  
**Important:** `<o-progress>` can only be used into `.orbit` or `.orbit-*`

### Usage

```html
<div class="orbit"> 
  <o-progress value="75" max="100" class="rounded" />
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

  update() {
    const svg = this.createSVGElement()
    const progressArc1 = this.createProgressArc(true)
    svg.appendChild(progressArc1)
    const progressArc = this.createProgressArc()
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

  createProgressArc(full) {
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
      lineCap,
      maxAngle
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
    progressArc.setAttribute('stroke-width', strokeWidth)
    progressArc.setAttribute('fill', 'transparent')
    progressArc.setAttribute('stroke-linecap', lineCap)
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
    const lineCap =
      getComputedStyle(this).getPropertyValue('--o-linecap') || 'butt'
    const ellipseX =
      getComputedStyle(this).getPropertyValue('--o-ellipse-x') || 1
    const ellipseY =
      getComputedStyle(this).getPropertyValue('--o-ellipse-y') || 1
    const progress = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-progress') ||
        this.getAttribute('value') ||
        0
    )
    const progressBarColor = this.getAttribute('bar-color') || 'orange'
    const progressBgColor = this.getAttribute('bg-color') || 'transparent'
    const strokeWidth = parseFloat(
      getComputedStyle(this).getPropertyValue('stroke-width') || 1
    )
    let strokeWithPercentage = ((strokeWidth / 2) * 100) / orbitRadius / 2
    // default aligment at middle
    let innerOuter = strokeWithPercentage
    if (this.classList.contains('outer')) {
      innerOuter = strokeWithPercentage * 2
    }
    if (this.classList.contains('inner')) {
      innerOuter = 0
    }
    const realRadius = 50 + innerOuter - strokeWithPercentage
    const maxAngle = range // User-defined max angle
    return {
      orbitRadius,
      lineCap,
      ellipseX,
      ellipseY,
      progress,
      progressBarColor,
      progressBgColor,
      strokeWidth,
      realRadius,
      maxAngle
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
        ((maxValue - 1) / maxValue) * maxAngle
      : (progress / maxValue) * maxAngle // Calculate angle based on progress and user-defined max angle
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
}
