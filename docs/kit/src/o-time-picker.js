/**
 * <o-time-picker>: pick a time by turning a clock, hours first, then minutes.
 *
 *   .ok-tp
 *   ├── .ok-tp-head                         hour and minute fields (role="spinbutton"), AM / PM
 *   └── .bigbang (the dial)
 *       └── .gravity-spot
 *           ├── .orbit-12                   face
 *           ├── .orbit-10 / .orbit-7        selector: a hand (.vector) and a knob (.satellite),
 *           │                               turned by one registered angle so they sweep
 *           ├── .orbit-10 > .satellite × 12 hours (12h, or 1–12 on a 24h dial)
 *           ├── .orbit-7  > .satellite × 12 00 and 13–23, on a 24h dial
 *           ├── .orbit-10 > .satellite × 12 minutes
 *           └── .orbit-0                    pivot
 *
 * Tap or drag the dial; letting go of an hour moves on to the minutes. The
 * fields take arrows, digits, Left / Right, and A / P for the half of the day.
 * The value is "HH:MM" (24-hour), or "" when nothing is picked. It is a form
 * control. Events: `input` on every change, `change` when a gesture or key ends.
 */
import { OrbitKitElement, FormControl, define, injectStyleOnce, universe, escapeHTML as e, pointerAngle, withShared, FORM_ATTRS } from './base.js';
import { parseClock, clockValue, clockText, twelveHour } from './o-range.js';

const DAY = 1440;
const pad = (n) => String(n).padStart(2, '0');
const mod = (v, n) => ((v % n) + n) % n;

const TP_CSS = `
@property --ok-tp-angle { syntax: '<angle>'; inherits: true; initial-value: 0deg; }
o-time-picker { display: inline-block; vertical-align: middle; -webkit-tap-highlight-color: transparent; }
o-time-picker .ok-tp { display: flex; flex-direction: column; align-items: center; gap: 5cqw; container-type: inline-size; max-width: 100%; }
o-time-picker .ok-tp-head { display: flex; align-items: center; justify-content: center; gap: 3cqw; width: 100%; color: var(--ok-text, #e8edf2); }
o-time-picker .ok-tp-field { display: flex; align-items: center; gap: .5cqw; font-size: 15cqw; line-height: 1; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
o-time-picker .ok-tp-seg {
  padding: .08em .16em; border-radius: .16em; cursor: pointer; user-select: none; outline: none;
  background: var(--ok-tp-seg, color-mix(in srgb, currentColor 7%, transparent));
  transition: background-color .15s, color .15s;
}
o-time-picker .ok-tp-seg.is-active { color: var(--ok-fill, #4fd1c5); background: color-mix(in srgb, var(--ok-fill, #4fd1c5) 16%, transparent); }
o-time-picker .ok-tp-seg:focus-visible { box-shadow: 0 0 0 2px var(--ok-focus, var(--ok-fill, #4fd1c5)); }
o-time-picker .ok-tp-colon { opacity: .55; padding-bottom: .08em; }
o-time-picker .ok-tp-period { display: flex; flex-direction: column; gap: 1.2cqw; }
o-time-picker .ok-tp-period button {
  font: inherit; font-size: 4.6cqw; font-weight: 600; line-height: 1; padding: .45em .7em; margin: 0; min-width: 0;
  border-radius: .5em; border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background: none; color: inherit; opacity: .6; cursor: pointer; transition: background-color .15s, color .15s, opacity .15s;
}
o-time-picker .ok-tp-period button[aria-pressed="true"] { opacity: 1; color: var(--ok-fill, #4fd1c5); border-color: color-mix(in srgb, var(--ok-fill, #4fd1c5) 45%, transparent); background: color-mix(in srgb, var(--ok-fill, #4fd1c5) 14%, transparent); }
o-time-picker .ok-tp-period button:disabled { opacity: .25; cursor: default; }
o-time-picker .ok-tp-period button:focus-visible { outline: 2px solid var(--ok-focus, var(--ok-fill, #4fd1c5)); outline-offset: 2px; border-radius: .5em; }
o-time-picker .bigbang { touch-action: none; cursor: pointer; }
o-time-picker .ok-tp-face {
  background: var(--ok-time-face, var(--ok-face, #161b22));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ok-text, #e8edf2) 9%, transparent), 0 10px 28px -12px rgba(0,0,0,.45);
}
o-time-picker .ok-tp-sel { transition: --ok-tp-angle .22s cubic-bezier(.2,.8,.2,1), opacity .15s; }
o-time-picker.is-dragging .ok-tp-sel { transition-duration: .06s; }
o-time-picker .ok-tp-sel > .satellite, o-time-picker .ok-tp-sel > .vector { --o-angle-composite: calc(var(--ok-tp-angle) - 90deg); }
o-time-picker .ok-tp-hand { background: var(--ok-fill, #4fd1c5); height: max(2px, .6cqmin); }
o-time-picker .ok-tp-knob { background: var(--ok-fill, #4fd1c5); }
o-time-picker .ok-tp-knob.is-between::after { content: ""; width: 18%; aspect-ratio: 1; border-radius: 50%; background: var(--ok-on-fill, var(--ok-timer-button-text, #0c0f13)); }
o-time-picker .ok-tp-sel:not(.is-on) { opacity: 0; }
o-time-picker .ok-tp-ring { transition: opacity .2s, scale .25s cubic-bezier(.2,.8,.2,1), visibility .2s; }
o-time-picker .ok-tp-ring .satellite { pointer-events: none; }
o-time-picker .ok-tp-ring:not(.is-on) { opacity: 0; scale: 1.08; visibility: hidden; }
o-time-picker .ok-tp-ring.is-inner:not(.is-on) { scale: .9; }
o-time-picker .ok-tp-num { font-size: .78em; font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; color: var(--ok-text, #e8edf2); transition: color .15s; }
o-time-picker .is-inner .ok-tp-num { font-size: .62em; opacity: .7; }
o-time-picker .ok-tp-num.is-selected { color: var(--ok-on-fill, var(--ok-timer-button-text, #0c0f13)); opacity: 1; font-weight: 650; }
o-time-picker .ok-tp-num.is-off { opacity: .22; }
o-time-picker .ok-tp-pivot { background: var(--ok-fill, #4fd1c5); }
o-time-picker[data-disabled] .ok-tp { opacity: .5; }
o-time-picker[data-disabled] .bigbang, o-time-picker[data-disabled] .ok-tp-seg { cursor: default; }
@media (prefers-reduced-motion: reduce) { o-time-picker .ok-tp-sel, o-time-picker .ok-tp-ring, o-time-picker .ok-tp-seg { transition: none; } }
`;

export class OrbitTimePicker extends FormControl(OrbitKitElement) {
  static get observedAttributes() {
    return withShared(['value', 'hours', 'minute-step', 'min', 'max', 'view', 'size', 'fill', 'label', 'locale'], FORM_ATTRS);
  }

  constructor() {
    super();
    for (const name of ['_onDown', '_onMove', '_onUp', '_onKey', '_onFocus', '_onClick']) this[name] = this[name].bind(this);
    this._angles = {};
  }

  readConfig() {
    const step = Math.round(this._num('minute-step', 1));
    const minuteStep = step >= 1 && step <= 30 ? step : 1;
    const twelve = this.hasAttribute('hours') ? this.getAttribute('hours') === '12' : twelveHour(this._locale());
    const cfg = {
      twelve, minuteStep,
      min: parseClock(this.getAttribute('min')), max: parseClock(this.getAttribute('max')),
      view: this.getAttribute('view') === 'minutes' ? 'minutes' : 'hours',
      size: this._size('size', '280px'), fill: this._color('fill', null),
      label: this.getAttribute('label'), disabled: this._isDisabled()
    };
    const raw = parseClock(this.getAttribute('value'));
    cfg.value = raw == null ? null : this._fit(raw, cfg);
    return cfg;
  }

  /** Inside min / max. A min after max is a window across midnight (22:00 to 06:00). */
  _allowed(t, { min, max }) {
    if (min == null && max == null) return true;
    const lo = min ?? 0, hi = max ?? DAY - 1;
    return lo <= hi ? t >= lo && t <= hi : t >= lo || t <= hi;
  }

  /** Snap the minutes to minute-step, then move into min / max (the closer end). */
  _fit(t, cfg) {
    const h = Math.floor(t / 60), last = Math.floor(59 / cfg.minuteStep) * cfg.minuteStep;
    t = h * 60 + Math.min(last, Math.round((t % 60) / cfg.minuteStep) * cfg.minuteStep);
    if (this._allowed(t, cfg)) return t;
    const lo = cfg.min ?? 0, hi = cfg.max ?? DAY - 1;
    const dist = (a) => Math.min(mod(a - t, DAY), mod(t - a, DAY));
    return dist(lo) <= dist(hi) ? lo : hi;
  }

  /** The allowed minute of hour h closest to minute m, or null when the whole hour is out. */
  _inHour(h, m, cfg) {
    let best = null;
    for (let k = 0; k < 60; k += cfg.minuteStep) {
      if (this._allowed(h * 60 + k, cfg) && (best == null || Math.abs(k - m) < Math.abs(best - m))) best = k;
    }
    return best == null ? null : h * 60 + best;
  }

  structuralSignature({ twelve, size, minuteStep }) { return JSON.stringify({ twelve, size, minuteStep }); }

  build(cfg) {
    injectStyleOnce('orbit-kit-time-picker', TP_CSS);
    const ring = (cls, orbit, ratio, labels) => `<div class="orbit-${orbit} ok-tp-ring ${cls}" style="--o-size-ratio:${ratio}">${labels.map((text, i) =>
      `<div class="satellite" data-i="${i}"><div class="capsule ok-tp-num">${e(text)}</div></div>`).join('')}</div>`;
    const twelveLabels = Array.from({ length: 12 }, (_, i) => String(i || 12));
    const sel = (cls, orbit, knob) => `<div class="orbit-${orbit} ok-tp-sel ${cls}"><div class="vector inner-orbit ok-tp-hand" style="--o-size-ratio:${orbit}"></div><div class="satellite ok-tp-knob" style="--o-size-ratio:${knob}"></div></div>`;
    const dial = universe('100%', `
      <div class="orbit-12 ok-tp-face ok-surface"></div>
      ${sel('is-outer', 10, 3)}
      ${twelve(cfg) ? '' : sel('is-inner', 7, 2.5)}
      ${ring('ok-tp-hours', 10, 3, twelveLabels)}
      ${twelve(cfg) ? '' : ring('ok-tp-hours-inner is-inner', 7, 2.5, Array.from({ length: 12 }, (_, i) => (i ? String(i + 12) : '00')))}
      ${ring('ok-tp-minutes', 10, 3, Array.from({ length: 12 }, (_, i) => pad(i * 5)))}
      <div class="orbit-0"><div class="satellite at-center ok-tp-pivot" style="--o-size-ratio:.7"></div></div>`);
    const period = cfg.twelve ? `<span class="ok-tp-period" role="group" aria-label="AM or PM">
        <button type="button" data-period="am" aria-pressed="false">AM</button><button type="button" data-period="pm" aria-pressed="false">PM</button></span>` : '';
    this.innerHTML = `<div class="ok-tp" style="width:${e(cfg.size)}">
      <div class="ok-tp-head">
        <span class="ok-tp-field">
          <span class="ok-tp-seg" data-seg="hours" role="spinbutton" tabindex="0" aria-label="Hours"></span><span class="ok-tp-colon" aria-hidden="true">:</span><span class="ok-tp-seg" data-seg="minutes" role="spinbutton" tabindex="0" aria-label="Minutes"></span>
        </span>${period}
      </div>
      ${dial.replace('<div class="bigbang"', '<div class="bigbang" aria-hidden="true"')}
    </div>`;
    this._box = this.querySelector('.bigbang');
    this._segs = { hours: this.querySelector('[data-seg="hours"]'), minutes: this.querySelector('[data-seg="minutes"]') };
    this._periods = [...this.querySelectorAll('[data-period]')];
    this._sels = { outer: this.querySelector('.ok-tp-sel.is-outer'), inner: this.querySelector('.ok-tp-sel.is-inner') };
    this._rings = { hours: this.querySelector('.ok-tp-hours'), inner: this.querySelector('.ok-tp-hours-inner'), minutes: this.querySelector('.ok-tp-minutes') };
    this._angles = {};
    for (const seg of Object.values(this._segs)) seg.addEventListener('focus', this._onFocus);
    this._box.addEventListener('pointerdown', this._onDown);
    for (const button of this._periods) button.addEventListener('click', this._onClick);
    for (const seg of Object.values(this._segs)) seg.addEventListener('click', this._onFocus);
  }

  sync(cfg) {
    this._cfg = cfg;
    this._applyTheme({ '--ok-fill': cfg.fill });
    const t = cfg.value, has = t != null;
    const h = has ? Math.floor(t / 60) : null, m = has ? t % 60 : null;
    const pm = has ? h >= 12 : this._pm === true;
    const view = cfg.view;

    // Fields.
    const shownHour = has ? (cfg.twelve ? h % 12 || 12 : h) : null;
    const hs = this._segs.hours, ms = this._segs.minutes;
    hs.textContent = has ? pad(shownHour) : '--';
    ms.textContent = has ? pad(m) : '--';
    hs.setAttribute('aria-valuemin', cfg.twelve ? '1' : '0');
    hs.setAttribute('aria-valuemax', cfg.twelve ? '12' : '23');
    ms.setAttribute('aria-valuemin', '0');
    ms.setAttribute('aria-valuemax', '59');
    for (const [seg, now, text] of [[hs, shownHour, has ? (cfg.twelve ? `${shownHour} ${pm ? 'PM' : 'AM'}` : String(h)) : 'No value'], [ms, m, has ? pad(m) : 'No value']]) {
      if (now == null) seg.removeAttribute('aria-valuenow'); else seg.setAttribute('aria-valuenow', String(now));
      seg.setAttribute('aria-valuetext', text);
      seg.tabIndex = cfg.disabled ? -1 : 0;
      if (cfg.disabled) seg.setAttribute('aria-disabled', 'true'); else seg.removeAttribute('aria-disabled');
    }
    hs.classList.toggle('is-active', view === 'hours');
    ms.classList.toggle('is-active', view === 'minutes');
    for (const button of this._periods) {
      const isPm = button.dataset.period === 'pm';
      button.setAttribute('aria-pressed', String(isPm === pm));
      const any = Array.from({ length: 12 }, (_, k) => this._inHour(k + (isPm ? 12 : 0), 0, cfg)).some((v) => v != null);
      button.disabled = cfg.disabled || !any;
    }
    this._describe(cfg.label ? `${cfg.label}: ${has ? clockText(t, cfg.twelve) : 'no time'}` : (has ? `Time, ${clockText(t, cfg.twelve)}` : 'Time'), 'group');

    // Dial: which ring shows, which numbers are out of reach.
    const inner = view === 'hours' && !cfg.twelve && has && (h === 0 || h > 12);
    this._rings.hours.classList.toggle('is-on', view === 'hours');
    this._rings.inner?.classList.toggle('is-on', view === 'hours');
    this._rings.minutes.classList.toggle('is-on', view === 'minutes');
    const half = pm ? 12 : 0;
    const outerHour = (i) => (cfg.twelve ? (i % 12) + half : i || 12);
    this._rings.hours.querySelectorAll('.ok-tp-num').forEach((num, i) => {
      num.classList.toggle('is-off', this._inHour(outerHour(i), 0, cfg) == null);
      num.classList.toggle('is-selected', has && view === 'hours' && !inner && outerHour(i) === h);
    });
    this._rings.inner?.querySelectorAll('.ok-tp-num').forEach((num, i) => {
      const hour = i ? i + 12 : 0;
      num.classList.toggle('is-off', this._inHour(hour, 0, cfg) == null);
      num.classList.toggle('is-selected', has && inner && hour === h);
    });
    this._rings.minutes.querySelectorAll('.ok-tp-num').forEach((num, i) => {
      const k = i * 5;
      num.classList.toggle('is-off', k % cfg.minuteStep !== 0 || (has && !this._allowed(h * 60 + k, cfg)));
      num.classList.toggle('is-selected', has && view === 'minutes' && m === k);
    });

    // The selector sweeps to its angle by the short way round.
    const deg = view === 'hours' ? (has ? (h % 12) * 30 : 0) : (has ? m * 6 : 0);
    for (const [key, el] of Object.entries(this._sels)) {
      if (!el) continue;
      const on = has && (key === 'inner' ? inner : !inner);
      el.classList.toggle('is-on', on);
      const prev = this._angles[key] ?? deg;
      const next = deg + 360 * Math.round((prev - deg) / 360);
      this._angles[key] = next;
      el.style.setProperty('--ok-tp-angle', `${next}deg`);
      el.querySelector('.ok-tp-knob').classList.toggle('is-between', view === 'minutes' && has && m % 5 !== 0);
    }
    if (cfg.disabled) this._stopDrag();
  }

  /* ---- value ----------------------------------------------------------- */

  /** "HH:MM" (24-hour), or "" when no time is picked. Setting it fires no event. */
  get value() { const v = this.readConfig().value; return v == null ? '' : clockValue(v); }
  set value(value) {
    const t = parseClock(value);
    if (t == null && value !== '' && value != null) return;
    this._reflectValue(t == null ? null : clockValue(this._fit(t, this.readConfig())));
    if (this.isConnected) this._render();
  }
  /** Minutes after midnight, or NaN. */
  get valueAsNumber() { const v = this.readConfig().value; return v == null ? NaN : v; }
  get view() { return this.readConfig().view; }
  set view(value) { this._setView(value === 'minutes' ? 'minutes' : 'hours'); }
  get min() { return this.getAttribute('min') ?? ''; }
  set min(value) { this.setAttribute('min', String(value)); }
  get max() { return this.getAttribute('max') ?? ''; }
  set max(value) { this.setAttribute('max', String(value)); }

  _formValidity() {
    return this.hasAttribute('required') && this.readConfig().value == null
      ? { flags: { valueMissing: true }, message: 'Please pick a time.' } : {};
  }
  _formAnchor() { return this._segs?.hours; }
  _onFormReset() { this._pm = undefined; }

  _setView(view) {
    if (this.getAttribute('view') !== view) this.setAttribute('view', view);
  }

  /** Apply a time the user picked; `input`, and `change` when asked. */
  _commit(t, { change = false } = {}) {
    const cfg = this.readConfig();
    const before = cfg.value;
    const next = t == null ? null : this._fit(mod(t, DAY), cfg);
    if (next === before) return false;
    this._reflectValue(next == null ? null : clockValue(next));
    this._render();
    this._emitValue('input', this.value);
    if (change) this._emitValue('change', this.value);
    return true;
  }

  /* ---- pointer ----------------------------------------------------------- */

  /** The time under the pointer in the current view, or null for a number out of reach. */
  _timeAt(event, cfg) {
    const angle = pointerAngle(event, this._box);
    const t = cfg.value, has = t != null;
    if (cfg.view === 'minutes') {
      const h = has ? Math.floor(t / 60) : 0;
      let m = Math.round(angle / 6) % 60;
      m = Math.round(m / cfg.minuteStep) * cfg.minuteStep;
      if (m >= 60) m = 0;
      const next = h * 60 + m;
      return this._allowed(next, cfg) ? next : null;
    }
    const i = Math.round(angle / 30) % 12;
    let h;
    if (cfg.twelve) h = i + ((has ? t >= 720 : this._pm) ? 12 : 0);
    else {
      const r = this._box.getBoundingClientRect();
      const lanes = Math.hypot(event.clientX - (r.left + r.width / 2), event.clientY - (r.top + r.height / 2)) / (r.width / 24);
      h = lanes < 8.5 ? (i ? i + 12 : 0) : i || 12;
    }
    return this._inHour(h, has ? t % 60 : 0, cfg);
  }

  _onDown(event) {
    if (this._isDisabled() || event.button !== 0 || this._drag) return;
    event.preventDefault();
    const cfg = this.readConfig();
    this._segs[cfg.view]?.focus({ preventScroll: true });
    this._drag = { id: event.pointerId, before: cfg.value, view: cfg.view };
    this.classList.add('is-dragging');
    this._box.setPointerCapture?.(event.pointerId);
    const t = this._timeAt(event, cfg);
    if (t != null) this._commit(t);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
  }

  _onMove(event) {
    if (!this._drag || event.pointerId !== this._drag.id || this._isDisabled()) return;
    const t = this._timeAt(event, this.readConfig());
    if (t != null) this._commit(t);
  }

  _stopDrag() {
    if (typeof window === 'undefined') return;
    if (this._drag && this._box?.hasPointerCapture?.(this._drag.id)) this._box.releasePointerCapture(this._drag.id);
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
    const cfg = this.readConfig();
    if (cfg.value !== drag.before && !this._isDisabled()) this._emitValue('change', this.value);
    // Letting go of an hour moves on to the minutes, like a clock picker.
    if (drag.view === 'hours' && event.type === 'pointerup' && cfg.value != null) {
      this._setView('minutes');
      this._segs.minutes?.focus({ preventScroll: true });
    }
  }

  /* ---- fields and keys ----------------------------------------------------- */

  onConnected() { this.addEventListener('keydown', this._onKey); }
  onDisconnected() { this.removeEventListener('keydown', this._onKey); this._stopDrag(); }

  _onFocus(event) {
    const seg = event.currentTarget?.dataset?.seg;
    if (seg && !this._isDisabled()) this._setView(seg);
  }

  _onClick(event) {
    const pm = event.currentTarget.dataset.period === 'pm';
    this._setPeriod(pm);
  }

  _setPeriod(pm) {
    const cfg = this.readConfig();
    this._pm = pm;
    if (cfg.value == null) { this._render(); return; }
    const t = (cfg.value % 720) + (pm ? 720 : 0);
    const h = Math.floor(t / 60);
    const next = this._inHour(h, t % 60, cfg) ?? this._fit(t, cfg);
    if (!this._commit(next, { change: true })) this._render();
  }

  _onKey(event) {
    if (this._isDisabled()) return;
    const seg = event.target?.closest?.('[data-seg]')?.dataset.seg;
    const cfg = this.readConfig();
    const key = event.key;
    if (cfg.twelve && (key === 'a' || key === 'A' || key === 'p' || key === 'P') && (seg || event.target?.closest?.('[data-period]'))) {
      event.preventDefault();
      this._setPeriod(key.toLowerCase() === 'p');
      return;
    }
    if (!seg) return;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const order = [this._segs.hours, this._segs.minutes, ...this._periods.filter((b) => !b.disabled)];
      const at = order.indexOf(event.target) + (key === 'ArrowRight' ? 1 : -1);
      if (order[at]) { event.preventDefault(); order[at].focus(); }
      return;
    }
    if (/^\d$/.test(key)) { event.preventDefault(); this._type(seg, Number(key), cfg); return; }
    if (key === 'Backspace' || key === 'Delete') {
      if (!this.hasAttribute('required')) { event.preventDefault(); this._commit(null, { change: true }); }
      return;
    }
    const dir = { ArrowUp: 1, ArrowDown: -1, PageUp: 1, PageDown: -1 }[key];
    if (!dir && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    if (cfg.value == null) {
      // The first press picks a time, like a native time field.
      const first = this._pm ? 720 : 0;
      this._commit(this._allowed(first, cfg) ? first : this._fit(first, cfg), { change: true });
      return;
    }
    const t = cfg.value, h = Math.floor(t / 60), m = t % 60;
    if (key === 'Home' || key === 'End') {
      const to = key === 'Home' ? (cfg.min ?? 0) : (cfg.max ?? DAY - cfg.minuteStep);
      this._commit(to, { change: true });
      return;
    }
    const big = key.startsWith('Page');
    // Hours wrap round the day, minutes round the hour; out-of-range values are skipped.
    for (let n = 1; n <= (seg === 'hours' ? 24 : 60); n++) {
      const next = seg === 'hours'
        ? this._inHour(mod(h + dir * n * (big ? 3 : 1), 24), m, cfg)
        : h * 60 + mod(m + dir * n * cfg.minuteStep * (big ? Math.max(1, Math.round(10 / cfg.minuteStep)) : 1), 60);
      if (next != null && this._allowed(next, cfg)) { this._commit(next, { change: true }); return; }
    }
  }

  /** Digits typed into a field: one, or two within a second. */
  _type(seg, d, cfg) {
    const now = Date.now();
    const buf = this._typed && this._typed.seg === seg && now - this._typed.at < 1000 ? this._typed.text + d : String(d);
    const n = Number(buf);
    const t = cfg.value ?? (this._pm ? 720 : 0);
    let h = Math.floor(t / 60), m = t % 60, done = buf.length === 2;
    if (seg === 'hours') {
      const pm = h >= 12;
      if (cfg.twelve) {
        if (n < 1 && buf.length === 1) { this._typed = { seg, text: buf, at: now }; return; }
        h = (Math.min(12, n || 12) % 12) + (pm ? 12 : 0);
        done ||= n > 1;
      } else { h = Math.min(23, n); done ||= n > 2; }
    } else { m = Math.min(59, n); done ||= n > 5; }
    this._typed = done ? null : { seg, text: buf, at: now };
    const next = h * 60 + m;
    this._commit(this._allowed(next, cfg) ? next : this._fit(next, cfg), { change: true });
    if (done && seg === 'hours') this._segs.minutes?.focus();
  }
}

/** The 12-hour dial has no inner ring. */
function twelve(cfg) { return cfg.twelve; }

define('o-time-picker', OrbitTimePicker);
