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
## o-label

`<o-label>` is a standard web-component for rendering a radial slices or pies. 
By default there are 24 sector per orbit. The number can be modify with `$max-orbiters` var at `_variables.scss`.

It has some special attributes and css variables to customize it:
  - Attribute `sector-color`: To set a color for sector. Default `orange`

  - Class `.gap-*` applied on `.orbit` or `.orbit-*` or in `<o-label>`: to set gap space. Default '0'
  - Class utility `.range-*` applied on `.orbit` or `.orbit-*`: Default '360deg'
  - Class utility `.from-*` applied on `.orbit` or `.orbit-*`: Default '0deg'
  - Class utility `.inner-orbit`: To place `o-label` just below its orbit
  - Class utility `.outer-orbit-orbit`: To place `o-label` just above its orbit

  - CSS styles. User can customize `o-label` by adding CSS properties to `o-label path`
  
**Important:** 

  - `<o-label>` can only be used into `.orbit` or `.orbit-*`.
  - `<o-label>` doesn't support ellipse shape. See `.orbit` section for more information.

### Usage

```html
<div class="orbit range-180"> 
  <o-label />
  <o-label class="gap-5" />
  <o-label class="gap-10" />
  <o-label class="gap-5" />
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
    const text = this.createTextPath(pathId, path);

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
    const { strokeWidth,realRadius, gap,labelBgColor, flip, lineCap} = this.getAttributes()
    const angle = this.calculateAngle()
    const { d } = this.calculateArcParameters(angle, realRadius, gap, flip)
    path.setAttribute('id', pathId)
    path.setAttribute('d', d)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', labelBgColor)
    path.setAttribute('stroke-width', strokeWidth)
    path.setAttribute('vector-effect', 'non-scaling-stroke')
    path.setAttribute('stroke-linecap', lineCap)

    return path
}

createTextPath(pathId, path) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const textPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'textPath'
  );

  const { labelColor, gap, textAnchor} = this.getAttributes()
  textPath.setAttribute('href', `#${pathId}`);
  textPath.setAttribute('color', labelColor);;
  textPath.setAttribute('alignment-baseline', 'middle');

  
  if (textAnchor === 'middle') {
  const textLength = text.textContent.length;
  const pathLength = path.getTotalLength();
  const startOffset = (pathLength - textLength - (gap * 2)) / 4;

  textPath.setAttribute('startOffset', startOffset);
  } else if (textAnchor === 'end') {
    const textLength = text.textContent.length;
    const pathLength = path.getTotalLength();
    const startOffset = (pathLength - textLength + gap) / 2  ;
  
    textPath.setAttribute('startOffset', startOffset);
  }
  

  textPath.textContent = this.textContent; 

  text.appendChild(textPath);
  return text;
}


getAttributes() {
    const orbitRadius = parseFloat(
      getComputedStyle(this).getPropertyValue('r') || 0
    )
    const flip = this.hasAttribute('flip')
    const lineCap =
      getComputedStyle(this).getPropertyValue('--o-linecap') || 'butt'
    const gap = parseFloat(
      getComputedStyle(this).getPropertyValue('--o-gap') || 0.001
    )
    const labelColor = this.getAttribute('label-color') || 'black'

    const textAnchor = this.getAttribute('text-anchor') || 'start'

    const labelBgColor = this.getAttribute('bg-color') || 'none'

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
    const labelAngle = calcularExpresionCSS(rawAngle)
   
    return {
      orbitRadius,
      strokeWidth,
      realRadius,
      labelColor,
      labelBgColor,
      gap,
      labelAngle,
      flip,
      textAnchor,
      lineCap
    }
  }

  calculateAngle() {
    const { labelAngle, gap } = this.getAttributes()
    return labelAngle - gap
  }

  calculateArcParameters(angle, realRadius, gap, flip) {
    const radiusX = realRadius / 1;
    const radiusY = realRadius / 1;
    let startX, startY, endX, endY, largeArcFlag, d;

    if (flip) {
        startX = 50 - gap + radiusX * Math.cos(-Math.PI / 2);
        startY = 50 + radiusY * Math.sin(-Math.PI / 2);
        endX = 50 + radiusX * Math.cos(((270 - angle) * Math.PI) / 180);
        endY = 50 + radiusY * Math.sin(((270 - angle) * Math.PI) / 180);
        largeArcFlag = angle <= 180 ? 0 : 1;
        d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 0 ${endX},${endY}`;
    } else {
        startX = 50 + gap + radiusX * Math.cos(-Math.PI / 2);
        startY = 50 + radiusY * Math.sin(-Math.PI / 2);
        endX = 50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180);
        endY = 50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180);
        largeArcFlag = angle <= 180 ? 0 : 1;
        d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`;
    }
    return { startX, startY, endX, endY, largeArcFlag, d };
}
}