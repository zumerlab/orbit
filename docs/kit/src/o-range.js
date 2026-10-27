/**
 * <o-range>: a circular range slider. Two handles on one ring pick a start and
 * an end, like the bedtime dial of a phone. Drag a handle, drag the band to
 * move both, tap the track to bring the closer handle there, or focus a handle
 * and use the keys. The middle shows the span.
 *
 *   .bigbang (width = size)
 *   └── .gravity-spot
 *       ├── .orbit-12 > o-arc.inner-orbit        track (interactive)
 *       ├── .orbit-12 > o-arc.inner-orbit        band: --o-from is the start, value the span
 *       ├── .orbit-N  > .vector × ticks          dial marks
 *       ├── .orbit-M  > .satellite × numbers     hours or values
 *       ├── .orbit-0  > .satellite.at-center     span readout
 *       └── .orbit-12 > .satellite × 2           handles, placed by angle (role="slider")
 *
 * Modes: numbers (min / max / step, the default) or mode="time": a 24-hour
 * dial in minutes, shown as 24h or 12h clock times (`hours`). A time range
 * wraps through midnight; a number range wraps only with `wrap`.
 * The value is "start-end": "22:30-06:45" or "20-80". It is a form control.
 * Events: `input` while it changes, `change` when a gesture or key press ends;
 * detail: { value, start, end, span }.
 */
import { OrbitKitElement, FormControl, define, injectStyleOnce, universe, hub, fixed, escapeHTML as e, finiteNumber, safeIcon, pointerAngle, valueAtAngle, withShared, RANGE_ATTRS, FORMAT_ATTRS, FORM_ATTRS } from './base.js';

const DAY = 1440;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mod = (v, n) => ((v % n) + n) % n;
const tidy = (n) => Number(Number(n).toPrecision(12));
const pad = (n) => String(n).padStart(2, '0');

/** "22:30" or "7:05" → minutes after midnight; null when it is not a time. */
export function parseClock(value) {
  const m = /^\s*(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*$/.exec(String(value ?? ''));
  if (!m || +m[1] > 24 || +m[2] > 59) return null;
  return (+m[1] * 60 + +m[2]) % DAY;
}

/** Minutes → "HH:MM" (24h), the form and attribute format. */
export const clockValue = (mins) => `${pad(Math.floor(mod(mins, DAY) / 60))}:${pad(Math.round(mod(mins, DAY)) % 60)}`;

/** Minutes → "22:30" or "10:30 PM" for people. */
export function clockText(mins, twelve) {
  const t = Math.round(mod(mins, DAY)), h = Math.floor(t / 60), m = t % 60;
  return twelve ? `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}` : `${pad(h)}:${pad(m)}`;
}

/** A span of minutes → [[8, 'h'], [15, 'min']]. */
export function spanParts(mins) {
  const t = Math.round(mins), h = Math.floor(t / 60), m = t % 60;
  if (!h) return [[m, 'min']];
  return m ? [[h, 'h'], [m, 'min']] : [[h, 'h']];
}

/** The hour cycle of a locale: true for 12-hour clocks (en-US), false for 24 (de, en-GB). */
export function twelveHour(locale) {
  try {
    const cycle = new Intl.DateTimeFormat(locale || undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h12' || cycle === 'h11';
  } catch { return false; }
}

/** "20-80", "-10--5", "22:30-06:45" → [start, end] as text, or null. */
export function splitPair(value) {
  if (Array.isArray(value)) return value.length === 2 ? value.map(String) : null;
  if (value && typeof value === 'object') return 'start' in value && 'end' in value ? [String(value.start), String(value.end)] : null;
  const m = /^\s*(-?[\d.:]+(?:e[+-]?\d+)?)\s*(?:-|–|\/|,)\s*(-?[\d.:]+(?:e[+-]?\d+)?)\s*$/i.exec(String(value ?? ''));
  return m ? [m[1], m[2]] : null;
}

/* Small handle icons. They are ours, so they skip safeIcon. */
const ICONS = {
  moon: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.6 10.1A5.9 5.9 0 0 1 5.9 2.4a5.9 5.9 0 1 0 7.7 7.7z"/></svg>',
  sun: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="2.8"/><path d="M8 1.6v1.5M8 12.9v1.5M1.6 8h1.5M12.9 8h1.5M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1"/></svg>',
  bell: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1.8a4.2 4.2 0 0 0-4.2 4.2v2.7L2.6 11.2h10.8l-1.2-2.5V6A4.2 4.2 0 0 0 8 1.8zM6.3 12.4a1.7 1.7 0 0 0 3.4 0z"/></svg>'
};
const icon = (name) => (name == null || name === '' || name === 'none' ? '' : ICONS[name] ?? safeIcon(name));

const RANGE_CSS = `
o-range { display: inline-block; vertical-align: middle; -webkit-tap-highlight-color: transparent; }
o-range:not([data-disabled]) { touch-action: none; }
o-range .ok-track { --o-fill: var(--ok-track, #1f2630); --o-stroke: var(--o-fill); }
o-range .ok-value { --o-fill: var(--ok-fill, #4fd1c5); --o-stroke: var(--o-fill); }
o-range .ok-range-track { cursor: pointer; }
o-range .ok-range-band { cursor: grab; }
o-range .ok-range-thumb { pointer-events: none; }
o-range .ok-range-handle {
  width: 94%; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; cursor: grab; pointer-events: auto;
  background: var(--ok-range-handle, var(--ok-surface, #12161c));
  color: var(--ok-range-icon, var(--ok-fill, #4fd1c5));
  box-shadow: 0 1px 4px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.07);
}
o-range .ok-range-handle svg { width: 64%; height: 64%; }
o-range .ok-range-handle:empty::after { content: ""; width: 28%; aspect-ratio: 1; border-radius: 50%; background: currentColor; }
o-range.is-dragging, o-range.is-dragging * { cursor: grabbing; }
o-range[data-disabled] .ok-range-track, o-range[data-disabled] .ok-range-band, o-range[data-disabled] .ok-range-handle { cursor: default; }
o-range[data-disabled] > .bigbang { opacity: .5; }
o-range .ok-range-tick { background: var(--ok-tick, currentColor); opacity: .28; height: max(1px, .35cqmin); }
o-range .ok-range-tick.is-major { opacity: .6; height: max(1px, .6cqmin); }
o-range .ok-range-num { font-size: .52em; line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums; opacity: .5; }
o-range .ok-range-num.is-major { opacity: .9; font-weight: 600; }
o-range .ok-range-num small { font-size: .78em; margin-left: .08em; font-weight: 500; }
o-range .ok-range-hub { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .3em; font-weight: 400; white-space: nowrap; }
o-range .ok-range-span { font-size: 1.05em; font-weight: 650; letter-spacing: -.02em; line-height: 1; }
o-range .ok-range-span small { font-size: .5em; font-weight: 500; opacity: .65; margin: 0 .3em 0 .12em; letter-spacing: 0; }
o-range .ok-range-span small:last-child { margin-right: 0; }
o-range .ok-range-label { font-size: .42em; font-weight: 500; opacity: .6; }
o-range .ok-range-times { font-size: .37em; font-weight: 500; opacity: .75; }
`;

export class OrbitRange extends FormControl(OrbitKitElement) {
  static get observedAttributes() {
    return withShared(['start', 'end', 'mode', 'hours', 'wrap', 'min-span', 'max-span', 'range', 'from',
      'size', 'thickness', 'fill', 'track', 'ticks', 'numbers', 'label', 'start-label', 'end-label',
      'start-icon', 'end-icon', 'glow'], RANGE_ATTRS, FORMAT_ATTRS, FORM_ATTRS);
  }

  constructor() {
    super();
    for (const name of ['_onDown', '_onMove', '_onUp', '_onKey']) this[name] = this[name].bind(this);
    this._defaults = {};
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // start / end set by the author are the defaults a form reset goes back to.
    if ((name === 'start' || name === 'end') && !this._writing) this._defaults[name] = newValue;
    if (this._quiet) return;
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback() {
    for (const name of ['start', 'end']) if (!(name in this._defaults)) this._defaults[name] = this.getAttribute(name);
    super.connectedCallback();
  }

  readConfig() {
    const time = this.getAttribute('mode') === 'time';
    let min, max, step;
    if (time) {
      min = 0; max = DAY;
      const s = this._num('step', 5);
      step = this.getAttribute('step') === 'any' ? 0 : s > 0 ? Math.min(s, 720) : 5;
    } else ({ min, max, step } = this._range({ min: 0, max: 100, step: 1 }));
    const period = max - min || 1;
    const wrap = time || (this.hasAttribute('wrap') && this.getAttribute('wrap') !== 'false');
    const range = wrap ? 360 : clamp(this._num('range', 270), 10, 360);
    const from = this.hasAttribute('from') ? this._num('from', 0) : range < 360 ? this._autoFrom(range) : 0;
    const twelve = time && (this.hasAttribute('hours') ? this.getAttribute('hours') === '12' : twelveHour(this._locale()));
    const parse = (raw, fallback) => {
      if (raw == null || raw === '') return fallback;
      const v = time ? parseClock(raw) : finiteNumber(raw, NaN);
      return v == null || !Number.isFinite(v) ? fallback : v;
    };
    const parseSpan = (name, fallback) => {
      const raw = this.getAttribute(name);
      if (raw == null || raw === '') return fallback;
      const v = time && raw.includes(':') ? (() => { const [h, m] = raw.split(':').map(Number); return h * 60 + m; })() : Number(raw);
      return Number.isFinite(v) && v >= 0 ? v : fallback;
    };
    let minSpan = clamp(parseSpan('min-span', wrap ? step : 0), 0, period);
    const maxSpan = clamp(parseSpan('max-span', wrap ? period - step : period), minSpan, period);
    if (wrap && minSpan === 0 && maxSpan === period) minSpan = Math.min(step, period);
    const cfg = {
      time, twelve, min, max, step, period, wrap, range, from, minSpan, maxSpan,
      size: this._size('size', '280px'), thickness: this._thickness(2.4, 5),
      fill: this._color('fill', null), track: this._color('track', null),
      ticks: Math.max(0, Math.min(240, Math.round(this._num('ticks', time ? 48 : 40)))),
      numbers: Math.max(0, Math.min(24, Math.round(this._num('numbers', time ? 12 : range < 360 ? 5 : 4)))),
      label: this.getAttribute('label'),
      startLabel: this._str('start-label', 'Start'), endLabel: this._str('end-label', 'End'),
      startIcon: this.getAttribute('start-icon'), endIcon: this.getAttribute('end-icon'),
      glow: this.hasAttribute('glow') ? this._glowPx() : null,
      disabled: this._isDisabled(),
      // Tick numbers are part of the dial, so their format rebuilds it.
      format: [...['format', 'locale', 'decimals', 'currency'].map((a) => this.getAttribute(a)), this._formatter ? 'fn' : '', this._locale()].join('|')
    };
    const snap = (v) => this._snap(v, cfg);
    let start = snap(parse(this.getAttribute('start'), time ? 22 * 60 : min + period * .25));
    let end = snap(parse(this.getAttribute('end'), time ? 6 * 60 : min + period * .75));
    if (!wrap && end < start) end = start;
    // Keep the span inside [min-span, max-span]: the end gives way first.
    const span = this._spanOf(start, end, cfg);
    if (span < minSpan || span > maxSpan) {
      end = start + (span < minSpan ? minSpan : maxSpan);
      if (!wrap && end > max) { end = max; start = Math.max(min, max - Math.max(minSpan, Math.min(span, maxSpan))); }
    }
    [cfg.start, cfg.end] = this._norm(start, end, cfg);
    cfg.span = this._spanOf(cfg.start, cfg.end, cfg);
    return cfg;
  }

  /** Snap to the step grid from min; a wrapping dial folds back into [min, max). */
  _snap(v, { min, max, step, wrap, period }) {
    let out = step ? min + Math.round((v - min) / step) * step : v;
    out = wrap ? min + mod(out - min, period) : clamp(out, min, max);
    return tidy(out);
  }

  _norm(s, e, { min, wrap, period }) {
    return wrap ? [tidy(min + mod(s - min, period)), tidy(min + mod(e - min, period))] : [tidy(s), tidy(e)];
  }

  _spanOf(s, e, { wrap, period }) { return tidy(wrap ? mod(e - s, period) : e - s); }

  structuralSignature(cfg) {
    const { start, end, span, label, fill, track, disabled, minSpan, maxSpan, ...rest } = cfg;
    return JSON.stringify(rest);
  }

  build(cfg) {
    injectStyleOnce('orbit-kit-range', RANGE_CSS);
    const t = cfg.thickness;
    const closed = cfg.range === 360;
    const angles = `--o-range:${cfg.range}deg;--o-from:${fixed(cfg.from)}deg;`;
    const glow = cfg.glow == null ? '' : ` style="filter:drop-shadow(0 0 ${cfg.glow}px var(--ok-fill, #4fd1c5))"`;
    const tickOrbit = Math.max(3, Math.floor(12 - t - .4));
    const numOrbit = tickOrbit - 2;
    const fit = closed ? '' : ' fit-range';

    // Ticks: `ticks` intervals; the ones under a number are major.
    const tickCount = cfg.ticks ? (closed ? cfg.ticks : cfg.ticks + 1) : 0;
    const intervals = closed ? cfg.numbers : cfg.numbers - 1;
    const every = intervals > 0 && cfg.ticks % intervals === 0 ? cfg.ticks / intervals : 0;
    const ticks = tickCount ? `<div class="orbit-${tickOrbit}${fit}" style="${angles}--o-size-ratio:.7">${Array.from({ length: tickCount }, (_, i) =>
      `<div class="vector inner-orbit ok-range-tick${every && i % every === 0 ? ' is-major' : ''}"></div>`).join('')}</div>` : '';

    const numbers = cfg.numbers > 1 || (cfg.numbers === 1 && closed)
      ? `<div class="orbit-${numOrbit}${fit}" style="${angles}--o-size-ratio:1.6">${Array.from({ length: cfg.numbers }, (_, i) => {
        const { html, major } = this._numberAt(i, cfg, intervals);
        return `<div class="satellite"><div class="capsule ok-range-num${major ? ' is-major' : ''}">${html}</div></div>`;
      }).join('')}</div>` : '';

    const handle = (which, label, ico) => `<div class="orbit-12" style="--o-size-ratio:${fixed(t)}"><div class="satellite inner-orbit ok-range-thumb" data-thumb="${which}">` +
      `<div class="capsule ok-range-handle ok-surface" data-handle="${which}" role="slider" tabindex="0" aria-label="${e(label)}">${icon(ico)}</div></div></div>`;

    const ring = `--o-size-ratio:${fixed(t)};--o-gap:0`;
    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12" style="${angles}${ring}"><o-arc class="inner-orbit ok-track ok-range-track" interactive hit-width="4" value="100" shape="${closed ? 'none' : 'rounded'}"></o-arc></div>
      <div class="orbit-12 ok-range-band-ring" style="--o-range:${cfg.range}deg;${ring}"><o-arc class="inner-orbit ok-value ok-range-band" interactive hit-width="2" value="0" shape="rounded"${glow}></o-arc></div>
      ${ticks}${numbers}
      ${hub(2 * (numOrbit - 1.2), '<span class="ok-range-span"></span><span class="ok-range-label" hidden></span><span class="ok-range-times"></span>', 'ok-hub ok-range-hub', ' aria-hidden="true"')}
      ${handle('start', cfg.startLabel, cfg.startIcon)}
      ${handle('end', cfg.endLabel, cfg.endIcon)}`);
    this._box = this.querySelector('.bigbang');
    this._bandRing = this.querySelector('.ok-range-band-ring');
    this._band = this.querySelector('.ok-range-band');
    this._thumbs = { start: this.querySelector('[data-thumb="start"]'), end: this.querySelector('[data-thumb="end"]') };
    this._handles = { start: this.querySelector('[data-handle="start"]'), end: this.querySelector('[data-handle="end"]') };
    this._spanEl = this.querySelector('.ok-range-span');
    this._labelEl = this.querySelector('.ok-range-label');
    this._timesEl = this.querySelector('.ok-range-times');
  }

  /** The dial number at index i: hours on a time dial, values otherwise. */
  _numberAt(i, cfg, intervals) {
    if (cfg.time) {
      const h = Math.round(i * 24 / cfg.numbers) % 24, cardinal = h % 6 === 0;
      if (!cfg.twelve) return { html: String(h), major: cardinal };
      return { html: cardinal ? `${h % 12 || 12}<small>${h < 12 ? 'AM' : 'PM'}</small>` : String(h % 12 || 12), major: cardinal };
    }
    const v = cfg.min + i * cfg.period / Math.max(1, intervals);
    return { html: e(this._format(tidy(v), { kind: 'tick', min: cfg.min, max: cfg.max, fallback: (n) => String(Number(n.toFixed(2))) })), major: true };
  }

  /** Text of one end, for the readout and aria-valuetext. */
  _pointText(v, cfg, kind = 'value') {
    return cfg.time ? clockText(v, cfg.twelve) : this._formatText(v, { kind, min: cfg.min, max: cfg.max });
  }

  /** The span as HTML (number big, unit small) and as plain text. */
  _spanText(cfg) {
    if (this._formatter) {
      try {
        const out = this._formatter(cfg.span, { kind: 'span', min: 0, max: cfg.period, start: cfg.start, end: cfg.end, element: this, locale: this._locale(), format: null, unit: this.getAttribute('unit') });
        if (out != null) return { html: e(out), text: String(out) };
      } catch (err) {
        if (!this._formatterWarned) { this._formatterWarned = true; console.warn('<o-range> formatter threw:', err); }
      }
    }
    if (cfg.time) {
      const parts = spanParts(cfg.span);
      return { html: parts.map(([n, u]) => `${n}<small>${u}</small>`).join(''), text: parts.map((p) => p.join(' ')).join(' ') };
    }
    const text = this._formatText(cfg.span, { min: 0, max: cfg.period });
    return { html: e(text), text };
  }

  sync(cfg) {
    this._cfg = cfg;
    this._applyTheme({ '--ok-fill': cfg.fill, '--ok-track': cfg.track });
    const angleOf = (v) => cfg.from + (v - cfg.min) / cfg.period * cfg.range;
    this._bandRing?.style.setProperty('--o-from', `${fixed(angleOf(cfg.start))}deg`);
    this._band?.setAttribute('value', fixed(cfg.span / cfg.period * 100, 3));
    for (const which of ['start', 'end']) {
      this._thumbs?.[which]?.style.setProperty('--o-angle-composite', `${fixed(angleOf(cfg[which]) - 90)}deg`);
    }
    const span = this._spanText(cfg);
    const startText = this._pointText(cfg.start, cfg), endText = this._pointText(cfg.end, cfg);
    if (this._spanEl) this._spanEl.innerHTML = span.html;
    if (this._labelEl) { this._labelEl.textContent = cfg.label ?? ''; this._labelEl.hidden = !cfg.label; }
    if (this._timesEl) this._timesEl.textContent = `${startText} – ${endText}`;
    this._describe(cfg.label || (cfg.time ? 'Time range' : 'Range'), 'group');

    const lo = cfg.min, hi = cfg.time ? DAY - 1 : cfg.max;
    for (const which of ['start', 'end']) {
      const el = this._handles?.[which];
      if (!el) continue;
      el.setAttribute('aria-valuenow', String(cfg[which]));
      el.setAttribute('aria-valuemin', String(lo));
      el.setAttribute('aria-valuemax', String(hi));
      el.setAttribute('aria-valuetext', `${this._pointText(cfg[which], cfg, 'aria')}, span ${span.text}`);
      el.setAttribute('aria-label', which === 'start' ? cfg.startLabel : cfg.endLabel);
      el.tabIndex = cfg.disabled ? -1 : 0;
      if (cfg.disabled) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');
    }
    if (cfg.disabled) this._stopDrag();
  }

  /* ---- value --------------------------------------------------------- */

  _text(v, cfg = this.readConfig()) { return cfg.time ? clockValue(v) : String(v); }

  /** "22:30-06:45" or "20-80". Setting it fires no event. */
  get value() { const cfg = this.readConfig(); return `${this._text(cfg.start, cfg)}-${this._text(cfg.end, cfg)}`; }
  set value(value) {
    const pair = splitPair(value);
    if (pair) this._write(pair[0], pair[1]);
  }
  get start() { const cfg = this.readConfig(); return cfg.time ? clockValue(cfg.start) : cfg.start; }
  set start(value) { this._write(String(value), this.getAttribute('end')); }
  get end() { const cfg = this.readConfig(); return cfg.time ? clockValue(cfg.end) : cfg.end; }
  set end(value) { this._write(this.getAttribute('start'), String(value)); }
  /** The span in values (minutes in time mode). */
  get span() { return this.readConfig().span; }
  get defaultValue() {
    const { start, end } = this._defaults;
    return start == null && end == null ? null : `${start ?? ''}-${end ?? ''}`;
  }
  set defaultValue(value) {
    const pair = splitPair(value);
    if (pair) { this.setAttribute('start', pair[0]); this.setAttribute('end', pair[1]); }
  }

  _formValue() { return this.value; }

  /** Write start and end (as attribute text) in one render, without touching the defaults. */
  _write(start, end) {
    this._writing = true; this._quiet = true;
    try {
      for (const [name, v] of [['start', start], ['end', end]]) {
        if (v == null) this.removeAttribute(name); else if (this.getAttribute(name) !== v) this.setAttribute(name, v);
      }
    } finally { this._writing = false; this._quiet = false; }
    if (this.isConnected) this._render();
  }

  _onFormReset() {
    this._writing = true; this._quiet = true;
    try {
      for (const name of ['start', 'end']) {
        const v = this._defaults[name];
        if (v == null) this.removeAttribute(name); else this.setAttribute(name, v);
      }
    } finally { this._writing = false; this._quiet = false; }
  }

  /** Move one end (or the band) by dv from base, with the span rules. Returns [start, end]. */
  _solve(which, dv, base, cfg) {
    const { min, max, wrap, minSpan, maxSpan } = cfg;
    const snap = (v) => (cfg.step ? tidy(min + Math.round((v - min) / cfg.step) * cfg.step) : v);
    let s = base.start, en = base.end;
    if (!wrap && en < s) en = s;
    const span0 = this._spanOf(s, en, cfg);
    if (which === 'band') {
      let ns = snap(s + dv);
      if (!wrap) ns = clamp(ns, min, max - span0);
      return this._norm(ns, ns + span0, cfg);
    }
    if (which === 'start') {
      let ns = snap(s + dv);
      if (!wrap) ns = clamp(ns, min, max - minSpan);
      const span = span0 - (ns - s);
      let ne = s + span0;
      if (span < minSpan) ne = ns + minSpan; else if (span > maxSpan) ne = ns + maxSpan;
      if (!wrap) ne = clamp(ne, ns, max);
      return this._norm(ns, ne, cfg);
    }
    let ne = snap(en + dv);
    if (!wrap) ne = clamp(ne, min + minSpan, max);
    const span = span0 + (ne - en);
    let ns = en - span0;
    if (span < minSpan) ns = ne - minSpan; else if (span > maxSpan) ns = ne - maxSpan;
    if (!wrap) ns = clamp(ns, min, ne);
    return this._norm(ns, ne, cfg);
  }

  /** Apply a user change: write it, then fire `input` (and `change`). */
  _commit([s, en], { change = false } = {}) {
    const cfg = this.readConfig();
    const before = this.value;
    this._write(this._text(s, cfg), this._text(en, cfg));
    const after = this.value;
    if (after === before) return false;
    this._emit('input');
    if (change) this._emit('change');
    return true;
  }

  _emit(type) {
    const cfg = this.readConfig();
    this._emitValue(type, this.value, { start: cfg.time ? clockValue(cfg.start) : cfg.start, end: cfg.time ? clockValue(cfg.end) : cfg.end, span: cfg.span });
  }

  /* ---- pointer and keys ------------------------------------------------ */

  onConnected() {
    this.addEventListener('pointerdown', this._onDown);
    this.addEventListener('lostpointercapture', this._onUp);
    this.addEventListener('keydown', this._onKey);
  }

  onDisconnected() {
    this.removeEventListener('pointerdown', this._onDown);
    this.removeEventListener('lostpointercapture', this._onUp);
    this.removeEventListener('keydown', this._onKey);
    this._stopDrag();
  }

  _onDown(event) {
    if (this._isDisabled() || event.button !== 0 || this._drag) return;
    const target = event.target;
    const handle = target?.closest?.('[data-handle]');
    const onBand = target?.closest?.('.ok-range-band');
    const onTrack = target?.closest?.('.ok-range-track');
    if (!handle && !onBand && !onTrack) return;
    event.preventDefault();
    let cfg = this.readConfig();
    const angle = pointerAngle(event, this._box);
    let which = handle ? handle.dataset.handle : onBand ? 'band' : null;
    const startValue = this.value;
    if (!which) {
      // The track: the closer handle jumps there and keeps following.
      const v = valueAtAngle(angle, { from: cfg.from, range: cfg.range, min: cfg.min, max: cfg.max });
      const dist = (a) => (cfg.wrap ? Math.min(mod(v - a, cfg.period), mod(a - v, cfg.period)) : Math.abs(v - a));
      which = dist(cfg.start) <= dist(cfg.end) ? 'start' : 'end';
      const cur = cfg[which];
      const dv = cfg.wrap ? mod(v - cur + cfg.period / 2, cfg.period) - cfg.period / 2 : v - cur;
      this._commit(this._solve(which, dv, cfg, cfg));
      cfg = this.readConfig();
    }
    this._active = which === 'band' ? (this._active || 'start') : which;
    this._handles?.[this._active]?.focus({ preventScroll: true });
    this._drag = { id: event.pointerId, which, last: angle, acc: 0, base: { start: cfg.start, end: cfg.end }, startValue };
    this.classList.add('is-dragging');
    this.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
  }

  _onMove(event) {
    const drag = this._drag;
    if (!drag || event.pointerId !== drag.id || this._isDisabled()) return;
    const angle = pointerAngle(event, this._box);
    // Unwrap the angle so a full turn keeps counting instead of jumping at 12 o'clock.
    drag.acc += mod(angle - drag.last + 180, 360) - 180;
    drag.last = angle;
    const cfg = this.readConfig();
    this._commit(this._solve(drag.which, drag.acc / cfg.range * cfg.period, drag.base, cfg));
  }

  _stopDrag() {
    if (typeof window === 'undefined') return;
    if (this._drag && this.hasPointerCapture?.(this._drag.id)) this.releasePointerCapture(this._drag.id);
    this._drag = null;
    this.classList?.remove('is-dragging');
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
  }

  _onUp(event) {
    const drag = this._drag;
    if (!drag || event.pointerId !== drag.id) return;
    this._stopDrag();
    if (this.value !== drag.startValue && !this._isDisabled()) this._emit('change');
  }

  _onKey(event) {
    const handle = event.target?.closest?.('[data-handle]');
    if (!handle || this._isDisabled()) return;
    const cfg = this.readConfig();
    const which = handle.dataset.handle;
    const step = cfg.step || cfg.period / 100;
    const page = cfg.time ? Math.max(60, step) : step * 10;
    const moves = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: page, PageDown: -page };
    let dv = null;
    if (Object.hasOwn(moves, event.key)) dv = moves[event.key];
    else if (event.key === 'Home') dv = cfg.min - cfg[which];
    else if (event.key === 'End') dv = (cfg.time ? DAY - (cfg.step || 1) : cfg.max) - cfg[which];
    if (dv == null) return;
    event.preventDefault();
    this._active = which;
    // Shift + arrows moves the whole band.
    const mover = event.shiftKey && moves[event.key] ? 'band' : which;
    this._commit(this._solve(mover, dv, cfg, cfg), { change: true });
  }
}

define('o-range', OrbitRange);
