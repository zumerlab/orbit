// Define the custom SVG progress bar element
// todos: componente sector tiene que tener posibilidad de bordes. acomoder el angulo inicial que esta en -90
// ok aramr un componentes de progress. falta origin, rango y pasarlo  100%
// satelite... up and low tangential
// comoentes... up/center/low?
// OK orbit -ratios
// OK armar class vector
// usar nth type para evitar conflictos
// trabajar en los satelittes NO
// SEPARAR BASE DE STILO
function calcularExpresionCSS(cssExpression) {
  const match = cssExpression.match(/calc\(([\d.]+)(deg)\s*\/\s*(\d+)\)/)
  // if (match) {
  const value = parseFloat(match[1]) // Valor numérico
  const unit = match[2] // Unidad
  const divisor = parseInt(match[3]) // Divisor
  if (unit === 'deg' && divisor >= 1 && divisor <= 12) {
    // Asegurarse que el valor esté en el rango de 0 a 360
    const normalizedValue = value % 360
    // Realizar la operación

    const result = value / divisor
    return result
  }
}
class OrbitSector extends HTMLElement {
  connectedCallback() {
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 100 100')

    // pointer-events: visible;
    svg.setAttribute('width', this.getAttribute('width') || '100%')
    svg.setAttribute('height', this.getAttribute('height') || '100%')

    // Retrieve attributes
    // Retrieve attributes
    const width =
      getComputedStyle(this).getPropertyValue('--o-width-factor') || 1
    const orbitNumber =
      getComputedStyle(this).getPropertyValue('--orbit-nth') || 0
    const gap = getComputedStyle(this).getPropertyValue('--o-gap') || 0

    let progress1 = getComputedStyle(this).getPropertyValue('--angle')
    // CSS calc expression
    let progress = calcularExpresionCSS(progress1)
    //  let max = calcularExpresionCSS(max1)
    const progressColor = this.getAttribute('progress-color') || '#00ff00';
    const radius = parseFloat(this.getAttribute('radius')) || 50

    const strokeWidth = (50 / parseFloat(orbitNumber)) * parseFloat(width)
    const realRadius = radius - strokeWidth / 2
    // Calculate angle for progress
    const angle = progress - parseFloat(gap) //360 * (Math.round(progress) / max);

    // Create progress arc
    const progressArc = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    const radiusX = realRadius / 1
    const radiusY = realRadius / 1

    const startX = 50 + parseFloat(gap) + radiusX * Math.cos(-Math.PI / 2)
    const startY = 50 + radiusY * Math.sin(-Math.PI / 2)
    const endX = 50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180)

    const endY = 50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180)
    const largeArcFlag = angle <= 180 ? 0 : 1

    const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`
    progressArc.setAttribute('d', d)
    progressArc.setAttribute('stroke', progressColor)
    progressArc.setAttribute('stroke-width', strokeWidth)
    progressArc.setAttribute('fill', 'transparent')
    svg.appendChild(progressArc)

    // Append SVG to custom element
    this.appendChild(svg)
  }
}

class OrbitProgress extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.update();

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.update();
        }
      });
    });

    observer.observe(this, { attributes: true });
  }

  update() {
    const svg = this.createSVGElement();
    const progressArc = this.createProgressArc();
    svg.appendChild(progressArc);
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(svg);
  }

  createSVGElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', this.getAttribute('width') || '100%');
    svg.setAttribute('height', this.getAttribute('height') || '100%');
    return svg;
  }

  createProgressArc() {
    const progressArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const { radius, strokeWidth, realRadius, ellipseX, ellipseY, progressColor, lineCap, maxAngle } = this.getAttributes();
    const angle = this.getProgressAngle(maxAngle);
    const { startX, startY, endX, endY, largeArcFlag, d } = this.calculateArcParameters(angle, realRadius, ellipseX, ellipseY);
    progressArc.setAttribute('d', d);
    progressArc.setAttribute('stroke', progressColor);
    progressArc.setAttribute('stroke-width', strokeWidth);
    progressArc.setAttribute('fill', 'transparent');
    progressArc.setAttribute('stroke-linecap', lineCap);
    return progressArc;
  }

  getAttributes() {
    const widthFactor = getComputedStyle(this).getPropertyValue('--o-width-factor') || 1;
    const orbitNumber = getComputedStyle(this).getPropertyValue('--orbit-nth') || 0;
    const lineCap = getComputedStyle(this).getPropertyValue('--o-linecap') || 'butt';
    const ellipseX = getComputedStyle(this).getPropertyValue('--ellipse-ratio-x') || 1;
    const ellipseY = getComputedStyle(this).getPropertyValue('--ellipse-ratio-y') || 1;
    const progress = parseFloat(getComputedStyle(this).getPropertyValue('--o-progress') || this.getAttribute('value') || 0);
    const progressColor = this.getAttribute('progress-color') || 'orange';
    const radius = parseFloat(this.getAttribute('radius')) || 50;
    const strokeWidth = (50 / parseFloat(orbitNumber)) * parseFloat(widthFactor);
    const realRadius = radius - strokeWidth / 2;
    const maxAngle = parseFloat(this.getAttribute('max-angle')) || 360; // User-defined max angle
    return { widthFactor, orbitNumber, lineCap, ellipseX, ellipseY, progress, progressColor, radius, strokeWidth, realRadius, maxAngle };
  }

  getProgressAngle(maxAngle) {
    const progress = parseFloat(getComputedStyle(this).getPropertyValue('--o-progress') || this.getAttribute('value') || 0);
    const maxValue = parseFloat(this.getAttribute('max')) || 100; // User-defined max value
    return (progress / maxValue) * maxAngle; // Calculate angle based on progress and user-defined max angle
  }

  calculateArcParameters(angle, realRadius, ellipseX, ellipseY) {
    const radiusX = realRadius / ellipseX;
    const radiusY = realRadius / ellipseY;
    const startX = 50 + radiusX * Math.cos(-Math.PI / 2);
    const startY = 50 + radiusY * Math.sin(-Math.PI / 2);
    const endX = 50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180);
    const endY = 50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180);
    const largeArcFlag = angle <= 180 ? 0 : 1;
    const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`;
    return { startX, startY, endX, endY, largeArcFlag, d };
  }
}

customElements.define('o-sector', OrbitSector)

customElements.define('o-progress', OrbitProgress)
