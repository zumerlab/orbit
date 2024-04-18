function calcularExpresionCSS(cssExpression) {
  const match = cssExpression.match(/calc\(\s*([\d.]+)deg\s*\/\s*\(\s*(\d+)\s*-\s*(\d+)\s*\)\s*\)/);
  if (match) {
      const value = parseFloat(match[1]);
      const divisor = parseInt(match[2]) - parseInt(match[3]);
      if (!isNaN(value) && !isNaN(divisor) && divisor !== 0) {
          return value / divisor;
      }
  }
}


/*! 
## o-sector

`<o-sector>` is a standard web-component for rendering a radial slices or pies. 
By default there are 24 sector per orbit. The number can be modify with `$max-orbiters` var at `_variables.scss`.

It has some special attributes and css variables to customize it:
  - Attribute `sector-color`: To set a color for sector. Default `orange`

  - Class `.gap-*` applied on `.orbit` or `.orbit-*` or in `<o-sector>`: to set gap space. Default '0'
  - Class utility `.range-*` applied on `.orbit` or `.orbit-*`: Default '360deg'
  - Class utility `.from-*` applied on `.orbit` or `.orbit-*`: Default '0deg'
  - Class utility `.inner-orbit`: To place `o-sector` just below its orbit
  - Class utility `.outer-orbit-orbit`: To place `o-sector` just above its orbit

  - CSS styles. User can customize `o-sector` by adding CSS properties to `o-sector path`
  
**Important:** 

  - `<o-sector>` can only be used into `.orbit` or `.orbit-*`.
  - `<o-sector>` doesn't support ellipse shape. See `.orbit` section for more information.

### Usage

```html
<div class="orbit range-180"> 
  <o-sector />
  <o-sector class="gap-5" />
  <o-sector class="gap-10" />
  <o-sector class="gap-5" />
</div>
```
*/

export class OrbitSector extends HTMLElement {
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
    const sectorArc = this.createSectorArc()
    svg.appendChild(sectorArc)
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

  createSectorArc() {
    const sectorArc = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    const { strokeWidth, realRadius, sectorColor, gap } = this.getAttributes()
    const angle = this.calculateAngle()
    const { d } = this.calculateArcParameters(angle, realRadius, gap)
    sectorArc.setAttribute('d', d)
    sectorArc.setAttribute('stroke', sectorColor)
    sectorArc.setAttribute('stroke-width', strokeWidth)
    sectorArc.setAttribute('fill', 'transparent')
    sectorArc.setAttribute('vector-effect', 'non-scaling-stroke')

    return sectorArc
  }

  getAttributes() {
    const orbitRadius = parseFloat(
      getComputedStyle(this).getPropertyValue('r') || 0
    )
   
    const gap = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-gap') || 0.001
    )
    const sectorColor = this.getAttribute('sector-color') || '#00ff00'
    const rawAngle = getComputedStyle(this).getPropertyValue('--o-angle')
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
    const sectorAngle = calcularExpresionCSS(rawAngle)
    console.log(sectorAngle)
    
    return {
      orbitRadius,
      strokeWidth,
      realRadius,
      sectorColor,
      gap,
      sectorAngle
    }
  }

  calculateAngle() {
    const { sectorAngle, gap } = this.getAttributes()
    return sectorAngle - gap
  }

  calculateArcParameters(angle, realRadius, gap) {
    const radiusX = realRadius / 1
    const radiusY = realRadius / 1
    const startX = 50 + gap + radiusX * Math.cos(-Math.PI / 2)
    const startY = 50 + radiusY * Math.sin(-Math.PI / 2)
    const endX = 50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180)
    const endY = 50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180)
    const largeArcFlag = angle <= 180 ? 0 : 1
    const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`
    return { startX, startY, endX, endY, largeArcFlag, d }
  }
}
