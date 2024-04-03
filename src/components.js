// Define the custom SVG progress bar element
// todos: componente sector tiene que tener posibilidad de bordes. acomoder el angulo inicial que esta en -90
// OK aramr un componentes de progress. 
  // satelite... up and low tangential
  // comoentes... up/center/low?
// OK orbit -ratios
// OK armar class vector
// OK usar nth type para evitar conflictos. OJO ERROR EN ORBIT HAS
// USAR ESBUILD para el bundle de cwc y sass. OK probar luego
// trabajar en los satelittes NO
// curved text component
// label component
// pesnar el tema de los sector/ progress con medidas desiguales para ponner el sunburst charts
// SEPARAR BASE DE STILO
// 
// mostrar cada estado de cada elemento posible en los docs, chiquito minimalista
// armar templates para descargar con $
//    - graficos: sunburst/pie/donut/gauges/rose
//    - knobs
//    - futurist
//    - menu
//    - mandalas
//
//
//

function calcularExpresionCSS(cssExpression) {
  const match = cssExpression.match(/calc\(([\d.]+)(deg)\s*\/\s*(\d+)\)/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const divisor = parseInt(match[3]);
    if (unit === 'deg' && divisor >= 1 && divisor <= 12) {
      return value / divisor;
    }
  }
}

class OrbitSector extends HTMLElement {

  connectedCallback() {
    this.update();

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
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
    this.innerHTML = '';
    this.appendChild(svg);
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
    const { radius, strokeWidth, realRadius, progressColor, gap } = this.getAttributes();
    const angle = this.calculateAngle();
    const { startX, startY, endX, endY, largeArcFlag, d } = this.calculateArcParameters(angle, realRadius, gap);
    progressArc.setAttribute('d', d);
    progressArc.setAttribute('stroke', progressColor);
    progressArc.setAttribute('stroke-width', strokeWidth);
    progressArc.setAttribute('fill', 'transparent');
    return progressArc;
  } 

  getAttributes() {
    const width = parseFloat(getComputedStyle(this).getPropertyValue('--o-width-factor') || 1);
    const orbitNumber = parseFloat(getComputedStyle(this).getPropertyValue('--orbit-nth') || 0);
    const gap = parseFloat(getComputedStyle(this).getPropertyValue('--o-gap') || 0);
    const progressColor = this.getAttribute('progress-color') || '#00ff00';
    const radius = parseFloat(this.getAttribute('radius')) || 50;
    const strokeWidth = (50 / orbitNumber) * width;
    const realRadius = radius - strokeWidth / 2;
    const progress1 = getComputedStyle(this).getPropertyValue('--o-angle');
    const progress = calcularExpresionCSS(progress1);
    return { radius, strokeWidth, realRadius, progressColor, gap, progress };
  }

  calculateAngle() {
    const { progress, gap } = this.getAttributes();
    return progress - gap;
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
  
}
function calcularExpresionCSS(cssExpression) {
  const match = cssExpression.match(/calc\(([\d.]+)(deg)\s*\/\s*(\d+)\)/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const divisor = parseInt(match[3]);
    if (unit === 'deg' && divisor >= 1 && divisor <= 12) {
      return value / divisor;
    }
  }
}


class OrbitProgress extends HTMLElement {
  connectedCallback() {
    this.update();

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          this.update();
        }
      });
    });

    observer.observe(this, { attributes: true });
  }

  update() {
    const svg = this.createSVGElement();
    const progressArc1 = this.createProgressArc(true);
    svg.appendChild(progressArc1);
    const progressArc = this.createProgressArc();
    svg.appendChild(progressArc);
    this.innerHTML = '';
    this.appendChild(svg);
  }

  createSVGElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', this.getAttribute('width') || '100%');
    svg.setAttribute('height', this.getAttribute('height') || '100%');
    return svg;
  }

  createProgressArc(full) {
    const progressArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const { radius, strokeWidth, realRadius, ellipseX, ellipseY, progressColor, lineCap, maxAngle } = this.getAttributes();
    const angle = this.getProgressAngle(maxAngle, full);
    const { startX, startY, endX, endY, largeArcFlag, d } = this.calculateArcParameters(angle, realRadius, ellipseX, ellipseY);
    progressArc.setAttribute('d', d);
    progressArc.setAttribute('stroke', full ? 'black' : progressColor);
    progressArc.setAttribute('stroke-width', strokeWidth);
    progressArc.setAttribute('fill', 'transparent');
    progressArc.setAttribute('stroke-linecap', lineCap);
    return progressArc;
  }

  getAttributes() {
    const widthFactor = getComputedStyle(this).getPropertyValue('--o-width-factor') || 1;
    const orbitNumber = getComputedStyle(this).getPropertyValue('--orbit-nth') || 0;
    const lineCap = getComputedStyle(this).getPropertyValue('--o-linecap') || 'butt';
    const ellipseX = getComputedStyle(this).getPropertyValue('--o-ellipse-x') || 1;
    const ellipseY = getComputedStyle(this).getPropertyValue('--o-ellipse-y') || 1;
    const progress = parseFloat(getComputedStyle(this).getPropertyValue('--o-progress') || this.getAttribute('value') || 0);
    const progressColor = this.getAttribute('progress-color') || 'orange';
    const radius = parseFloat(this.getAttribute('radius')) || 50;
    const strokeWidth = (50 / parseFloat(orbitNumber)) * parseFloat(widthFactor);
    const realRadius = radius - strokeWidth / 2;
    const maxAngle = parseFloat(this.getAttribute('max-angle')) || 360; // User-defined max angle
    return { widthFactor, orbitNumber, lineCap, ellipseX, ellipseY, progress, progressColor, radius, strokeWidth, realRadius, maxAngle };
  }

  getProgressAngle(maxAngle,full) {
    const progress = parseFloat(getComputedStyle(this).getPropertyValue('--o-progress') || this.getAttribute('value') || 0);
    const maxValue = parseFloat(this.getAttribute('max')) || 100; // User-defined max value
    return full ? ((maxValue - 1) / maxValue) * maxAngle : (progress / maxValue) * maxAngle; // Calculate angle based on progress and user-defined max angle
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
