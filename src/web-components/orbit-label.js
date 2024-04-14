function calcularExpresionCSS(cssExpression) {
  const match = cssExpression.match(/calc\(([\d.]+)(deg)\s*\/\s*(\d+)\)/)
  if (match) {
    const value = parseFloat(match[1])
    const unit = match[2]
    const divisor = parseInt(match[3])
    if (unit === 'deg' && divisor >= 1 && divisor <= 12) {
      return value / divisor
    }
  }
}

/*! 
## o-text

`<o-text>` is a standard web-component for rendering a radial slices or pies. 
By default there are 24 sector per orbit. The number can be modify with `$max-orbiters` var at `_variables.scss`.

It has some special attributes and css variables to customize it:
  - Attribute `sector-color`: To set a color for sector. Default `orange`

  - Class `.gap-*` applied on `.orbit` or `.orbit-*` or in `<o-text>`: to set gap space. Default '0'
  - Class utility `.range-*` applied on `.orbit` or `.orbit-*`: Default '360deg'
  - Class utility `.from-*` applied on `.orbit` or `.orbit-*`: Default '0deg'
  - Class utility `.inner-orbit`: To place `o-text` just below its orbit
  - Class utility `.outer-orbit-orbit`: To place `o-text` just above its orbit

  - CSS styles. User can customize `o-text` by adding CSS properties to `o-text path`
  
**Important:** 

  - `<o-text>` can only be used into `.orbit` or `.orbit-*`.
  - `<o-text>` doesn't support ellipse shape. See `.orbit` section for more information.

### Usage

```html
<div class="orbit range-180"> 
  <o-text />
  <o-text class="gap-5" />
  <o-text class="gap-10" />
  <o-text class="gap-5" />
</div>
```
*/

export class OrbitLabel extends HTMLElement {
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
    const svg = this.createSVGElement();
    const pathId = `o-${Math.random().toString(36).substr(2, 9)}`;
    const path = this.createPathElement(pathId);
    const text = this.createTextPath(pathId);

    svg.appendChild(path);
    svg.appendChild(text);
    
    this.innerHTML = '';
    this.appendChild(svg);
}




  createSVGElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 100 100')
    svg.setAttribute('width', this.getAttribute('width') || '100%')
    svg.setAttribute('height', this.getAttribute('height') || '100%')
    return svg
  }
  createPathElement(pathId) {
    const path = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    const { strokeWidth,realRadius,sectorColor, gap } = this.getAttributes()
    const angle = this.calculateAngle()
    const { d } = this.calculateArcParameters(angle, realRadius, gap)
    path.setAttribute('id', pathId)
    path.setAttribute('d', d)
    path.setAttribute('fill', 'none')
   path.setAttribute('stroke', 'none')
    path.setAttribute('stroke-width', strokeWidth)
   path.setAttribute('vector-effect', 'non-scaling-stroke')

    return path
}

createTextPath(pathId) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const textPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'textPath'
  );

  //text.setAttribute('x', '25'); // Adjust as needed
  textPath.setAttribute('href', `#${pathId}`);
  textPath.setAttribute('alignment-baseline', 'middle');
  textPath.textContent = this.textContent; // Set the text content here

  text.appendChild(textPath);
  return text;
}

  
  textContentNode() {
    const text = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text'
    )
    text.textContent = this.textContent
    return text
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
    if (this.classList.contains('inner-orbit')) {
      innerOuter = 0
    }
    const realRadius = 50 + innerOuter - strokeWithPercentage
    const sectorAngle = calcularExpresionCSS(rawAngle)
   
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
