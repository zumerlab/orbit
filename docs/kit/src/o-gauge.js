import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, escapeHTML as e, withShared, RANGE_ATTRS, FORMAT_ATTRS } from './base.js';

/**
 * <o-gauge>: one value on an arc, with a readout in the middle.
 *
 *   .bigbang (width = size)
 *   └── .gravity-spot
 *       ├── .orbit-12 > o-arc.inner-orbit     track (thickness lanes, flush with the edge)
 *       ├── .orbit-12 > o-arc.inner-orbit     value
 *       └── .orbit-0  > .satellite.at-center  readout
 *
 * Value and label updates patch the existing arc; nothing is rebuilt.
 */
export class OrbitGauge extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['value', 'range', 'from', 'orbit', 'thickness', 'size', 'label', 'fill', 'track', 'stroke-width', 'shape', 'glow'], RANGE_ATTRS, FORMAT_ATTRS);
  }

  readConfig() {
    const range = Math.max(0, Math.min(360, this._num('range', 270)));
    const { value, min, max, step, fraction } = this._range({ min: 0, max: 100, step: 0 });
    return {
      value, min, max, step, fraction, range,
      from: this.hasAttribute('from') ? this._num('from', 0) : this._autoFrom(range),
      thickness: this._thickness(2.4), size: this._size('size', '200px'),
      fill: this._color('fill', null), track: this._color('track', null),
      strokeWidth: Math.max(0, this._num('stroke-width', 0)), shape: this._str('shape', 'rounded'),
      unit: this._unitText(), label: this.getAttribute('label'), glow: this.hasAttribute('glow') ? this._glowPx() : null
    };
  }

  structuralSignature({ value, fraction, min, max, step, label, unit, fill, track, ...structure }) { return JSON.stringify(structure); }
  // The 0.x helper names keep working.
  _readConfig() { return this.readConfig(); }
  render() { this._render(); }

  build(cfg) {
    const ring = `--o-range:${cfg.range}deg;--o-from:${cfg.from}deg;--o-size-ratio:${fixed(cfg.thickness)};--o-gap:0`;
    // stroke-width (0.x): an outline in the band's own color, in px.
    const stroke = cfg.strokeWidth ? `--o-stroke-width:${cfg.strokeWidth};` : '';
    const glow = cfg.glow == null ? '' : `filter:drop-shadow(0 0 ${cfg.glow}px var(--ok-fill, #6366f1));`;
    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12" style="${ring}"><o-arc class="inner-orbit ok-track" value="100" shape="${e(cfg.shape)}"${stroke ? ` style="${stroke}"` : ''}></o-arc></div>
      <div class="orbit-12" style="${ring}"><o-arc class="inner-orbit ok-value o-gauge-fill" value="0" shape="${e(cfg.shape)}" ${stroke || glow ? ` style="${stroke}${glow}"` : ''}></o-arc></div>
      ${hub(2 * (12 - cfg.thickness) - 1)}`);
    this._fill = this.querySelector('.o-gauge-fill');
    this._center = this.querySelector('.ok-hub');
  }

  sync(cfg) {
    this._applyTheme({ '--ok-fill': cfg.fill, '--ok-track': cfg.track });
    const range = { min: cfg.min, max: cfg.max };
    const reading = this._formatText(cfg.value, range);
    const text = cfg.label ?? reading;
    this._fill?.setAttribute('value', (cfg.fraction * 100).toFixed(2));
    if (this._center) this._center.textContent = text;
    this._describe(`${text}; ${this._format(cfg.value, range)} of ${this._formatText(cfg.max, range)}`, 'meter');
    this._ariaRange(cfg);
  }
  _build(cfg) { this.build(cfg); }
  _sync(cfg) { this.sync(cfg); }
}

const GAUGE_CSS = `
o-gauge .ok-track { --o-fill: var(--ok-track, #262d38); --o-stroke: var(--o-fill); }
o-gauge .ok-value { --o-fill: var(--ok-fill, #6366f1); --o-stroke: var(--o-fill); transition: filter .2s; }
`;
injectStyleOnce('orbit-kit-gauge', GAUGE_CSS);
define('o-gauge', OrbitGauge);
