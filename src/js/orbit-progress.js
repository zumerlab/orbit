import { OrbitBase } from './orbit-base.js';

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
        :host(:hover) {
          --o-fill: var(--o-gray-light);
          --o-stroke: var(--o-fill);
          --o-stroke-width: 1;
          --o-back-fill: transparent;
          --o-back-stroke: none;
          --o-back-stroke-width: 1;
        }
        svg {
          width: 100%;
          height: 100%;
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
        /* variant="stroke": the thin, legible gauge (registro "medidor").
           The default band is a FILLED donut wedge, so everyone building a
           thin gauge tripped on --o-fill/--o-back-fill. With this variant the
           paths are open arcs and the data color lives where you expect it:
           --o-stroke for the bar, --o-back-stroke for the track. */
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
        <path class="progress-bg" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
        <path class="progress-bar" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
      </svg>
    `;
  }

  connectedCallback() {
    this.update();
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      this.observer.disconnect();
      mutations.forEach(() => this.update());
      this.observer.observe(this, { attributes: true, childList: true });
    });
    this.observer.observe(this, { attributes: true, childList: true });
  }

  update() {
    const attrs = this.getAttributes();
    const isStroke = this.getAttribute('variant') === 'stroke';
    const dBg = isStroke ? this.calculateStrokeArc(attrs, true) : this.calculateArcParameters(attrs, true);
    const dBar = isStroke ? this.calculateStrokeArc(attrs, false) : this.calculateArcParameters(attrs, false);
    this.shadowRoot.querySelector('.progress-bg').setAttribute('d', dBg);
    this.shadowRoot.querySelector('.progress-bar').setAttribute('d', dBar);
  }

  /**
   * variant="stroke": open arc along the orbit radius (no closed band),
   * stroked by CSS. Same progress math as the band variant.
   */
  calculateStrokeArc(attrs, full) {
    const { realRadius } = attrs;
    const arcAngle = Math.max(0, Math.min(this.getProgressAngle(attrs, full), 359.99));
    const a0 = -90 * (Math.PI / 180);
    const a1 = (-90 + arcAngle) * (Math.PI / 180);
    const x0 = 50 + realRadius * Math.cos(a0);
    const y0 = 50 + realRadius * Math.sin(a0);
    const x1 = 50 + realRadius * Math.cos(a1);
    const y1 = 50 + realRadius * Math.sin(a1);
    const largeArcFlag = arcAngle > 180 ? 1 : 0;
    return `M ${x0},${y0} A ${realRadius},${realRadius} 0 ${largeArcFlag} 1 ${x1},${y1}`;
  }

  getAttributes() {
    const common = super.getCommonAttributes(this);
    const range = parseFloat(getComputedStyle(this).getPropertyValue('--o-range') || 360);
    const progress = parseFloat(getComputedStyle(this).getPropertyValue('--o-progress') || this.getAttribute('value') || 0);
    const maxValue = parseFloat(this.getAttribute('max')) || 100;
    
    return {
      ...common,
      range,
      progress,
      maxValue
    };
  }

  getProgressAngle(attrs, full) {
    const { range, progress, maxValue } = attrs;
    return full
      ? ((maxValue - 0.00001) / maxValue) * range
      : (progress / maxValue) * range;
  }

  calculateArcParameters(attrs, full) {
    const { shape, realRadius, arcHeightPercentage, orbitNumber, strokeWidth, arcHeight } = attrs;
    const arcAngle = this.getProgressAngle(attrs, full);
    
    const params = super.calculateCommonArcParameters(
      arcAngle, 
      realRadius, 
      arcHeightPercentage, 
      orbitNumber, 
      shape, 
      strokeWidth, 
      arcHeight
    );
    
    return super.generatePathData(shape, params, arcHeight, orbitNumber);
  }
}