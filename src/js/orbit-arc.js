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
    svg {
      position: absolute;
      inset: 0;
      width: auto;
      height: auto;
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
    /* Text lets the pointer through to the band under it: WebKit fires no
       click on SVG text inside a shadow root. */
    :host([interactive]) svg text,
    :host([interactive]) svg textPath {
      pointer-events: none;
    }
    /* The touch area catches the pointer even where the band is transparent. */
    #orbitHit {
      fill: none;
      stroke: transparent;
    }
    :host([interactive]) #orbitHit {
      pointer-events: stroke;
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
    /* Guides for text: never painted and never under the pointer. */
    #orbitPath, #measure {
      fill: none;
      stroke: none;
      pointer-events: none;
    }
  </style>
  <svg viewBox="0 0 100 100">
    <path id="orbitHit" vector-effect="non-scaling-stroke"></path>
    <path id="orbitShape" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
    <path id="orbitPath" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
    <text>
      <textPath href="#orbitPath" alignment-baseline="middle"></textPath>
    </text>
    <text id="measure" visibility="hidden" aria-hidden="true"></text>
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
    const { fitRange, stacked } = attrs;
    if (stacked) {
      // An auto arc with an explicit text-anchor is anchored at its angle:
      // "middle" centers it there, "end" ends it there. Without one, it starts
      // there, so consecutive auto arcs follow each other.
      const anchor = attrs.auto && this.hasAttribute('text-anchor')
        ? { middle: -.5, end: -1 }[attrs.textAnchor] || 0
        : 0;
      setLayoutProperty(this, '--o-arc-start', `${attrs.stackOffset + anchor * attrs.arcAngle}deg`);
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
    this.updateHitArea(this.shadowRoot.querySelector('#orbitHit'), attrs, 0, attrs.arcAngle);
    const textAnchor = attrs.textAnchor;

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

    textPath.parentElement.style.fontSize = attrs.svgFontSize;
    textPath.textContent = this.textContent;
    if (!attrs.auto) this.warnIfTextOverflows(orbitPath, textPath, fitRange);
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
            'Shorten the text, widen --o-range, add range="auto" to fit the arc to the text, or fit-range to squeeze it.'
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
    // Font size in viewBox units: the same px size on every ring.
    const svgFontSize = `calc(${fontSize} * (100 / (${length}) * (12 / var(--o-orbit-number)))`;
    const auto = this.getAttribute('range') === 'auto';
    const stacked = auto || this.hasAttribute('value');
    let arcAngle;
    if (auto) arcAngle = this.measureTextAngle(svgFontSize, common.realRadius, gap);
    else if (this.hasAttribute('value')) arcAngle = super.getProgressAngle(range, this.readValue(), this.readMax());
    else arcAngle = Math.max(0, Math.min(360, this.readAngle(style, '--o-angle', 0)));
    this._autoAngle = auto ? arcAngle : 0;
    let stackOffset = 0;
    if (stacked) {
      // Ignore unrelated siblings. Recompute from data so reorders/removals and
      // a zero first segment cannot leave stale offsets on following arcs.
      for (let prev = this.previousElementSibling; prev; prev = prev.previousElementSibling) {
        if (prev.localName !== 'o-arc') continue;
        const previousStyle = this.ownerDocument.defaultView.getComputedStyle(prev);
        if (prev.getAttribute('range') === 'auto') stackOffset += prev._autoAngle || 0;
        else if (prev.hasAttribute('value')) {
          const prevMax = prev.hasAttribute('max') ? Number(prev.getAttribute('max')) : 100;
          const prevRange = cssNumber(prev, previousStyle.getPropertyValue('--o-range'), range, 'angle');
          stackOffset += super.getProgressAngle(prevRange, Number(prev.getAttribute('value')), prevMax);
        } else stackOffset += cssNumber(prev, previousStyle.getPropertyValue('--o-angle'), 0, 'angle');
      }
    }
    return { ...common, gap, arcAngle, stackOffset, flip, fitRange, length, fontSize, svgFontSize, textAnchor, auto, stacked };
  }

  /** range="auto": the angle that fits this arc's text, with half an em of room at each end. */
  measureTextAngle(svgFontSize, radius, gap) {
    const text = (this.textContent || '').trim();
    if (!text || !(radius > 0)) return 0;
    const measure = this.shadowRoot.querySelector('#measure');
    measure.style.fontSize = svgFontSize;
    measure.textContent = text;
    let length = 0;
    try {
      length = measure.getComputedTextLength() + parseFloat(this.ownerDocument.defaultView.getComputedStyle(measure).fontSize);
    } catch (e) { /* not measurable while hidden */ }
    if (!(length > 0)) return 0;
    return Math.min(360, length / radius * 180 / Math.PI + gap);
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
    
    const dShape = super.generatePathData(shape, params);
    
    return { dShape };
  }

  calculateTextArcParameters(attrs) {
    const { arcAngle, realRadius, gap, flip } = attrs;
    if (!(arcAngle > 0)) return { dPath: '' };
    const adjustedGap = Math.min(gap * 0.5, arcAngle * .49);
    const start = (adjustedGap - 90) * Math.PI / 180;
    const end = (arcAngle - adjustedGap - 90) * Math.PI / 180;
    // flip runs the text the other way, so it reads upright at the bottom.
    return { dPath: flip ? this.linePath(realRadius, end, start) : this.linePath(realRadius, start, end) };
  }

  resolveAngle(cssExpression) {
    return cssNumber(this, cssExpression, 0, 'angle');
  }

  /** @deprecated Use resolveAngle(). */
  calcularExpresionCSS(cssExpression) {
    return this.resolveAngle(cssExpression);
  }
}
