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
        svg * {
          pointer-events: visiblePainted;
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
    const dBg = this.calculateArcParameters(attrs, true);
    const dBar = this.calculateArcParameters(attrs, false);
    this.shadowRoot.querySelector('.progress-bg').setAttribute('d', dBg);
    this.shadowRoot.querySelector('.progress-bar').setAttribute('d', dBar);
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