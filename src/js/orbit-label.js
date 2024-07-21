export class OrbitLabel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const template = document.createElement('template');
    template.innerHTML = `
      <svg viewBox="0 0 100 100"  >
        <path id="orbitPath" fill="none" vector-effect="non-scaling-stroke"></path>
        <text>
          <textPath href="#orbitPath"  alignment-baseline="middle"></textPath>
        </text>
      </svg>
      <style>
       :host {
          display: inline-block;

        }
        svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
          
        }
        svg * {
          pointer-events: stroke;
        }
        
        path {
          fill: transparent;
          stroke: var(--o-label-color);
          transition: stroke 0.3s;
        }
       
        :host(:hover) path {
          stroke: var(--o-hover-label-color, var(--o-label-color));
          
        }
      
        
      </style>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.update();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
          this.update();
      });
    });

    observer.observe(this, { attributes: true, childList: true });

  }

  update() {
    const path = this.shadowRoot.getElementById('orbitPath');
    const text = this.shadowRoot.querySelector('text');
    const textPath = this.shadowRoot.querySelector('textPath');

    const { d, strokeWidth, lineCap } = this.getPathAttributes();
    path.setAttribute('d', d);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('stroke-linecap', lineCap);

    const { length, fontSize, textAnchor, fitRange } = this.getTextAttributes();

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

    text.style.fontSize = `calc(${fontSize} * (100 / (${length}) * (12 /  var(--o-orbit-number) ))`

   
    textPath.textContent = this.textContent.trim();
    
  }

  getPathAttributes() {
    const { realRadius, gap, labelBgColor, flip, lineCap, strokeWidth } = this.getAttributes();
    const angle = this.calculateAngle();
    const { d } = this.calculateArcParameters(angle, realRadius, gap, flip);
    return { d, strokeWidth, labelBgColor, lineCap };
  }

  getTextAttributes() {
    const { length, fontSize, textAnchor, fitRange } = this.getAttributes();
    return { length, fontSize, textAnchor, fitRange };
  }

  getAttributes() {
    const orbitRadius = parseFloat(getComputedStyle(this).getPropertyValue('r') || 0);
    const flip = this.hasAttribute('flip');
    const fitRange = this.hasAttribute('fit-range');
    const lineCap = getComputedStyle(this).getPropertyValue('--o-linecap') || 'butt';
    const gap = parseFloat(getComputedStyle(this).getPropertyValue('--o-gap') || 0.001);
    const length = parseFloat(getComputedStyle(this).getPropertyValue('--o-length'));
    const textAnchor = this.getAttribute('text-anchor') || 'start';
    const fontSize = getComputedStyle(this).getPropertyValue('font-size') ||  getComputedStyle(this).getPropertyValue('--font-size');
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
      length,
      fontSize,
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
