import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, finiteNumber, cssValue, escapeHTML as e, withShared, FORMAT_ATTRS } from './base.js';

const PALETTE = ['#6366f1', '#22c55e', '#eab308', '#f97316', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];

/**
 * <o-donut>: a donut chart from a JSON array. Segments are sibling <o-arc>s
 * with a `value`, so Orbit stacks them one after another around one ring.
 *
 *   .orbit-12 > o-arc                    track
 *   .orbit-12 > o-arc[value] × n         segments (stacked by Orbit)
 *   .orbit-0  > .satellite.at-center     label
 */
export class OrbitDonut extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['data', 'size', 'orbit', 'thickness', 'stroke-width', 'gap', 'track', 'range', 'from', 'label', 'total', 'shape', 'glow'], FORMAT_ATTRS);
  }

  readConfig() {
    const data = this._array('data').map((d, i) => ({
      value: Math.max(0, finiteNumber(d.value)), color: cssValue(d.color, PALETTE[i % PALETTE.length]),
      label: d.label == null ? null : String(d.label)
    }));
    // Normalize through a scaled sum to avoid overflow on large finite values.
    const largest = data.reduce((n, d) => Math.max(n, d.value), 1);
    const sum = data.reduce((n, d) => n + d.value / largest, 0) * largest;
    const requestedTotal = this._num('total', sum);
    const total = requestedTotal > 0 ? requestedTotal : (sum || 1);
    let remaining = 100;
    const weightSum = data.reduce((n, d) => n + d.value / largest, 0) || 1;
    for (const d of data) {
      const pct = Number.isFinite(total) ? d.value / total * 100 : (d.value / largest) / weightSum * 100;
      d.pct = Math.max(0, Math.min(remaining, pct));
      remaining = Math.max(0, remaining - d.pct);
    }
    return {
      data, total, range: Math.max(0, Math.min(360, this._num('range', 360))), from: this._num('from', 0),
      thickness: this._thickness(3), size: this._size('size', '200px'),
      strokeWidth: Math.max(0, this._num('stroke-width', 0)), gap: this._gap(1.5),
      shape: this._str('shape', 'none'), track: this._color('track', null),
      unit: this._unitText(), glow: this.hasAttribute('glow') ? this._glowPx() : null, label: this.getAttribute('label')
    };
  }

  /** A segment value as text; "percent" is its share of the total. */
  _segmentText(cfg, d, i) {
    return `${d.label ?? `Segment ${i + 1}`}: ${this._formatText(d.value, { min: 0, max: cfg.total })}`;
  }

  structuralSignature({ data, total, label, unit, track, ...structure }) {
    return JSON.stringify({ ...structure, count: data.length });
  }

  build(cfg) {
    const ring = `--o-range:${cfg.range}deg;--o-from:${cfg.from}deg;--o-size-ratio:${fixed(cfg.thickness)};`;
    const stroke = cfg.strokeWidth ? `--o-stroke-width:${cfg.strokeWidth};` : '';
    const segments = cfg.data.map((d, i) =>
      `<o-arc class="inner-orbit ok-donut-segment" value="${d.pct.toFixed(4)}" shape="${e(cfg.shape)}" style="${e(`--o-fill:${d.color};${stroke}${cfg.glow == null ? '' : `filter:drop-shadow(0 0 ${cfg.glow}px ${d.color});`}`)}" title="${e(this._segmentText(cfg, d, i))}"></o-arc>`).join('');
    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12" style="${ring}--o-gap:0"><o-arc class="inner-orbit ok-track" value="100"></o-arc></div>
      <div class="orbit-12" style="${ring}--o-gap:${fixed(cfg.gap * 6)}">${segments}</div>
      ${hub(2 * (12 - cfg.thickness) - 1, `${e(cfg.label ?? '')}${cfg.label == null ? '' : e(cfg.unit)}`)}`);
    this._segments = [...this.querySelectorAll('.ok-donut-segment')];
    this._center = this.querySelector('.ok-hub');
  }

  sync(cfg) {
    this._applyTheme({ '--ok-track': cfg.track });
    this._segments?.forEach((arc, i) => {
      const d = cfg.data[i];
      arc.setAttribute('value', d.pct.toFixed(4));
      arc.setAttribute('title', this._segmentText(cfg, d, i));
      arc.style.setProperty('--o-fill', d.color);
      if (cfg.glow != null) arc.style.setProperty('filter', `drop-shadow(0 0 ${cfg.glow}px ${d.color})`);
      else arc.style.removeProperty?.('filter');
    });
    if (this._center) {
      this._center.textContent = cfg.label == null ? '' : `${cfg.label}${cfg.unit}`;
      this._center.hidden = cfg.label == null;
    }
    this._describe([cfg.label == null ? null : `${cfg.label}${cfg.unit}`, ...cfg.data.map((d, i) => this._segmentText(cfg, d, i))].filter(Boolean).join('; ') || 'Empty donut chart');
  }
}

injectStyleOnce('orbit-kit-donut', `
o-donut .ok-track { --o-fill: var(--ok-track, rgba(127,127,127,.12)); --o-stroke: var(--o-fill); }
o-donut .ok-donut-segment { --o-stroke: var(--o-fill); }
`);
define('o-donut', OrbitDonut);
