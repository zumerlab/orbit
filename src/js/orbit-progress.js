import { OrbitBase } from './orbit-base.js';
import { setLayoutProperty } from './orbit-layout.js';

export class OrbitProgress extends OrbitBase {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --o-fill: var(--o-gray-light);
          --o-stroke: var(--o-fill);
          --o-stroke-width: 1;
          --o-back-fill: transparent;
          --o-back-stroke: none;
          --o-back-stroke-width: 1;
        }
        svg {
          position: absolute;
          inset: 0;
          width: auto;
          height: auto;
          overflow: visible;
          pointer-events: none;
        }
        /* Display element by default: never steals clicks (see orbit-arc).
           Interaction is opt-in via the "interactive" attribute. */
        svg * {
          pointer-events: none;
        }
        :host([interactive]) svg * {
          pointer-events: visiblePainted;
        }
        /* The touch area covers the whole track, whatever its colors. */
        .hit {
          fill: none;
          stroke: transparent;
        }
        :host([interactive]) .hit {
          pointer-events: stroke;
        }
        :host([interactive]) {
          cursor: pointer;
        }
        .progress-bar {
          fill: var(--o-fill);
          stroke: var(--o-stroke);
          stroke-width: var(--o-stroke-width);
          transition: fill 0.25s, stroke 0.25s;
          stroke-linejoin: round;
        }
        .progress-bg {
          fill: var(--o-back-fill);
          stroke: var(--o-back-stroke);
          stroke-width: var(--o-back-stroke-width);
        }
        /* variant="stroke": the thin, legible gauge.
           The default band is a FILLED donut wedge, so everyone building a
           thin gauge tripped on --o-fill/--o-back-fill. With this variant the
           paths are open arcs and the data color lives where you expect it:
           --o-stroke for the bar, --o-back-stroke for the track. */
        /* The stroke variant draws a 2px bar over a gray 1px track unless you
           set your own values on the element. */
        :host([variant="stroke"]) {
          --o-stroke-width: 2;
          --o-back-stroke: var(--o-gray-light);
        }
        :host([variant="stroke"]) .progress-bar {
          fill: none;
          stroke: var(--o-stroke);
          stroke-width: var(--o-stroke-width, 2);
          stroke-linecap: round;
        }
        :host([variant="stroke"]) .progress-bg {
          fill: none;
          stroke: var(--o-back-stroke, var(--o-gray-light));
          stroke-width: var(--o-back-stroke-width, 1);
          stroke-linecap: round;
        }
      </style>
      <svg viewBox="0 0 100 100">
        <path class="hit" vector-effect="non-scaling-stroke"></path>
        <path class="progress-bg" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
        <path class="progress-bar" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
      </svg>
    `;
  }

  update() {
    const attrs = this.getAttributes();
    const isStroke = this.getAttribute('variant') === 'stroke';
    const dBg = isStroke ? this.calculateStrokeArc(attrs, true) : this.calculateArcParameters(attrs, true);
    const dBar = isStroke ? this.calculateStrokeArc(attrs, false) : this.calculateArcParameters(attrs, false);
    this.shadowRoot.querySelector('.progress-bg').setAttribute('d', dBg);
    this.shadowRoot.querySelector('.progress-bar').setAttribute('d', dBar);
    this.updateHitArea(this.shadowRoot.querySelector('.hit'), attrs, 0, attrs.range);
    // The angle of the value goes on the ring, so a .satellite.at-value there
    // sits on it.
    const ring = this.parentElement;
    if (this._valueRing && this._valueRing !== ring) this._valueRing.style.removeProperty('--o-value-angle');
    this._valueRing = ring;
    if (ring) setLayoutProperty(ring, '--o-value-angle', `${this.getProgressAngle(attrs, false)}deg`);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._valueRing?.style.removeProperty('--o-value-angle');
    this._valueRing = null;
  }

  /**
   * variant="stroke": open arc along the orbit radius (no closed band),
   * stroked by CSS. Same progress math as the band variant.
   */
  calculateStrokeArc(attrs, full) {
    const { realRadius } = attrs;
    const arcAngle = Math.max(0, Math.min(this.getProgressAngle(attrs, full), 360));
    if (!(arcAngle > 0) || !(attrs.orbitRadius > 0)) return '';
    const start = -Math.PI / 2;
    return this.linePath(realRadius, start, start + arcAngle * Math.PI / 180);
  }

  getAttributes() {
    const common = super.getCommonAttributes(this);
    const range = Math.max(0, Math.min(360, this.readAngle(common.style, '--o-range', 360)));
    const rawValue = common.style.getPropertyValue('--o-progress').trim();
    const progress = rawValue ? this.readNumber(common.style, '--o-progress', 0) : this.readValue();
    const maxValue = this.readMax(common.style);
    
    return {
      ...common,
      range,
      progress,
      maxValue
    };
  }

  getProgressAngle(attrs, full) {
    const { range, progress, maxValue } = attrs;
    return full ? range : super.getProgressAngle(range, progress, maxValue);
  }

  calculateArcParameters(attrs, full) {
    const { shape, realRadius, arcHeightPercentage, orbitNumber, strokeWidth, arcHeight } = attrs;
    const arcAngle = this.getProgressAngle(attrs, full);
    if (!(arcAngle > 0) || !(attrs.orbitRadius > 0)) return '';
    
    const params = super.calculateCommonArcParameters(
      arcAngle, 
      realRadius, 
      arcHeightPercentage, 
      orbitNumber, 
      shape, 
      strokeWidth, 
      arcHeight
    );
    
    return super.generatePathData(shape, params);
  }
}