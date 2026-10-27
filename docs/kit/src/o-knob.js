/**
 * <o-knob>: a rotary slider. Grab the band and turn it, drag anywhere else
 * vertically, use the wheel while focused, or press arrows / Page Up·Down /
 * Home·End. Emits `input` while changing and `change` when a gesture commits,
 * like <input type="range">; setting `value` from code fires neither.
 * It is a form control (FormControl): `name`, `disabled`, form reset/restore.
 *
 * The track is an `interactive` <o-arc> with a `hit-width`, so the whole band
 * takes the pointer even where it is transparent.
 */
import { OrbitKitElement, FormControl, define, injectStyleOnce, universe, hub, fixed, escapeHTML, finiteNumber, snapValue, pointerAngle, valueAtAngle, withShared, RANGE_ATTRS, FORMAT_ATTRS, FORM_ATTRS } from './base.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class OrbitKnob extends FormControl(OrbitKitElement) {
  static get observedAttributes() {
    return withShared(['value', 'size', 'orbit', 'thickness', 'fill', 'track',
      'stroke-width', 'shape', 'label', 'range', 'from', 'glow'], RANGE_ATTRS, FORMAT_ATTRS, FORM_ATTRS);
  }

  constructor() {
    super();
    for (const name of ['_onDown', '_onMove', '_onUp', '_onWheel', '_onKey']) {
      this[name] = this[name].bind(this);
    }
  }

  readConfig() {
    const range = clamp(this._num('range', 270), 0, 360);
    const r = this._range({ min: 0, max: 100, step: 1 });
    return {
      min: r.min, max: r.max, span: r.span || 1, step: r.step, value: r.value, fraction: r.fraction,
      range,
      from: this.hasAttribute('from') ? this._num('from', 0) : this._autoFrom(range),
      thickness: this._thickness(2.4),
      size: this._size('size', '160px'),
      fill: this._color('fill', null), track: this._color('track', null),
      strokeWidth: Math.max(0, this._num('stroke-width', 0)),
      shape: this._str('shape', 'rounded'), unit: this._unitText(),
      disabled: this._isDisabled(), glow: this.getAttribute('glow'),
      label: this.hasAttribute('label') ? this.getAttribute('label') : null
    };
  }

  /** Clamp and snap like the attribute (kept for 1.0 callers). */
  _normalize(raw, cfg) { return snapValue(finiteNumber(raw, cfg.min), cfg); }

  structuralSignature(cfg) {
    const { value, fraction, min, max, span, step, label, disabled, fill, track, unit, ...rest } = cfg;
    return JSON.stringify(rest);
  }

  build(cfg) {
    const e = escapeHTML;
    const ring = `--o-range:${cfg.range}deg;--o-from:${cfg.from}deg;--o-size-ratio:${fixed(cfg.thickness)};--o-gap:0`;
    const stroke = cfg.strokeWidth ? `--o-stroke-width:${cfg.strokeWidth};` : '';
    const glow = cfg.glow == null ? '' : `filter:drop-shadow(0 0 ${Math.max(0, this._num('glow', 6))}px var(--ok-fill, #a1a1aa));`;
    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12" style="${ring}"><o-arc aria-hidden="true" class="inner-orbit ok-track o-knob-track" interactive hit-width="6" value="100" shape="${e(cfg.shape)}"${stroke ? ` style="${stroke}"` : ''}></o-arc></div>
      <div class="orbit-12" style="${ring}"><o-arc aria-hidden="true" class="inner-orbit ok-value o-knob-dial" value="0" shape="${e(cfg.shape)}" ${stroke || glow ? ` style="${stroke}${glow}"` : ''}></o-arc></div>
      ${hub(2 * (12 - cfg.thickness) - 1, '', 'ok-hub o-knob-readout', ' aria-hidden="true"')}`);
    this._box = this.querySelector('.bigbang');
    this._dial = this.querySelector('.o-knob-dial');
    this._readout = this.querySelector('.o-knob-readout');
    this.setAttribute('role', 'slider');
  }

  sync(cfg) {
    this._applyTheme({ '--ok-fill': cfg.fill, '--ok-track': cfg.track });
    if (this._dial) this._dial.setAttribute('value', (cfg.fraction * 100).toFixed(2));
    const text = this._formatText(cfg.value, { min: cfg.min, max: cfg.max });
    if (this._readout) this._readout.textContent = cfg.label ?? text;
    this._ariaRange(cfg, cfg.value, this._formatText(cfg.value, { min: cfg.min, max: cfg.max, kind: 'aria' }));
    if (!this.hasAttribute('aria-labelledby') && (!this.hasAttribute('aria-label') || this.getAttribute('aria-label') === this._autoLabel)) {
      this._autoLabel = cfg.label || 'Rotary control';
      this.setAttribute('aria-label', this._autoLabel);
    }
    this.tabIndex = cfg.disabled ? -1 : 0;
    this.style.touchAction = cfg.disabled ? 'auto' : 'none';
    this.style.cursor = cfg.disabled ? 'default' : 'ns-resize';
    this.toggleAttribute?.('data-disabled', cfg.disabled);
    if (this._box) this._box.style.opacity = cfg.disabled ? '.5' : '';
    if (cfg.disabled) this._stopDrag();
  }

  get value() { return this.readConfig().value; }
  /** Setting the value snaps and clamps it and fires no event, like a native input. */
  set value(value) { this._commit(finiteNumber(value, this.value), { silent: true }); }
  get valueAsNumber() { return this.value; }
  get min() { return this.readConfig().min; }
  set min(value) { this.setAttribute('min', String(value)); }
  get max() { return this.readConfig().max; }
  set max(value) { this.setAttribute('max', String(value)); }
  get step() { return this.readConfig().step; }
  set step(value) { this.setAttribute('step', String(value)); }
  stepUp(n = 1) { const cfg = this.readConfig(); this._commit(cfg.value + n * (cfg.step || cfg.span / 100), { silent: true }); }
  stepDown(n = 1) { this.stepUp(-n); }

  onConnected() {
    this.addEventListener('pointerdown', this._onDown);
    this.addEventListener('lostpointercapture', this._onUp);
    this.addEventListener('wheel', this._onWheel, { passive: false });
    this.addEventListener('keydown', this._onKey);
  }

  onDisconnected() {
    this.removeEventListener('pointerdown', this._onDown);
    this.removeEventListener('lostpointercapture', this._onUp);
    this.removeEventListener('wheel', this._onWheel);
    this.removeEventListener('keydown', this._onKey);
    this._stopDrag();
  }

  _emit(type, value) { this._emitValue(type, value); }

  /** Set a value; user gestures fire `input` (and `change` when they commit). */
  _commit(raw, { change = false, silent = false } = {}) {
    const cfg = this.readConfig();
    const value = this._normalize(raw, cfg);
    const changed = value !== cfg.value;
    // The attribute shows the current value; the default (for form reset) stays.
    this._reflectValue(String(value));
    if (changed && !silent) {
      this._emit('input', value);
      if (change) this._emit('change', value);
    }
  }

  _onDown(event) {
    if (this._isDisabled() || event.button !== 0 || this._pointerId != null) return;
    event.preventDefault();
    this.focus();
    this._pointerId = event.pointerId;
    this._dragStartY = event.clientY;
    this._dragStartVal = this.value;
    // On the band the knob follows the pointer around; elsewhere it is a vertical drag.
    this._rotary = !!event.target?.closest?.('.o-knob-track');
    if (this._rotary) this._commit(this._valueAt(event));
    this.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
  }

  _onMove(event) {
    if (event.pointerId !== this._pointerId || this._isDisabled()) return;
    if (this._rotary) this._commit(this._valueAt(event));
    else this._commit(this._dragStartVal + (this._dragStartY - event.clientY) / 200 * this.readConfig().span);
  }

  /** The value under the pointer, from its angle around the center. */
  _valueAt(event) {
    const cfg = this.readConfig();
    if (!this._box?.getBoundingClientRect || !cfg.range) return cfg.value;
    return valueAtAngle(pointerAngle(event, this._box), cfg);
  }

  _stopDrag() {
    if (typeof window === 'undefined') return;
    if (this._pointerId != null && this.hasPointerCapture?.(this._pointerId)) this.releasePointerCapture(this._pointerId);
    this._pointerId = null;
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
  }

  _onUp(event) {
    if (event.pointerId !== this._pointerId) return;
    const changed = this.value !== this._dragStartVal;
    this._stopDrag();
    if (changed && !this._isDisabled()) this._emit('change', this.value);
  }

  _onWheel(event) {
    if (this._isDisabled() || this.ownerDocument?.activeElement !== this || !event.deltaY) return;
    event.preventDefault();
    const cfg = this.readConfig();
    this._commit(cfg.value + (event.deltaY < 0 ? 1 : -1) * (cfg.step || cfg.span / 100), { change: true });
  }

  _onKey(event) {
    if (this._isDisabled()) return;
    const cfg = this.readConfig();
    const next = this._keyValue(event, cfg);
    if (next == null) return;
    event.preventDefault();
    this._commit(next, { change: true });
  }
}

injectStyleOnce('orbit-kit-knob', `
o-knob { -webkit-tap-highlight-color: transparent; }
o-knob .ok-track { --o-fill: var(--ok-track, #27272a); --o-stroke: var(--o-fill); }
o-knob .ok-value { --o-fill: var(--ok-fill, #a1a1aa); --o-stroke: var(--o-fill); }
o-knob .o-knob-track { cursor: grab; }
o-knob[data-disabled] .o-knob-track { cursor: default; }
o-knob[data-disabled] > .bigbang { opacity: .5; }
`);
define('o-knob', OrbitKnob);
