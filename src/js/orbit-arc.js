import { OrbitBase } from './orbit-base.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      --o-fill: var(--o-gray-light);
      --o-stroke: var(--o-fill);
      --o-stroke-width: 1;
      --o-color: currentcolor;
    }
    :host(:hover) {
      --o-fill: var(--o-gray-light);
      --o-stroke: var(--o-fill);
      --o-stroke-width: 1;
      --o-color: currentcolor;
    }
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }
    svg * {
      pointer-events: visiblePainted;
    }
    #orbitShape {
      fill: var(--o-fill);
      stroke: var(--o-stroke);
      stroke-width: var(--o-stroke-width);
      transition: fill 0.25s, stroke 0.25s;
    }
    text {
      fill: var(--o-color);
    }
    #orbitPath {
      fill: transparent;
      stroke: none;
      stroke-width: 0;
    }
  </style>
  <svg viewBox="0 0 100 100">
    <path id="orbitShape" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
    <path id="orbitPath" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
    <text>
      <textPath href="#orbitPath" alignment-baseline="middle"></textPath>
    </text>
  </svg>
`;

export class OrbitArc extends OrbitBase {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.update();
    this.setupObservers();
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
    if (this.textObserver) this.textObserver.disconnect();
  }

  setupObservers() {
    // Observer for attributes and structure
    this.observer = new MutationObserver((mutations) => {
      this.observer.disconnect();
      mutations.forEach(() => this.update());
      this.observer.observe(this, { attributes: true, childList: true });
    });
    this.observer.observe(this, { attributes: true, childList: true });

    // Observer for text content changes
    this.textObserver = new MutationObserver(() => {
      const textPath = this.shadowRoot.querySelector('textPath');
      textPath.textContent = this.textContent;
    });
    this.textObserver.observe(this, { characterData: true, subtree: true });
  }

  update() {
    const attrs = this.getAttributes();
    const { length, fontSize, textAnchor, fitRange } = attrs;
    const orbitPath = this.shadowRoot.querySelector('#orbitPath');
    const orbitShape = this.shadowRoot.querySelector('#orbitShape');
    const textPath = this.shadowRoot.querySelector('textPath');

    orbitShape.setAttribute('d', this.calculateArcParameters(attrs).dShape);
    orbitPath.setAttribute('d', this.calculateTextArcParameters(attrs).dPath);

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
      textPath.parentElement.setAttribute('textLength', orbitPath.getTotalLength());
    }

    textPath.parentElement.style.fontSize = `calc(${fontSize} * (100 / (${length}) * (12 / var(--o-orbit-number)))`;
    textPath.textContent = this.textContent;
  }

  getAttributes() {
    const common = super.getCommonAttributes(this);
    let arcAngle;
    const flip = this.hasAttribute('flip') || this.classList.contains('flip');
    const fitRange = this.hasAttribute('fit-range') || this.classList.contains('fit-range') || false;
    const length = parseFloat(getComputedStyle(this).getPropertyValue('--o-force')) || 100;
    const textAnchor = this.getAttribute('text-anchor') || 'middle';
    const fontSize = getComputedStyle(this).getPropertyValue('font-size') || 
                     getComputedStyle(this).getPropertyValue('--font-size');
    const range = parseFloat(getComputedStyle(this).getPropertyValue('--o-range') || 360);
    const value = parseFloat(this.getAttribute('value'));
    const gap = parseFloat(getComputedStyle(this).getPropertyValue('--o-gap')) || 1;

    if (value) {
      arcAngle = super.getProgressAngle(range, value);
      const prevElement = this.previousElementSibling;
      const stackOffset = prevElement ? 
        parseFloat(getComputedStyle(prevElement).getPropertyValue('--o_stack')) : 0;
      
      this.style.setProperty('--o_stack', stackOffset + arcAngle);
      if (stackOffset >= 0 && flip) {
        this.style.setProperty('--o-angle-composite', parseFloat(stackOffset) + 'deg');
      }
      if (stackOffset > 0 && !flip) {
        this.style.setProperty('--o-angle-composite', parseFloat(stackOffset) + 'deg');
      }
    } else {
      const rawAngle = getComputedStyle(this).getPropertyValue('--o-angle');
      arcAngle = this.calcularExpresionCSS(rawAngle);
    }

    return {
      ...common,
      gap,
      arcAngle,
      flip,
      fitRange,
      length,
      fontSize,
      textAnchor
    };
  }

  calculateArcParameters(attrs) {
    const { arcAngle, realRadius, arcHeightPercentage, orbitNumber, shape, strokeWidth, arcHeight, gap } = attrs;
    
    const params = super.calculateCommonArcParameters(
      arcAngle, 
      realRadius, 
      arcHeightPercentage, 
      orbitNumber, 
      shape, 
      strokeWidth, 
      arcHeight, 
      gap
    );
    
    const dShape = super.generatePathData(shape, params, arcHeight, orbitNumber);
    
    return { dShape };
  }

  calculateTextArcParameters(attrs) {
    const { arcAngle, realRadius, gap, flip } = attrs;
    const adjustedGap = gap * 0.5;
    const sweepFlag = flip ? 0 : 1;
    const largeArcFlag = arcAngle <= 180 ? 0 : 1;
    
    let coordX1 = 50 + realRadius * Math.cos((-90 + adjustedGap) * (Math.PI / 180));
    let coordY1 = 50 + realRadius * Math.sin((-90 + adjustedGap) * (Math.PI / 180));
    let coordX2 = 50 + realRadius * Math.cos(((arcAngle - 90 - adjustedGap) * Math.PI) / 180);
    let coordY2 = 50 + realRadius * Math.sin(((arcAngle - 90 - adjustedGap) * Math.PI) / 180);
   
    const [startX, startY, endX, endY] = flip ? 
      [coordX2, coordY2, coordX1, coordY1] : 
      [coordX1, coordY1, coordX2, coordY2];
    
    const dPath = `M ${startX},${startY} A ${realRadius},${realRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX},${endY}`;
    return { dPath };
  }

  calcularExpresionCSS(cssExpression) {
    const match = cssExpression.match(/calc\(\s*([\d.]+)deg\s*\/\s*\(\s*(\d+)\s*-\s*(\d+)\s*\)\s*\)/);
    if (match) {
      const value = parseFloat(match[1]);
      const divisor = parseInt(match[2]) - parseInt(match[3]);
      if (!isNaN(value) && !isNaN(divisor) && divisor !== 0) {
        return value / divisor;
      }
    }
    return 0;
  }
}