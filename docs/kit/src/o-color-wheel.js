/**
 * <o-color-wheel>: a circular color picker. A hue ring around a
 * saturation / brightness square, with an optional ring of swatches.
 *
 *   .orbit-0  > .satellite.at-center > .ok-cw-ring     the hue ring (a conic gradient)
 *   .orbit-12 > .satellite                             hue handle, at the hue's angle
 *   .orbit-11 > .satellite > button × n                swatches, spread by Orbit
 *   .orbit-0  > .satellite.at-center > .ok-cw-area     saturation (x) and brightness (y)
 *
 * The hue handle is one satellite on a ring whose --o-from is the hue, so
 * Orbit places it. It is a form control (FormControl): `name`, `disabled`,
 * form reset/restore; it submits the color as hex, rgb() or hsl() (`format`).
 * Emits `input` while changing and `change` when a gesture commits.
 */
import { OrbitKitElement, FormControl, define, injectStyleOnce, universe, hub, fixed, escapeHTML as e, FORM_ATTRS, withShared } from './base.js';
import { parseColor, rgbToHex, hsvToRgb, rgbToHsv, colorName, formatColor } from './color.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const FORMATS = ['hex', 'rgb', 'hsl'];

const CW_CSS = `
o-color-wheel { -webkit-tap-highlight-color: transparent; }
o-color-wheel :where(.satellite) { border: none; background: transparent; }
o-color-wheel > .bigbang > .gravity-spot { font-size: var(--ok-font-size, 8cqmin); color: var(--ok-text, inherit); }
o-color-wheel .ok-cw-ring {
  width: 100%; aspect-ratio: 1; border-radius: 50%;
  background: conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  -webkit-mask: radial-gradient(closest-side, #0000 calc(var(--ok-cw-hole) - .5px), #000 var(--ok-cw-hole), #000 calc(100% - .75px), #0000 100%);
  mask: radial-gradient(closest-side, #0000 calc(var(--ok-cw-hole) - .5px), #000 var(--ok-cw-hole), #000 calc(100% - .75px), #0000 100%);
}
o-color-wheel .ok-cw-area {
  position: relative; width: 100%; aspect-ratio: 1; border-radius: var(--ok-cw-radius, .3em); touch-action: none;
  background: linear-gradient(to top, #000, #0000), linear-gradient(to right, #fff, hsl(var(--ok-cw-hue, 0) 100% 50%));
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
}
o-color-wheel .ok-cw-thumb {
  box-sizing: border-box; display: block; border-radius: 50%; background: var(--ok-cw-color, #fff);
  border: .1em solid var(--ok-cw-thumb-border, #fff); box-shadow: 0 0 0 1px rgba(0,0,0,.35), 0 .05em .25em rgba(0,0,0,.45);
  outline: none; cursor: grab; touch-action: none;
}
o-color-wheel .ok-cw-hue-thumb { width: 100%; aspect-ratio: 1; }
o-color-wheel .ok-cw-area-thumb { position: absolute; width: .82em; aspect-ratio: 1; translate: -50% -50%; }
o-color-wheel .ok-cw-thumb:focus-visible,
o-color-wheel .ok-cw-swatch:focus-visible { outline: 2px solid var(--ok-focus, #3da9fc); outline-offset: 2px; }
o-color-wheel .ok-cw-swatch {
  font: inherit; display: block; width: 100%; aspect-ratio: 1; padding: 0; margin: 0; border-radius: 50%; cursor: pointer;
  background: var(--ok-cw-swatch); border: .07em solid var(--ok-cw-swatch-border, rgba(255,255,255,.14));
  transition: scale .15s;
}
o-color-wheel .ok-cw-swatch:hover { scale: 1.12; background: var(--ok-cw-swatch); }
o-color-wheel .ok-cw-swatch[aria-pressed="true"] { border-color: var(--ok-cw-thumb-border, #fff); box-shadow: 0 0 0 .07em rgba(0,0,0,.4); }
o-color-wheel[data-disabled] > .bigbang { opacity: .5; }
o-color-wheel[data-disabled] :is(.ok-cw-thumb, .ok-cw-swatch) { cursor: default; }
@media (prefers-reduced-motion: reduce) { o-color-wheel .ok-cw-swatch { transition: none; } }
`;

/** "#1e90ff" for any parsable color, else null. */
export const toHex = (value) => { const rgb = parseColor(value); return rgb ? rgbToHex(rgb) : null; };

export class OrbitColorWheel extends FormControl(OrbitKitElement) {
  static get observedAttributes() {
    return withShared(['value', 'size', 'format', 'swatches', 'label', 'thickness'], FORM_ATTRS);
  }

  constructor() {
    super();
    for (const name of ['_onDown', '_onMove', '_onUp', '_onKey']) this[name] = this[name].bind(this);
  }

  readConfig() {
    const swatches = (Array.isArray(this._json('swatches', [])) ? this._json('swatches', []) : []).slice(0, 36).map((s) => {
      const item = typeof s === 'string' ? { color: s } : (s && typeof s === 'object' ? s : {});
      const hex = toHex(item.color);
      return hex ? { hex, label: item.label == null ? null : String(item.label) } : null;
    }).filter(Boolean);
    const format = this._str('format', 'hex');
    const band = clamp(this._num('thickness', swatches.length ? 1.7 : 1.9), .8, 3);
    const outer = swatches.length ? 9.6 : 11.6;
    return {
      size: this._size('size', '240px'), swatches, format: FORMATS.includes(format) ? format : 'hex',
      label: this._str('label', 'Color picker'), disabled: this._isDisabled(),
      outer, band, center: outer - band / 2,
      // The square fits inside the hole with a little air.
      half: (outer - band - .6) / Math.SQRT2,
      value: toHex(this.getAttribute('value')) || '#4fd1c5'
    };
  }

  structuralSignature({ value, label, disabled, format, ...rest }) { return JSON.stringify(rest); }

  build(cfg) {
    injectStyleOnce('orbit-kit-color-wheel', CW_CSS);
    const hole = fixed((cfg.outer - cfg.band) / cfg.outer * 100, 2);
    const sw = cfg.swatches.length ? Math.min(1.7, 2 * Math.PI * 11 / cfg.swatches.length * .62) : 0;
    const swatches = cfg.swatches.length ? `<div class="orbit-11 ok-cw-swatches" role="group" aria-label="Swatches" style="--o-size-ratio:${fixed(sw)}">${cfg.swatches.map((s, i) => {
      const name = s.label ?? colorName(s.hex);
      return `<div class="satellite"><div class="capsule"><button type="button" class="ok-cw-swatch" data-index="${i}" data-hex="${s.hex}" tabindex="-1" aria-pressed="false" aria-label="${e(`${name}, ${s.hex}`)}" title="${e(name)}" style="--ok-cw-swatch:${s.hex}"></button></div></div>`;
    }).join('')}</div>` : '';
    this.innerHTML = universe(cfg.size, `
      ${hub(2 * cfg.outer, `<div class="ok-cw-ring" aria-hidden="true" style="--ok-cw-hole:${hole}%"></div>`, 'ok-cw-ring-cap')}
      <div class="orbit-12 ok-cw-hue-ring"><div class="satellite" style="--o-size-ratio:${fixed(cfg.band + .45)};--o-alignment:calc(var(--o-radius) / 12 * ${fixed(12 - cfg.center)})"><div class="capsule"><span class="ok-cw-thumb ok-cw-hue-thumb" role="slider" aria-label="Hue" aria-valuemin="0" aria-valuemax="359" data-part="hue"></span></div></div></div>
      ${hub(2 * cfg.half, '<div class="ok-cw-area"><span class="ok-cw-thumb ok-cw-area-thumb" role="slider" aria-label="Saturation and brightness" aria-roledescription="2D slider" aria-valuemin="0" aria-valuemax="100" data-part="area"></span></div>', 'ok-cw-area-cap')}
      ${swatches}`);
    this._box = this.querySelector('.bigbang');
    this._hueRing = this.querySelector('.ok-cw-hue-ring');
    this._hueThumb = this.querySelector('.ok-cw-hue-thumb');
    this._area = this.querySelector('.ok-cw-area');
    this._areaThumb = this.querySelector('.ok-cw-area-thumb');
    this._swatches = [...this.querySelectorAll('.ok-cw-swatch')];
    this._painted = null;
  }

  sync(cfg) {
    this._cfg = cfg;
    // A new value attribute moves the picker; the hue survives grays and black.
    if (!this._hsv || cfg.value !== rgbToHex(hsvToRgb(this._hsv))) this._hsv = this._adopt(cfg.value);
    this._describe(cfg.label, 'group');
    for (const thumb of [this._hueThumb, this._areaThumb]) if (thumb) thumb.tabIndex = cfg.disabled ? -1 : 0;
    this._roving(this._swatches.find((s) => s.tabIndex === 0) || this._swatches[0], cfg.disabled);
    this.style.touchAction = cfg.disabled ? 'auto' : 'none';
    if (cfg.disabled) this._stopDrag();
    this._paint();
  }

  /** HSV for a hex, keeping the current hue (and saturation) where the hex has none. */
  _adopt(hex) {
    const next = rgbToHsv(parseColor(hex) || { r: 0, g: 0, b: 0 });
    const prev = this._hsv;
    if (prev && (next.s === 0 || next.v === 0)) next.h = prev.h;
    if (prev && next.v === 0) next.s = prev.s;
    return next;
  }

  _paint() {
    const { h, s, v } = this._hsv;
    const rgb = hsvToRgb(this._hsv);
    const hex = rgbToHex(rgb);
    const key = `${fixed(h, 2)}|${fixed(s, 4)}|${fixed(v, 4)}`;
    if (key === this._painted) return;
    this._painted = key;
    const name = colorName(rgb);
    if (this._hueRing) this._hueRing.style.setProperty('--o-from', `${fixed(h, 2)}deg`);
    if (this._hueThumb) {
      this._hueThumb.style.setProperty('--ok-cw-color', `hsl(${fixed(h, 2)} 100% 50%)`);
      this._hueThumb.setAttribute('aria-valuenow', String(Math.round(h) % 360));
      this._hueThumb.setAttribute('aria-valuetext', `${Math.round(h) % 360} degrees, ${colorName(hsvToRgb({ h, s: 1, v: 1 }))}`);
    }
    if (this._area) this._area.style.setProperty('--ok-cw-hue', fixed(h, 2));
    if (this._areaThumb) {
      this._areaThumb.style.left = `${fixed(s * 100, 2)}%`;
      this._areaThumb.style.top = `${fixed((1 - v) * 100, 2)}%`;
      this._areaThumb.style.setProperty('--ok-cw-color', hex);
      this._areaThumb.setAttribute('aria-valuenow', String(Math.round(s * 100)));
      this._areaThumb.setAttribute('aria-valuetext', `Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%, ${name}, ${hex}`);
    }
    for (const sw of this._swatches) sw.setAttribute('aria-pressed', String(sw.dataset.hex === hex));
  }

  get value() { return this._hsv ? rgbToHex(hsvToRgb(this._hsv)) : this.readConfig().value; }
  /** Any CSS color; it is stored as hex. Setting it fires no event. */
  set value(color) {
    const hex = toHex(color);
    if (!hex) return;
    if (!this.isConnected) { this.setAttribute('value', hex); return; }
    this._hsv = this._adopt(hex);
    this._reflectValue(hex);
    this._paint();
    this._updateForm();
  }
  get rgb() { return formatColor(parseColor(this.value), 'rgb'); }
  get hsl() { return formatColor(parseColor(this.value), 'hsl'); }
  /** A plain-English name of the color, like "dark blue". */
  get colorName() { return colorName(this.value); }

  _formValue() {
    const format = this.getAttribute('format');
    return formatColor(parseColor(this.value), FORMATS.includes(format) ? format : 'hex');
  }

  _formAnchor() { return this._areaThumb || undefined; }

  onConnected() {
    this.addEventListener('pointerdown', this._onDown);
    this.addEventListener('lostpointercapture', this._onUp);
    this.addEventListener('keydown', this._onKey);
    this.addEventListener('click', this._onSwatch);
  }

  onDisconnected() {
    this.removeEventListener('pointerdown', this._onDown);
    this.removeEventListener('lostpointercapture', this._onUp);
    this.removeEventListener('keydown', this._onKey);
    this.removeEventListener('click', this._onSwatch);
    this._stopDrag();
  }

  /** Set the color from a gesture: `input` on each change, `change` with { change: true }. */
  _commit(hsv, { change = false } = {}) {
    const before = this.value;
    this._hsv = { h: ((hsv.h % 360) + 360) % 360, s: clamp(hsv.s, 0, 1), v: clamp(hsv.v, 0, 1) };
    const hex = this.value;
    this._reflectValue(hex);
    this._paint();
    this._updateForm();
    if (hex !== before) {
      this._emit('input');
      if (change) this._emit('change');
    }
  }

  _emit(type) {
    const rgb = parseColor(this.value);
    this._emitValue(type, this.value, { rgb: formatColor(rgb, 'rgb'), hsl: formatColor(rgb, 'hsl'), name: colorName(rgb) });
  }

  /** Where a pointer is, in lanes from the center (a lane is a twelfth of the radius). */
  _lanes(event) {
    const r = this._box?.getBoundingClientRect?.();
    if (!r?.width) return null;
    const lane = Math.min(r.width, r.height) / 24;
    return { x: (event.clientX - (r.left + r.width / 2)) / lane, y: (event.clientY - (r.top + r.height / 2)) / lane };
  }

  _onDown(event) {
    if (this._isDisabled() || event.button !== 0 || this._pointerId != null || event.target?.closest?.('.ok-cw-swatch')) return;
    const p = this._lanes(event);
    const cfg = this._cfg;
    if (!p || !cfg) return;
    const d = Math.hypot(p.x, p.y);
    if (d >= cfg.outer - cfg.band - .5 && d <= cfg.outer + .5) this._mode = 'hue';
    else if (Math.abs(p.x) <= cfg.half + .5 && Math.abs(p.y) <= cfg.half + .5) this._mode = 'area';
    else return;
    event.preventDefault();
    (this._mode === 'hue' ? this._hueThumb : this._areaThumb)?.focus({ preventScroll: true });
    this._pointerId = event.pointerId;
    this._startValue = this.value;
    this.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
    this._move(p);
  }

  _onMove(event) {
    if (event.pointerId !== this._pointerId || this._isDisabled()) return;
    const p = this._lanes(event);
    if (p) this._move(p);
  }

  _move(p) {
    const { half } = this._cfg;
    if (this._mode === 'hue') this._commit({ ...this._hsv, h: Math.atan2(p.x, -p.y) * 180 / Math.PI });
    else this._commit({ ...this._hsv, s: (p.x + half) / (2 * half), v: (half - p.y) / (2 * half) });
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
    const changed = this.value !== this._startValue;
    this._stopDrag();
    if (changed && !this._isDisabled()) this._emit('change');
  }

  _onSwatch = (event) => {
    const sw = event.target?.closest?.('.ok-cw-swatch');
    if (!sw || this._isDisabled()) return;
    this._roving(sw);
    this._commit(rgbToHsv(parseColor(sw.dataset.hex)), { change: true });
  };

  _roving(active, disabled = this._isDisabled()) {
    for (const sw of this._swatches || []) sw.tabIndex = !disabled && sw === active ? 0 : -1;
  }

  _onKey(event) {
    if (this._isDisabled()) return;
    const part = event.target?.dataset?.part;
    const big = event.shiftKey ? 10 : 1;
    const { h, s, v } = this._hsv;
    let next = null;
    if (event.target?.classList?.contains('ok-cw-swatch')) {
      const i = this._swatches.indexOf(event.target), n = this._swatches.length;
      const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[event.key];
      if (to == null) return;
      event.preventDefault();
      const sw = this._swatches[(to + n) % n];
      this._roving(sw);
      sw.focus();
      return;
    }
    if (part === 'hue') {
      const moves = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
      if (Object.hasOwn(moves, event.key)) next = { h: (Math.round(h) + moves[event.key] * (event.key.startsWith('Page') ? 1 : big) + 360) % 360, s, v };
      else if (event.key === 'Home') next = { h: 0, s, v };
      else if (event.key === 'End') next = { h: 359, s, v };
    } else if (part === 'area') {
      const step = big / 100;
      const r = (n) => Math.round(n * 100) / 100;
      if (event.key === 'ArrowRight') next = { h, s: r(s) + step, v };
      else if (event.key === 'ArrowLeft') next = { h, s: r(s) - step, v };
      else if (event.key === 'ArrowUp') next = { h, s, v: r(v) + step };
      else if (event.key === 'ArrowDown') next = { h, s, v: r(v) - step };
      else if (event.key === 'PageUp') next = { h, s, v: r(v) + .1 };
      else if (event.key === 'PageDown') next = { h, s, v: r(v) - .1 };
      else if (event.key === 'Home') next = { h, s: 0, v };
      else if (event.key === 'End') next = { h, s: 1, v };
    }
    if (!next) return;
    event.preventDefault();
    this._commit(next, { change: true });
  }
}

define('o-color-wheel', OrbitColorWheel);
