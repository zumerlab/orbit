/**
 * <o-instrument> — cockpit / dashboard instrument gauge. A flagship-grade,
 * preset-driven needle gauge for automotive, aviation and computer readouts.
 *
 * Anatomy (all in the light DOM, aligned in one --o-from/--o-range frame so
 * ticks, labels, color zones and the needle agree). The dial is the universe:
 *
 *   case > .bigbang > .gravity-spot
 *     ├── full sweep:  .orbit-12 (filled)             dial face + bezel
 *     │   partial(≤180): .orbit-11 > <o-arc>          track band (no round case)
 *     ├── .orbit-11 fit-range > .vector × minor ticks
 *     ├── .orbit-11 fit-range > .vector × major ticks
 *     ├── .orbit-11 (per zone, own --o-from) > <o-arc> color/redline zones
 *     ├── .orbit-9  fit-range > .satellite × labels   numeric scale
 *     ├── .orbit-0  > .vector needle (rotates to value)
 *     └── .orbit-4  > readout (value + unit + caption)
 *
 *   <o-instrument preset="tachometer" value="6.2"></o-instrument>
 *   <o-instrument preset="airspeed" value="120"></o-instrument>
 *   <o-instrument preset="fuel"></o-instrument>          <!-- quarter arc, no round case -->
 *   <o-instrument min="0" max="100" value="40" unit="%" label="LOAD"
 *     zones='[{"from":85,"to":100,"color":"#ef4444"}]'></o-instrument>
 *
 * The needle is a fixed-length vector that ROTATES to the value (so it's always
 * visible, even at zero) — pointed by `--o-angle-composite`. Only `value` is
 * cheap to change; the dial rebuilds when the scale, zones, case or theme change.
 */
import { OrbitKitElement, define, injectStyleOnce, finiteNumber, arrayData, cssValue, fixed, escapeHTML as e, withShared, RANGE_ATTRS, FORMAT_ATTRS } from './base.js';

// WHT follows the theme's strong color (--ok-hand), so a white needle stays visible on a light face.
const RED = '#ef4444', YEL = '#eab308', GRN = '#22c55e', AMB = '#f59e0b', WHT = 'var(--ok-hand, #e5e7eb)';

// Real instruments as preset bundles; any explicit attribute overrides them.
const PRESETS = {
  tachometer:  { min: 0, max: 8, range: 270, ticks: 9, minor: 5, unit: '', label: 'RPM x1000',
                 zones: [{ from: 6.5, to: 8, color: RED }], value: 0.8, accent: RED },
  speedometer: { min: 0, max: 240, range: 270, ticks: 9, minor: 2, unit: 'km/h', label: 'Speed', value: 0, accent: WHT },
  fuel:        { min: 0, max: 1, range: 90, from: 270, ticks: 3, minor: 4, unit: '', label: 'Fuel', digital: false,
                 tickLabels: ['E', '½', 'F'], zones: [{ from: 0, to: 0.12, color: RED }], value: 0.66, accent: AMB },
  temp:        { min: 0, max: 1, range: 90, from: 270, ticks: 3, minor: 4, unit: '', label: 'Temp', digital: false,
                 tickLabels: ['C', '', 'H'], zones: [{ from: 0.82, to: 1, color: RED }], value: 0.45, accent: RED },
  boost:       { min: -1, max: 2, range: 240, ticks: 7, minor: 5, unit: 'bar', label: 'Boost',
                 zones: [{ from: 1.2, to: 2, color: RED }], value: 0, accent: '#06b6d4' },
  voltmeter:   { min: 8, max: 16, range: 180, ticks: 5, minor: 5, unit: 'V', label: 'Volts',
                 zones: [{ from: 8, to: 11, color: RED }, { from: 11, to: 12, color: YEL }], value: 13.8, accent: GRN },
  airspeed:    { min: 0, max: 200, range: 300, ticks: 11, minor: 5, unit: 'kt', label: 'Airspeed',
                 zones: [{ from: 40, to: 140, color: GRN }, { from: 140, to: 170, color: YEL }, { from: 170, to: 200, color: RED }],
                 value: 0, accent: WHT },
  altimeter:   { min: 0, max: 10, range: 360, ticks: 10, minor: 5, unit: 'x1000 ft', label: 'Altitude', value: 0, accent: WHT },
  cpu:         { min: 0, max: 100, range: 270, ticks: 6, minor: 5, unit: '%', label: 'CPU',
                 zones: [{ from: 85, to: 100, color: RED }], value: 0, accent: GRN },
  gpu:         { min: 0, max: 100, range: 270, ticks: 6, minor: 5, unit: '%', label: 'GPU',
                 zones: [{ from: 85, to: 100, color: RED }], value: 0, accent: '#a855f7' },
  vu:          { min: -21, max: 3, range: 120, ticks: 5, minor: 5, unit: 'dB', label: 'VU',
                 zones: [{ from: 0, to: 3, color: RED }], value: -8, accent: YEL }
};
const CASES = ['round', 'square', 'rounded', 'bare'];

const INST_CSS = `
o-instrument { --ok-font-size: 7.2cqmin; }
o-instrument .ok-inst-case { box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
o-instrument .ok-inst-case--square, o-instrument .ok-inst-case--rounded { padding: 7%; }
o-instrument .ok-inst-case--round   { border-radius: 50%; }
o-instrument .ok-inst-case--square  { border-radius: 9%; }
o-instrument .ok-inst-case--rounded { border-radius: 22%; }
o-instrument .ok-inst-case--bare    { background: transparent; }
o-instrument .ok-inst-case--square,
o-instrument .ok-inst-case--rounded {
  background: var(--ok-inst-case-bg, var(--ok-case, linear-gradient(160deg, #232a34, #11151b)));
  box-shadow: 0 10px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);
}
o-instrument .ok-inst-face { color: var(--ok-inst-label, var(--ok-text, #cbd5e1)); }
o-instrument .ok-inst-dial {
  background: var(--ok-inst-face, var(--ok-face, radial-gradient(circle at 50% 35%, #1b212b, #0a0d12)));
  box-shadow: inset 0 0 0 4px var(--ok-inst-bezel, var(--ok-bezel, #2a3340)), inset 0 4px 18px rgba(0,0,0,.65);
}
o-instrument .ok-inst-track  { --o-fill: var(--ok-inst-track, var(--ok-track, #171c24)); --o-stroke: var(--o-fill); }
o-instrument .ok-inst-tick   { background: var(--ok-inst-tick, var(--ok-tick, rgba(203,213,225,.45))); height: 1px; }
o-instrument .ok-inst-tick-M { background: var(--ok-inst-tick-M, var(--ok-hand, #e6edf3)); height: 2px; border-radius: 1px; }
o-instrument .ok-inst-num    { font-weight: 700; font-variant-numeric: tabular-nums; font-size: .8em; white-space: nowrap; }
o-instrument .ok-inst-needle { background: var(--ok-inst-accent, var(--ok-accent, #ef4444)); height: max(2px, 1.2cqmin); border-radius: 0 3px 3px 0; transition: transform .25s cubic-bezier(.3,.7,.4,1); }
@media (prefers-reduced-motion: reduce) { o-instrument .ok-inst-needle { transition: none; } }
o-instrument .ok-inst-readout {
  display: flex; flex-direction: column; align-items: center; line-height: 1.05;
}
o-instrument .ok-inst-value  { font-weight: 800; font-variant-numeric: tabular-nums; font-size: 1.5em; white-space: nowrap; color: var(--ok-inst-readout-color, var(--ok-hand, #f8fafc)); }
o-instrument .ok-inst-unit   { font-size: .62em; opacity: .7; white-space: nowrap; }
o-instrument .ok-inst-cap-label { font-size: .6em; font-weight: 700; opacity: .65; margin-top: .15em; white-space: nowrap; }
o-instrument .ok-inst-cap    { background: var(--ok-inst-accent, var(--ok-accent, #ef4444)); box-shadow: 0 0 0 3px var(--ok-inst-hub, var(--ok-surface, #0a0d12)); }
o-instrument.ok-glow .ok-inst-needle { filter: drop-shadow(0 0 var(--ok-inst-glow, 5px) var(--ok-inst-accent, #ef4444)); }
`;

export class OrbitInstrument extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['value', 'range', 'from', 'ticks', 'minor', 'zones',
            'tick-labels', 'label', 'redline', 'preset', 'case', 'size',
            'digital', 'face', 'bezel', 'accent', 'needle-color', 'tick-color', 'glow'], RANGE_ATTRS, FORMAT_ATTRS);
  }

  _preset() { return PRESETS[this.getAttribute('preset')] || {}; }

  _pNum(name, key, dflt) {
    const v = this.getAttribute(name);
    const p = this._preset();
    return finiteNumber(v, p[key] != null ? p[key] : dflt);
  }
  _pStr(name, key, dflt) {
    const v = this.getAttribute(name);
    if (v != null) return v;
    const p = this._preset();
    return p[key] != null ? p[key] : dflt;
  }
  _pArr(name, key, dflt) {
    const v = this.getAttribute(name);
    if (v != null && v.trim() !== '') { try { const parsed = JSON.parse(v); if (Array.isArray(parsed)) return parsed; } catch { /* fall through */ } }
    const p = this._preset();
    return p[key] != null ? p[key] : dflt;
  }

  readConfig() {
    const range = Math.max(0, Math.min(360, this._pNum('range', 'range', 270)));
    const p = this._preset();
    const r = this._range({ min: p.min ?? 0, max: p.max ?? 100, step: 0, value: p.value });
    const { min, max } = r;
    const span = r.span || 1;
    const zones = arrayData(this._pArr('zones', 'zones', [])).map((z) => ({
      from: Math.max(min, finiteNumber(z.from, min)), to: Math.min(max, finiteNumber(z.to, min)), color: cssValue(z.color, RED)
    })).filter((z) => z.to > z.from);
    // `redline=` is sugar for a red zone from that value to max.
    const redline = this.getAttribute('redline');
    const redlineValue = finiteNumber(redline, max);
    if (redline != null && redlineValue < max) zones.push({ from: Math.max(min, redlineValue), to: max, color: RED });

    // Partial-sweep gauges (fuel/temp/…) read as an arc band, not a round watch,
    // so they default to a "bare" case (no round bezel) unless told otherwise.
    const partial = range <= 180;
    const userCase = this.getAttribute('case') ?? this._preset().case ?? null;
    let caseShape = userCase || (partial ? 'bare' : 'round');
    if (!CASES.includes(caseShape)) caseShape = partial ? 'bare' : 'round';

    return {
      value: r.value, fraction: r.fraction, step: r.step,
      min, max, span, range, zones, caseShape, partial,
      from: this.hasAttribute('from') ? this._pNum('from', null, 0) : (this._preset().from ?? (range === 360 ? 0 : this._autoFrom(range))),
      ticks: Math.max(2, Math.min(360, Math.round(this._pNum('ticks', 'ticks', 7)))),
      minor: Math.max(0, Math.min(60, Math.round(this._pNum('minor', 'minor', 5)))),
      tickLabels: this._pArr('tick-labels', 'tickLabels', null),
      unit: this.getAttribute('format') === 'unit' ? '' : this._pStr('unit', 'unit', ''),
      label: this._pStr('label', 'label', ''),
      digital: this.hasAttribute('digital')
        ? this.getAttribute('digital') !== 'false'
        : (this._preset().digital !== false),
      size: this._size('size', '240px'),
      glow: this.getAttribute('glow'),
      accent: cssValue(this._pStr('accent', 'accent', null), null),
      theme: ['face', 'bezel', 'needle-color', 'tick-color'].map((a) => this.getAttribute(a)).join('|'),
      // Tick labels are part of the dial, so the number format rebuilds it.
      format: [...['format', 'locale', 'decimals', 'currency'].map((a) => this.getAttribute(a)), this._formatter ? 'fn' : '', this.getAttribute('format') === 'unit' ? this.getAttribute('unit') : ''].join('|')
    };
  }

  structuralSignature(cfg) {
    const { value, fraction, step, unit, label, ...rest } = cfg;
    return JSON.stringify(rest);
  }

  build(cfg) {
    injectStyleOnce('orbit-kit-instrument', INST_CSS);
    this.classList.toggle('ok-glow', cfg.glow != null);

    this._applyTheme({
      '--ok-inst-accent': this.getAttribute('needle-color') ?? cfg.accent,
      '--ok-inst-face': this.getAttribute('face'), '--ok-inst-bezel': this.getAttribute('bezel'),
      '--ok-inst-tick': this.getAttribute('tick-color'),
      '--ok-inst-glow': cfg.glow == null ? null : `${Math.max(0, this._num('glow', 5))}px`
    });

    const fromVar = `--o-range:${cfg.range}deg;--o-from:${cfg.from}deg;`;

    // Partial gauges (a 90° fuel arc) otherwise sit crammed in one quadrant.
    // Center the content by moving the gravity-spot so the arc's bounding box
    // (plus the center pivot) is centered in the square box.
    let centering = '';
    if (cfg.partial && cfg.caseShape === 'bare') {
      const R = 50 * 11 / 12; // the tick ring, in cqmin of the universe
      let minX = 0, maxX = 0, minY = 0, maxY = 0; // seed with the center pivot
      for (let k = 0; k <= 24; k++) {
        const p = (cfg.from + (cfg.range * k) / 24) * Math.PI / 180;
        const x = Math.sin(p), y = -Math.cos(p);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      centering = `translate:${fixed(-(minX + maxX) / 2 * R, 1)}cqmin ${fixed(-(minY + maxY) / 2 * R, 1)}cqmin;`;
    }

    // Face: a round dial for full sweeps, or a neutral track band for partial
    // gauges (so a quarter-arc fuel gauge isn't trapped in a round bezel).
    const band = `--o-size-ratio:.55;--o-gap:0;`;
    const face = cfg.caseShape === 'bare'
      ? `<div class="orbit-11" style="${fromVar}${band}"><o-arc class="inner-orbit ok-inst-track" value="100"></o-arc></div>`
      : '<div class="orbit-12 ok-inst-dial ok-surface"></div>';

    // --- ticks: major (count) + minor (between) over the range ---
    const majorN = cfg.ticks;
    const closed = cfg.range === 360;
    const fit = closed ? '' : 'fit-range';
    const minorN = cfg.minor > 0 ? (closed ? majorN * (cfg.minor + 1) : (majorN - 1) * (cfg.minor + 1) + 1) : 0;
    const minorTicks = minorN
      ? `<div class="orbit-11 ${fit}" style="${fromVar}--o-size-ratio:.3">${Array.from({ length: minorN }, () =>
          '<div class="vector inner-orbit ok-inst-tick"></div>').join('')}</div>`
      : '';
    const majorTicks = `<div class="orbit-11 ${fit}" style="${fromVar}--o-size-ratio:.6">${Array.from({ length: majorN }, () =>
      '<div class="vector inner-orbit ok-inst-tick-M"></div>').join('')}</div>`;

    // --- numeric / custom scale labels ---
    const labels = Array.from({ length: majorN }, (_, i) => {
      const txt = cfg.tickLabels ? (cfg.tickLabels[i] ?? '')
        : this._format(cfg.min + (i * cfg.span) / (closed ? majorN : majorN - 1), { kind: 'tick', min: cfg.min, max: cfg.max, fallback: (v) => this._fmtTick(v) });
      return `<div class="satellite"><div class="capsule ok-inst-num">${e(txt)}</div></div>`;
    }).join('');
    const labelRing = `<div class="orbit-9 ${fit}" style="${fromVar}">${labels}</div>`;

    // --- color zones: each on its own ring so non-contiguous zones land right ---
    const zones = cfg.zones.map((z) => {
      const startA = cfg.from + ((z.from - cfg.min) / cfg.span) * cfg.range;
      const pct = ((z.to - z.from) / cfg.span) * 100;
      const style = `--o-range:${cfg.range}deg;--o-from:${fixed(startA)}deg;${band}`;
      const arc = `--o-fill:${z.color};--o-stroke:${z.color}${cfg.glow != null ? `;filter:drop-shadow(0 0 ${Math.max(0, this._num('glow', 4))}px ${z.color})` : ''}`;
      return `<div class="orbit-11" style="${style}"><o-arc class="inner-orbit ok-inst-zone" value="${pct.toFixed(3)}" style="${e(arc)}"></o-arc></div>`;
    }).join('');

    const readout = `<div class="orbit-4"><div class="satellite angle-180"><div class="capsule ok-inst-readout">
      ${cfg.digital ? '<span class="ok-inst-value"></span>' : ''}
      <span class="ok-inst-unit">${e(cfg.unit)}</span>
      <span class="ok-inst-cap-label">${e(cfg.label)}</span>
    </div></div></div>`;

    this.innerHTML = `
      <div class="ok-inst-case ok-inst-case--${cfg.caseShape}${cfg.caseShape === 'square' || cfg.caseShape === 'rounded' ? ' ok-surface' : ''}" style="width:${e(cfg.size)};aspect-ratio:1">
        <div class="bigbang" style="width:100%">
          <div class="gravity-spot ok-inst-face"${centering ? ` style="${centering}"` : ''}>
            ${face}
            ${minorTicks}${majorTicks}
            ${zones}
            ${labelRing}
            ${readout}
            <div class="orbit-0">
              <div class="vector outer-orbit ok-inst-needle" style="--o-size-ratio:9.6"></div>
              <div class="satellite at-center ok-inst-cap" style="--o-size-ratio:.8"></div>
            </div>
          </div>
        </div>
      </div>`;

    this._needle = this.querySelector('.ok-inst-needle');
    this._value = this.querySelector('.ok-inst-value');
    this._unit = this.querySelector('.ok-inst-unit');
    this._caption = this.querySelector('.ok-inst-cap-label');
    this._readout = this.querySelector('.ok-inst-readout');
  }

  sync(cfg) {
    const frac = cfg.fraction;
    // The arc start (value 0) sits at screen angle `from + 270`; the needle is
    // a full-length vector rotated to the value's screen angle (always visible).
    const deg = (((cfg.from + 270 + frac * cfg.range) % 360) + 360) % 360;
    if (this._needle) this._needle.style.setProperty('--o-angle-composite', `${deg.toFixed(2)}deg`);
    const range = { min: cfg.min, max: cfg.max };
    const reading = this._format(cfg.value, { ...range, fallback: (v) => this._fmtValue(v, cfg.span) });
    if (this._value) this._value.textContent = reading;
    if (this._unit) { this._unit.textContent = cfg.unit; this._unit.hidden = !cfg.unit; }
    if (this._caption) { this._caption.textContent = cfg.label; this._caption.hidden = !cfg.label; }
    if (this._readout) this._readout.hidden = !cfg.digital && !cfg.label && !cfg.unit;
    const tick = (v) => this._format(v, { ...range, kind: 'tick', fallback: String });
    this._describe(`${cfg.label ? cfg.label + ': ' : ''}${reading}${cfg.unit}; range ${tick(cfg.min)} to ${tick(cfg.max)}`, 'meter');
    this._ariaRange(cfg, cfg.value, this._formatText(cfg.value, { ...range, kind: 'aria', fallback: (v) => this._fmtValue(v, cfg.span) }, cfg.unit));
  }

  /** Tick-scale label: integers bare, otherwise one decimal. */
  _fmtTick(v) {
    return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '');
  }
  /** Readout value: more precision for small spans (bar, dB), integer for big. */
  _fmtValue(v, span) {
    if (span <= 3) return v.toFixed(1);
    if (span <= 20) return v.toFixed(1).replace(/\.0$/, '');
    return String(Math.round(v));
  }
}

define('o-instrument', OrbitInstrument);
