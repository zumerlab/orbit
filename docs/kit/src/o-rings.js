import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, finiteNumber, cssValue, normalizeRange, escapeHTML as e, withShared, FORMAT_ATTRS } from './base.js';
const PALETTE = ['#fa114f', '#a3ff00', '#00fff0', '#ffd60a', '#ff9500'];

/**
 * <o-rings>: concentric activity rings, outermost first.
 *
 * Ring i sits on orbit (12 - i × spacing) with its band hugging the inside of
 * that lane (inner-orbit), so any thickness fits and the outer ring touches
 * the edge of the universe. Each ring is a track <o-arc> under an <o-progress>.
 */
export class OrbitRings extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['data', 'size', 'thickness', 'stroke-width', 'track', 'shape', 'range', 'from', 'spacing', 'step', 'label', 'min', 'max', 'glow'], FORMAT_ATTRS);
  }
  readConfig() {
    const range = Math.max(0, Math.min(360, this._num('range', 360)));
    // Each ring has its own min/max; the attributes are the defaults (0 and 100).
    const lo = this._num('min', 0), hi = this._num('max', 100);
    const data = this._array('data').map((d, i) => {
      const min = finiteNumber(d.min, lo);
      let max = finiteNumber(d.max, hi);
      if (!(max > min)) max = min + 100;
      const r = normalizeRange({ min, max });
      return {
        value: Math.min(r.max, Math.max(r.min, finiteNumber(d.value, r.min))), min: r.min, max: r.max,
        color: cssValue(d.color, PALETTE[i % PALETTE.length]), label: d.label == null ? null : String(d.label)
      };
    });
    // Spacing between ring centers, in whole lanes: as wide as fits, 1 to 3.
    const n = Math.max(1, data.length);
    const base = Math.max(1, Math.min(3, Math.floor(10 / n)));
    // `spacing` (1.0: `step`) multiplies the distance between rings.
    let spacing = Math.max(1, Math.round(base * Math.max(1, this._num('spacing', this._num('step', 1)))));
    while (spacing > 1 && (n - 1) * spacing > 10) spacing--;
    const thickness = this._thickness(base * .86, spacing);
    return {
      data, range, from: this.hasAttribute('from') ? this._num('from', 0) : (range === 360 ? 0 : this._autoFrom(range)),
      size: this._size('size', '200px'), thickness, spacing,
      strokeWidth: Math.max(0, this._num('stroke-width', 0)),
      track: this._color('track', ''), shape: this._str('shape', 'rounded'),
      unit: this._unitText(), glow: this.hasAttribute('glow') ? this._glowPx() : null, label: this.getAttribute('label')
    };
  }
  structuralSignature({ data, label, unit, track, ...structure }) { return JSON.stringify({ ...structure, count: data.length }); }
  _track(cfg, d) { return cfg.track || `color-mix(in srgb, ${d.color} 18%, transparent)`; }
  build(cfg) {
    const stroke = cfg.strokeWidth ? `--o-stroke-width:${cfg.strokeWidth};` : '';
    const rings = cfg.data.map((d, i) => {
      const ring = `class="orbit-${12 - i * cfg.spacing}" style="--o-range:${cfg.range}deg;--o-from:${cfg.from}deg;--o-size-ratio:${fixed(cfg.thickness)};--o-gap:0"`;
      const glow = cfg.glow == null ? '' : `filter:drop-shadow(0 0 ${cfg.glow}px ${d.color});`;
      return `<div ${ring}><o-arc class="inner-orbit ok-rings-track" value="100" shape="${e(cfg.shape)}" style="${e(`--o-fill:${this._track(cfg, d)};${stroke}`)}"></o-arc></div>` +
        `<div ${ring}><o-progress class="inner-orbit ok-rings-value" value="${d.value - d.min}" max="${d.max - d.min}" shape="${e(cfg.shape)}" style="${e(`--o-fill:${d.color};${stroke}${glow}`)}"></o-progress></div>`;
    }).join('');
    const hole = 12 - (cfg.data.length - 1) * cfg.spacing - cfg.thickness;
    this.innerHTML = universe(cfg.size, `${rings}
      ${hub(2 * hole - .5, `${e(cfg.label ?? '')}${cfg.label == null ? '' : e(cfg.unit)}`)}`);
    this._rings = [...this.querySelectorAll('.ok-rings-value')];
    this._tracks = [...this.querySelectorAll('.ok-rings-track')];
    this._center = this.querySelector('.ok-hub');
  }
  sync(cfg) {
    this._rings?.forEach((ring, i) => {
      const d = cfg.data[i];
      ring.setAttribute('max', String(d.max - d.min));
      ring.setAttribute('value', String(d.value - d.min));
      ring.style.setProperty('--o-fill', d.color);
      if (cfg.glow != null) ring.style.setProperty('filter', `drop-shadow(0 0 ${cfg.glow}px ${d.color})`);
      else ring.style.removeProperty?.('filter');
      this._tracks[i]?.style.setProperty('--o-fill', this._track(cfg, d));
    });
    if (this._center) {
      this._center.textContent = cfg.label == null ? '' : `${cfg.label}${cfg.unit}`;
      this._center.hidden = cfg.label == null;
    }
    this._describe([cfg.label == null ? null : `${cfg.label}${cfg.unit}`, ...cfg.data.map((d, i) => `${d.label ?? `Ring ${i + 1}`}: ${this._format(d.value, { min: d.min, max: d.max })} of ${this._formatText(d.max, { min: d.min, max: d.max })}`)].filter(Boolean).join('; ') || 'Empty activity rings');
  }
}
injectStyleOnce('orbit-kit-rings', `
o-rings :is(.ok-rings-track, .ok-rings-value) { --o-stroke: var(--o-fill); }
o-rings .ok-hub { --ok-hub-size: 1.2em; }
`);
define('o-rings', OrbitRings);
