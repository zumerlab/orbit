


/*! 
## o-label

`<o-label>` is a standard web-component for rendering curved text. There are up to 24 sector per orbit. 
The number can be modify with `$max-orbiters` var at `_variables.scss`.

### Customization
  - Attribute `label-color`: To set a text color for label. Default `black`
  - Attribute `bg-color`: To set a background color for label. Default `none`

  - Class `.gap-*` applied on `.orbit` or `.orbit-*` or in `<o-label>`: to set gap space. Default '0'
  - utility class `.range-*` applied on `.orbit` or `.orbit-*`: Default '360deg'
  - utility class `.from-*` applied on `.orbit` or `.orbit-*`: Default '0deg'
  - utility class `.inner-orbit`: To place `o-label` just below its orbit
  - utility class `.outer-orbit-orbit`: To place `o-label` just above its orbit
  - Utility class `.quarter-inner-orbit`: To place `o-sector` a 25% into its orbit.
  - Utility class `.quarter-outer-orbit`: To place `o-sector` a 25% outer its orbit.

  - CSS styles. User can customize `o-label` by adding CSS properties to `o-label path`
  
**Important:** 

  - `<o-label>` can only be used into `.orbit` or `.orbit-*`.
  - `<o-label>` doesn't support ellipse shape. See `.orbit` section for more information.

### Usage

```html
<div class="orbit"> 
  <o-label>Hello World!</o-label>
</div>
```
*/

export class OrbitLabel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const template = document.createElement('template');
    template.innerHTML = `
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path id="orbitPath" fill="none" vector-effect="non-scaling-stroke"></path>
        <text>
          <textPath href="#orbitPath" alignment-baseline="middle"></textPath>
        </text>
      </svg>
      <style>
      svg {
      overflow: visible;
      }
        :host {
          display: inline-block;
          width: 100%;
          height: 100%;
          
        }
        text {
          font-size: inherit;
        }
      </style>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.update();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          this.update();
        }
      });
    });

    observer.observe(this, { attributes: true });

    const slot = this.shadowRoot.querySelector('textPath');
    slot.addEventListener('slotchange', () => {
      this.update();
    });
  }

  update() {
    const path = this.shadowRoot.getElementById('orbitPath');
    const textPath = this.shadowRoot.querySelector('textPath');

    const { d, strokeWidth, labelBgColor, lineCap } = this.getPathAttributes();
    path.setAttribute('d', d);
    path.setAttribute('stroke', labelBgColor);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('stroke-linecap', lineCap);

    const { labelColor, textAnchor, fitRange } = this.getTextAttributes();
    textPath.setAttribute('color', labelColor);

    if (textAnchor === 'start') {
      textPath.setAttribute('startOffset', '0%');
      textPath.setAttribute('text-anchor', 'start');
    } else if (textAnchor === 'middle') {
      textPath.setAttribute('startOffset', '50%');
      textPath.setAttribute('text-anchor', 'middle');
    } else if (textAnchor === 'end') {
      textPath.setAttribute('startOffset', '100%');
      textPath.setAttribute('text-anchor', 'end');
    }

    if (fitRange) {
      textPath.parentElement.setAttribute('textLength', path.getTotalLength());
    }
textPath.textContent = this.textContent.trim();
    
  }

  getPathAttributes() {
    const { realRadius, gap, labelBgColor, flip, lineCap, strokeWidth } = this.getAttributes();
    const angle = this.calculateAngle();
    const { d } = this.calculateArcParameters(angle, realRadius, gap, flip);
    return { d, strokeWidth, labelBgColor, lineCap };
  }

  getTextAttributes() {
    const { labelColor, textAnchor, fitRange } = this.getAttributes();
    return { labelColor, textAnchor, fitRange };
  }

  getAttributes() {
    const orbitRadius = parseFloat(getComputedStyle(this).getPropertyValue('r') || 0);
    const flip = this.hasAttribute('flip');
    const fitRange = this.hasAttribute('fit-range');
    const lineCap = getComputedStyle(this).getPropertyValue('--o-linecap') || 'butt';
    const gap = parseFloat(getComputedStyle(this).getPropertyValue('--o-gap') || 0.001);
    const labelColor = this.getAttribute('color') || 'black';
    const textAnchor = this.getAttribute('text-anchor') || 'start';
    const labelBgColor = this.getAttribute('bgcolor') || 'none';
    const rawAngle = getComputedStyle(this).getPropertyValue('--o-angle');
    const strokeWidth = parseFloat(getComputedStyle(this).getPropertyValue('stroke-width') || 1);

    let strokeWithPercentage = ((strokeWidth / 2) * 100) / orbitRadius / 2;
    let innerOuter = strokeWithPercentage;
    if (this.classList.contains('outer-orbit')) {
      innerOuter = strokeWithPercentage * 2;
    }
    if (this.classList.contains('quarter-outer-orbit')) {
      innerOuter = strokeWithPercentage * 1.75;
    }
    if (this.classList.contains('inner-orbit')) {
      innerOuter = 0;
    }
    if (this.classList.contains('quarter-inner-orbit')) {
      innerOuter = strokeWithPercentage * 0.75;
    }
    const realRadius = 50 + innerOuter - strokeWithPercentage;
    const labelAngle = calcularExpresionCSS(rawAngle);

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
      lineCap,
      fitRange
    };
  }

  calculateAngle() {
    const { labelAngle, gap } = this.getAttributes();
    return labelAngle - gap;
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

//customElements.define('orbit-label', OrbitLabel);
