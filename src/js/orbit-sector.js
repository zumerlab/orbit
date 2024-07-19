const template = document.createElement('template');
template.innerHTML = `
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
    svg > * {
      pointer-events: stroke;
    }
    path {
      fill: transparent;
      stroke: var(--color, var(--o-gray));
      transition: stroke 0.3s;
    }
    :host(:hover) path {
      stroke: var(--hover-color, var(--o-gray));
      cursor: pointer;
    }
  </style>
  <svg viewBox="0 0 100 100">
    <defs></defs>
    <path vector-effect="non-scaling-stroke"  strokefill="transparent"></path>
  </svg>
`;

export class OrbitSector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
  }

  update() {
    const { shape } = this.getAttributes();
    const path = this.shadowRoot.querySelector('path');
    const defs = this.shadowRoot.querySelector('defs');

    if (shape !== 'none') {
      defs.innerHTML = ''; // Limpiar defs previos
      defs.appendChild(this.createMarker('head', 'end'));
      defs.appendChild(this.createMarker('tail', 'start'));
      path.setAttribute('marker-end', 'url(#head)');
      path.setAttribute('marker-start', 'url(#tail)');
    }

    const { strokeWidth, realRadius, sectorColor, gap } = this.getAttributes();
    const angle = this.calculateAngle();
    const { d } = this.calculateArcParameters(angle, realRadius, gap);

    path.setAttribute('d', d);
    path.setAttribute('stroke', sectorColor);
    path.setAttribute('stroke-width', strokeWidth);

   
  }

  getAttributes() {
    const orbitRadius = parseFloat(getComputedStyle(this).getPropertyValue('r') || 0);
    const gap = parseFloat(getComputedStyle(this).getPropertyValue('--o-gap') || 0.001);
    const shape = this.getAttribute('shape') || 'none';
    const sectorColor = this.getAttribute('color') || 'currentcolor';
    const rawAngle = getComputedStyle(this).getPropertyValue('--o-angle');
    const strokeWidth = parseFloat(getComputedStyle(this).getPropertyValue('stroke-width') || 1);
    const strokeWithPercentage = ((strokeWidth / 2) * 100) / orbitRadius / 2;
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
    const sectorAngle = calcularExpresionCSS(rawAngle);

    return {
      orbitRadius,
      strokeWidth,
      realRadius,
      sectorColor,
      gap,
      sectorAngle,
      shape,
    };
  }

  calculateAngle() {
    const { sectorAngle, gap } = this.getAttributes();
    return sectorAngle - gap;
  }

  calculateArcParameters(angle, realRadius, gap) {
    const radiusX = realRadius / 1;
    const radiusY = realRadius / 1;
    const startX = 50 + gap + radiusX * Math.cos(-Math.PI / 2);
    const startY = 50 + radiusY * Math.sin(-Math.PI / 2);
    const endX = 50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180);
    const endY = 50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180);
    const largeArcFlag = angle <= 180 ? 0 : 1;
    const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`;
    return { startX, startY, endX, endY, largeArcFlag, d };
  }

  createMarker(id, position = 'end') {
    const { shape } = this.getAttributes();
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('viewBox', '0 0 10 10');
    position === 'start' && shape !== 'circle' ? marker.setAttribute('refX', '2') :
      position === 'start' && shape === 'circle' ? marker.setAttribute('refX', '5') :
      marker.setAttribute('refX', '0.1');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '1');
    marker.setAttribute('markerHeight', '1');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('fill', 'context-stroke');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const shapes = {
      arrow: {
        head: 'M 0 0 L 2 5 L 0 10 z',
        tail: 'M 2 0 L 0 0 L 1 5 L 0 10 L 2 10 L 2 5 z',
      },
      slash: {
        head: 'M 0 0 L 0 0 L 1 5 L 2 10 L 0 10 L 0 5 z',
        tail: 'M 2 0 L 0 0 L 1 5 L 2 10 L 2 10 L 2 5 z',
      },
      backslash: {
        head: 'M 0 0 L 2 0 L 1 5 L 0 10 L 0 10 L 0 5 z',
        tail: 'M 2 0 L 2 0 L 1 5 L 0 10 L 2 10 L 2 5 z',
      },
      circle: {
        head: 'M 0 0 C 7 0 7 10 0 10 z',
        tail: 'M 6 0 C -1 0 -1 10 6 10 z',
      },
      zigzag: {
        head: 'M 1 0 L 0 0 L 0 5 L 0 10 L 1 10 L 2 7 L 1 5 L 2 3 z',
        tail: 'M 0 0 L 2 0 L 2 5 L 2 10 L 0 10 L 1 7 L 0 5 L 1 3 z',
      },
    };
    position === 'end' ? path.setAttribute('d', shapes[shape].head) :
      path.setAttribute('d', shapes[shape].tail);

    marker.appendChild(path);

    return marker;
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
  return 0; // Valor por defecto en caso de que no se pueda calcular
}

