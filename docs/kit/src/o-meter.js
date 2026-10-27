import { OrbitKitElement, define, injectStyleOnce, universe, hub, finiteNumber, cssValue, fixed, escapeHTML as e, withShared, RANGE_ATTRS, FORMAT_ATTRS } from './base.js';

/**
 * <o-meter>: a basic needle gauge, kept from 0.x. <o-instrument> does
 * everything it does and more.
 */
export class OrbitMeter extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['value', 'range', 'from', 'size', 'ticks', 'zones', 'fill', 'label', 'needle-color', 'glow'], RANGE_ATTRS, FORMAT_ATTRS);
  }
  readConfig() {
    const { value, min, max, span, step, fraction } = this._range({ min: 0, max: 100, step: 0 });
    const range = Math.max(0, Math.min(360, this._num('range', 270)));
    return {
      value, min, max, span: span || 1, step, fraction, range,
      from: this.hasAttribute('from') ? this._num('from', 0) : this._autoFrom(range),
      zones: this._array('zones').map((z) => ({ from: Math.max(min, finiteNumber(z.from, min)), to: Math.min(max, finiteNumber(z.to, min)), color: cssValue(z.color, this._color('fill', '#6366f1')) })).filter((z) => z.to > z.from),
      size: this._size('size', '220px'), ticks: Math.max(0, Math.min(360, Math.round(this._num('ticks', 9)))),
      needleColor: this._color('needle-color', null), unit: this._unitText(),
      glow: this.getAttribute('glow'), label: this.getAttribute('label')
    };
  }
  structuralSignature({ value, fraction, step, label, unit, needleColor, ...structure }) { return JSON.stringify(structure); }
  build(cfg) {
    const frame = `--o-range:${cfg.range}deg;--o-from:${cfg.from}deg;`;
    const ticks = cfg.ticks ? `<div class="orbit-12 ${cfg.range < 360 ? 'fit-range' : ''}" style="${frame}--o-size-ratio:.7">${'<div class="vector inner-orbit"></div>'.repeat(cfg.ticks)}</div>` : '';
    const zones = cfg.zones.map((z) => {
      const from = cfg.from + (z.from - cfg.min) / cfg.span * cfg.range;
      const style = `--o-fill:${z.color};--o-stroke:${z.color};--o-gap:0;${this._glow(z.color)}`;
      return `<div class="orbit-11" style="--o-range:${cfg.range}deg;--o-from:${fixed(from)}deg;--o-size-ratio:.8"><o-arc class="inner-orbit" value="${((z.to - z.from) / cfg.span * 100).toFixed(4)}" style="${e(style)}"></o-arc></div>`;
    }).join('');
    this.innerHTML = universe(cfg.size, `
      ${ticks}${zones}
      <div class="orbit-0"><div class="vector outer-orbit o-meter-needle" style="--o-size-ratio:9.5;${e(this._glow('var(--ok-meter-needle, var(--ok-hand, #e5e7eb))'))}"></div></div>
      ${hub(6, '', 'ok-hub o-meter-readout')}`);
    this._needle = this.querySelector('.o-meter-needle');
    this._readout = this.querySelector('.o-meter-readout');
  }
  sync(cfg) {
    this._applyTheme({ '--ok-meter-needle': cfg.needleColor });
    const angle = cfg.from - 90 + cfg.fraction * cfg.range;
    this._needle?.style.setProperty('--o-angle-composite', `${fixed(angle)}deg`);
    const range = { min: cfg.min, max: cfg.max };
    const text = cfg.label ?? this._formatText(cfg.value, { ...range, fallback: (v) => String(Math.round(v)) });
    if (this._readout) this._readout.textContent = text;
    this._describe(`${text}; ${this._formatText(cfg.value, range)}, range ${this._format(cfg.min, range)} to ${this._format(cfg.max, range)}`, 'meter');
    this._ariaRange(cfg);
  }
}
injectStyleOnce('orbit-kit-meter', `
o-meter .vector.inner-orbit { background: var(--ok-tick, currentColor); opacity: .7; height: max(1px, .6cqmin); }
o-meter .o-meter-needle { background: var(--ok-meter-needle, var(--ok-hand, #e5e7eb)); height: max(2px, 1.2cqmin); border-radius: 0 3px 3px 0; }
o-meter .o-meter-readout { --ok-hub-size: 1.1em; }
`);
define('o-meter', OrbitMeter);
