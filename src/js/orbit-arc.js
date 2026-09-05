import { OrbitBase } from './orbit-base.js';
import { cssNumber, setLayoutProperty } from './orbit-layout.js';

const template = typeof document === 'undefined' ? null : document.createElement('template');
if (template) template.innerHTML = `
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
    /* Arcs are display elements by default: they must NOT steal clicks from
       satellites/controls nearby (a painted arc used to capture clicks even
       at opacity 0, and pointer-events:none on the host could not pierce the
       shadow). Interaction is opt-in via the "interactive" attribute. */
    svg * {
      pointer-events: none;
    }
    :host([interactive]) svg * {
      pointer-events: visiblePainted;
    }
    :host([interactive]) {
      cursor: pointer;
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

  update() {
    const attrs = this.getAttributes();
    const { length, fontSize, textAnchor, fitRange } = attrs;
    if (this.hasAttribute('value')) {
      setLayoutProperty(this, '--o-arc-start', `${attrs.stackOffset}deg`);
      setLayoutProperty(this, '--o_stack', attrs.stackOffset + attrs.arcAngle);
    } else {
      this.style.removeProperty('--o-arc-start');
      this.style.removeProperty('--o_stack');
    }
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
    } else {
      textPath.parentElement.removeAttribute('textLength');
    }

    textPath.parentElement.style.fontSize = `calc(${fontSize} * (100 / (${length}) * (12 / var(--o-orbit-number)))`;
    textPath.textContent = this.textContent;
    this.warnIfTextOverflows(orbitPath, textPath, fitRange);
  }

  /**
   * Curved text has an explicit angular budget: glyphs past the end of the
   * arc path are clipped SILENTLY by SVG. Measure and warn so nobody loses
   * time to invisible truncation (~20 chars in 96° at default sizes).
   * fit-range squeezes the text to the path via textLength, so it never clips.
   */
  warnIfTextOverflows(orbitPath, textPath, fitRange) {
    const raw = (this.textContent || '').trim();
    if (!raw || fitRange || !this.isConnected) return;
    if (this._textFrame) this.ownerDocument.defaultView.cancelAnimationFrame(this._textFrame);
    this._textFrame = this.ownerDocument.defaultView.requestAnimationFrame(() => {
      this._textFrame = 0;
      if (!this.isConnected) return;
      try {
        const pathLen = orbitPath.getTotalLength();
        const textLen = textPath.parentElement.getComputedTextLength();
        if (pathLen > 0 && textLen > pathLen && this._truncWarned !== raw) {
          this._truncWarned = raw;
          console.warn(
            `[orbit] <o-arc> text "${raw.length > 34 ? raw.slice(0, 34) + '…' : raw}" ` +
            `overflows its arc (${Math.round(textLen)} > ${Math.round(pathLen)} units) and will clip. ` +
            'Shorten the text, widen --o-range, or use fit-range to squeeze it.'
          );
        }
      } catch (e) { /* not measurable (hidden/detached) — skip */ }
    });
  }

  getAttributes() {
    const common = super.getCommonAttributes(this);
    const { style } = common;
    const range = Math.max(0, Math.min(360, this.readAngle(style, '--o-range', 360)));
    const flip = this.hasAttribute('flip') || this.classList.contains('flip');
    const fitRange = this.hasAttribute('fit-range') || this.classList.contains('fit-range');
    const length = common.orbitRadius * 24 / common.orbitNumber || 100;
    const textAnchor = this.getAttribute('text-anchor') || 'middle';
    const fontSize = style.fontSize || '16px';
    const gap = Math.max(0, this.readNumber(style, '--o-gap', 1));
    const value = Number(this.getAttribute('value'));
    const rawMax = this.getAttribute('max');
    const max = rawMax === null ? 100 : Number(rawMax);
    const arcAngle = this.hasAttribute('value')
      ? super.getProgressAngle(range, value, max)
      : Math.max(0, Math.min(360, this.readAngle(style, '--o-angle', 0)));
    let stackOffset = 0;
    if (this.hasAttribute('value')) {
      // Ignore unrelated siblings. Recompute from data so reorders/removals and
      // a zero first segment cannot leave stale offsets on following arcs.
      for (let prev = this.previousElementSibling; prev; prev = prev.previousElementSibling) {
        if (prev.localName !== 'o-arc') continue;
        const previousStyle = this.ownerDocument.defaultView.getComputedStyle(prev);
        if (prev.hasAttribute('value')) {
          const prevMax = prev.hasAttribute('max') ? Number(prev.getAttribute('max')) : 100;
          const prevRange = cssNumber(prev, previousStyle.getPropertyValue('--o-range'), range, 'angle');
          stackOffset += super.getProgressAngle(prevRange, Number(prev.getAttribute('value')), prevMax);
        } else stackOffset += cssNumber(prev, previousStyle.getPropertyValue('--o-angle'), 0, 'angle');
      }
    }
    return { ...common, gap, arcAngle, stackOffset, flip, fitRange, length, fontSize, textAnchor };
  }

  calculateArcParameters(attrs) {
    const { arcAngle, realRadius, arcHeightPercentage, orbitNumber, shape, strokeWidth, arcHeight, gap } = attrs;
    if (!(arcAngle > 0) || !(attrs.orbitRadius > 0)) return { dShape: '' };
    
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
    if (!(arcAngle > 0)) return { dPath: '' };
    const adjustedGap = Math.min(gap * 0.5, arcAngle * .49);
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
    return cssNumber(this, cssExpression, 0, 'angle');
  }
}
