/**
 * OrbitKitElement: the shared base for the orbit-kit components.
 *
 * Every component turns one tag into an Orbit universe
 * (.bigbang > .gravity-spot > .orbit-N > o-arc | o-progress | .satellite).
 * They share one lifecycle:
 *
 *   readConfig()            -> parse attributes into a plain config object
 *   structuralSignature(c)  -> string; when it changes the subtree is rebuilt
 *   build(cfg)              -> render the Orbit structure into the light DOM
 *   sync(cfg)               -> patch values without a rebuild
 *
 * Sizing follows Orbit 2: the .bigbang is the universe and its width is the
 * `size` attribute. orbit-12 reaches its edge, so the kit lays everything out
 * in lanes (twelfths of the radius) and leaves --o-force alone.
 *
 * LIGHT DOM on purpose: Orbit positions elements through global CSS and
 * inherited --o-* custom properties, and its runtime watches the document.
 * Requires @zumer/orbit 2 (CSS + JS) on the page; it is a peer dependency.
 */
export const HTMLElementBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

/** Text and attribute escaping share the same conservative encoding. */
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function finiteNumber(value, fallback = 0) {
  if (value == null || String(value).trim() === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function arrayData(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) : [];
}

/** A declaration value, never a second declaration or active URL. */
export function cssValue(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && !/[;{}<>"'\\\x00-\x1f]/.test(text) && !/(?:url|expression)\s*\(/i.test(text) ? text : fallback;
}

export function cssLength(value, fallback = '200px') {
  const text = cssValue(value);
  if (!text || /^(?:auto|inherit|initial|unset|none)$/i.test(text)) return fallback;
  if (typeof CSS !== 'undefined' && CSS.supports) return CSS.supports('width', text) ? text : fallback;
  return /^(?:0|(?:\d*\.)?\d+(?:px|rem|em|%|vw|vh|vmin|vmax|svw|svh|dvw|dvh|cqw|cqh|cqmin|cqmax|ch|ex)|(?:calc|min|max|clamp|var)\(.+\))$/i.test(text) ? text : fallback;
}


const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

/* ---------------------------------------------------------------------------
 * Shared options. Every component gets them from OrbitKitElement; the design
 * note (DESIGN-shared.md) shows how a new component wires them in.
 * ------------------------------------------------------------------------- */

/** Attribute groups, for observedAttributes: withShared([...own], RANGE_ATTRS, FORMAT_ATTRS). */
export const RANGE_ATTRS = ['min', 'max', 'step'];
export const FORMAT_ATTRS = ['format', 'locale', 'decimals', 'currency', 'unit'];
export const FORM_ATTRS = ['name', 'disabled', 'required'];
export const withShared = (own, ...groups) => [...new Set([...own, ...groups.flat()])];

/**
 * min / max / step, the way <input type="range"> reads them: a max below min
 * becomes min, a step of "any" (or 0 where the component allows it) turns
 * snapping off, and a step that is not a positive number falls back.
 */
export function normalizeRange({ min = 0, max = 100, step = 0 } = {}) {
  let lo = finiteNumber(min, 0), hi = finiteNumber(max, lo + 100);
  if (!(hi >= lo)) hi = lo;
  if (!Number.isFinite(hi - lo)) { lo = 0; hi = 100; }
  const s = Number(step);
  return { min: lo, max: hi, span: hi - lo, step: Number.isFinite(s) && s > 0 ? s : 0 };
}

/** Clamp to [min, max] and snap to the step grid that starts at min. Both ends stay reachable. */
export function snapValue(raw, { min, max, step }) {
  const value = clampNumber(finiteNumber(raw, min), min, max);
  if (value === min || value === max) return value;
  // Twelve significant digits drop float noise (0.1 + 0.2) and keep real precision.
  const snapped = step ? min + Math.round((value - min) / step) * step : value;
  return clampNumber(Number(snapped.toPrecision(12)), min, max);
}

/** Where a value sits in its range, 0 to 1 (0 when the range is empty). */
export const rangeFraction = (value, { min, max }) => (max > min ? clampNumber((value - min) / (max - min), 0, 1) : 0);

export const FORMATS = ['decimal', 'percent', 'currency', 'unit', 'compact'];
const numberFormats = new Map();
function numberFormat(locale, options) {
  const key = JSON.stringify([locale || '', options]);
  if (!numberFormats.has(key)) numberFormats.set(key, new Intl.NumberFormat(locale || undefined, options));
  return numberFormats.get(key);
}

/**
 * Format a number with Intl.NumberFormat.
 *   format    decimal | percent | currency | unit | compact
 *   decimals  fixed fraction digits (otherwise Intl's default for the style)
 *   currency  ISO code for "currency" (USD by default)
 *   unit      Intl unit for "unit", e.g. "kilometer-per-hour"
 *   min, max  "percent" shows where the value sits in this range; without a
 *             range the value is read as percentage points (72 -> 72%)
 * A bad locale, currency or unit never throws: it falls back to a plain number.
 */
export function formatNumber(value, { format = 'decimal', locale, decimals, currency, unit, min, max } = {}) {
  let n = Number(value);
  if (!Number.isFinite(n)) return '';
  const d = Number(decimals);
  const digits = decimals != null && decimals !== '' && Number.isInteger(d) && d >= 0 && d <= 20
    ? { minimumFractionDigits: d, maximumFractionDigits: d } : null;
  let options;
  if (format === 'percent') {
    n = Number.isFinite(min) && Number.isFinite(max) ? (max > min ? (n - min) / (max - min) : 0) : n / 100;
    options = { style: 'percent', ...(digits || { maximumFractionDigits: 0 }) };
  } else if (format === 'currency') options = { style: 'currency', currency: currency || 'USD', ...digits };
  else if (format === 'unit') options = { style: 'unit', unit: String(unit || ''), unitDisplay: 'short', ...digits };
  else if (format === 'compact') options = { notation: 'compact', ...(digits || { maximumFractionDigits: 1 }) };
  else options = { ...digits };
  for (const [lang, opts] of [[locale, options], [undefined, options], [locale, digits || {}], [undefined, digits || {}]]) {
    try {
      const text = numberFormat(lang, opts).format(n);
      return opts === options || format !== 'unit' || !unit ? text : `${text} ${unit}`;
    } catch { /* try the next, simpler setup */ }
  }
  return String(n);
}

/** The x/y angle of a pointer around the center of a box, in degrees clockwise from 12 o'clock. */
export function pointerAngle(event, box) {
  const r = box?.getBoundingClientRect?.();
  if (!r) return 0;
  const angle = Math.atan2(event.clientX - (r.left + r.width / 2), (r.top + r.height / 2) - event.clientY) * 180 / Math.PI;
  return (angle + 360) % 360;
}

/**
 * The value at a screen angle on an arc that starts at `from` and spans
 * `range` degrees. Past the end of a partial arc it snaps to the closer end.
 */
export function valueAtAngle(angle, { from = 0, range = 360, min = 0, max = 100 }) {
  if (!range) return min;
  let along = ((angle - from) % 360 + 360) % 360;
  if (along > range) along = along - range < 360 - along ? range : 0;
  return min + along / range * (max - min);
}

/** Round for markup: no "1e-7deg" or 17-digit noise. */
export const fixed = (n, digits = 3) => String(Number(Number(n).toFixed(digits)));

/** Icons are text or a small inert SVG vocabulary; no HTML, scripts or URLs. */
export function safeIcon(value) {
  const source = String(value ?? '');
  if (!/^\s*<svg(?:\s|>)/i.test(source) || typeof document === 'undefined') return escapeHTML(source);
  const template = document.createElement('template');
  template.innerHTML = source;
  if (!template.content) return escapeHTML(source);
  const roots = [...template.content.children];
  if (roots.length !== 1 || roots[0].localName !== 'svg') return escapeHTML(source);
  const tags = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'title', 'desc']);
  const attrs = new Set(['viewbox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform', 'preserveaspectratio', 'xmlns', 'aria-hidden', 'focusable']);
  const clean = (node) => {
    for (const child of [...node.children]) {
      if (!tags.has(child.localName)) child.remove();
      else clean(child);
    }
    for (const attr of [...node.attributes]) {
      if (!attrs.has(attr.name.toLowerCase()) || /(?:url\s*\(|javascript:|data:|https?:|[<>])/i.test(attr.value)) node.removeAttribute(attr.name);
    }
  };
  clean(roots[0]);
  roots[0].setAttribute('aria-hidden', 'true');
  roots[0].setAttribute('focusable', 'false');
  return roots[0].outerHTML;
}

/**
 * The universe a component renders: a .bigbang as wide as `size` (square by
 * default, like every Orbit 2 universe) with one gravity spot.
 */
export function universe(size, content, { spot = '', cls = '', box = '' } = {}) {
  return `<div class="bigbang${cls ? ` ${cls}` : ''}" style="width:${escapeHTML(size)}${box ? `;${escapeHTML(box)}` : ''}">` +
    `<div class="gravity-spot"${spot ? ` style="${escapeHTML(spot)}"` : ''}>${content}</div></div>`;
}

/**
 * The center readout: a satellite as wide as the hole inside the bands
 * (`lanes` is its diameter in lanes), so text wraps inside the ring.
 */
export function hub(lanes, inner = '', cls = 'ok-hub', attrs = '') {
  return `<div class="orbit-0" style="--o-size-ratio:${fixed(Math.max(1, lanes))}"><div class="satellite at-center"><div class="capsule ${cls}"${attrs}>${inner}</div></div></div>`;
}

export class OrbitKitElement extends HTMLElementBase {
  connectedCallback() {
    // A property set before the element was defined (a page script that runs
    // before the module) shadows the class setter; hand it to the setter now.
    for (const name of ['formatter', 'value', 'disabled', 'name', 'required']) {
      if (Object.hasOwn(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
    this._render();
    this.onConnected?.();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) this._render();
  }

  disconnectedCallback() {
    this.onDisconnected?.();
  }

  /** Parse a numeric attribute with a fallback. */
  _num(name, fallback) {
    const raw = this.getAttribute(name);
    if (raw === null || raw === '') return fallback;
    return finiteNumber(raw, fallback);
  }

  /** Read a string attribute with a fallback. */
  _str(name, fallback) {
    const raw = this.getAttribute(name);
    return raw === null ? fallback : raw;
  }

  /** Parse a JSON attribute (array/object) with a fallback; never throws. */
  _json(name, fallback) {
    const raw = this.getAttribute(name);
    if (raw === null || raw.trim() === '') return fallback;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`<${this.localName}> invalid JSON in "${name}":`, err.message);
      return fallback;
    }
  }

  _array(name, fallback = []) { return arrayData(this._json(name, fallback)); }
  _size(name = 'size', fallback = '200px') { return cssLength(this.getAttribute(name), fallback); }
  _color(name, fallback) { return cssValue(this.getAttribute(name), fallback); }

  /**
   * Band thickness in lanes (a lane is a twelfth of the radius). `thickness`
   * wins; the 0.x `orbit` attribute still works: those widgets drew one lane
   * of a system scaled so that orbit-N touched the edge.
   */
  _thickness(fallback, max = 11) {
    let lanes = this._num('thickness', NaN);
    if (!Number.isFinite(lanes) && this.hasAttribute('orbit')) lanes = 12 / (Math.max(1, Math.round(this._num('orbit', 4))) + 1);
    if (!Number.isFinite(lanes)) lanes = fallback;
    return Math.min(max, Math.max(.25, lanes));
  }

  /** Spacing between segments: `gap` is a share of the widget width, in percent. */
  _gap(fallback) {
    return Math.min(20, Math.max(0, this._num('gap', fallback)));
  }


  /* ---- shared options: min / max / step -------------------------------- */

  /**
   * Read min, max, step and value with the component's defaults. Returns
   * { min, max, span, step, value, fraction }; value is clamped and snapped.
   * `step: 0` as a default means "no snapping" (display components);
   * interactive ones pass their own step (the knob uses 1). step="any" is 0.
   */
  _range({ min = 0, max = 100, step = 0, value } = {}) {
    const raw = this.getAttribute('step')?.trim().toLowerCase();
    let s = raw === 'any' ? 0 : this._num('step', step);
    if (raw !== 'any' && !(s > 0)) s = step;
    const range = normalizeRange({ min: this._num('min', min), max: this._num('max', max), step: s });
    range.value = snapValue(this._num('value', value ?? range.min), range);
    range.fraction = rangeFraction(range.value, range);
    return range;
  }

  /** Next value for a key press, or null: arrows one step, Page keys ten, Home/End the ends. */
  _keyValue(event, range, current = range.value) {
    const step = range.step || range.span / 100 || 1;
    const moves = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
    if (Object.hasOwn(moves, event.key)) return current + moves[event.key] * step;
    if (event.key === 'Home') return range.min;
    if (event.key === 'End') return range.max;
    return null;
  }

  /** `input` / `change` (or any event) with { value, ...extra } in detail; bubbles like a native one. */
  _emitValue(type, value, extra = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail: { value, ...extra }, bubbles: true, composed: true }));
  }

  /** role="meter" / "slider" values; aria-valuetext goes through the formatter. */
  _ariaRange(range, value = range.value, text = this._formatText(value, { min: range.min, max: range.max, kind: 'aria' })) {
    this.setAttribute('aria-valuenow', String(value));
    this.setAttribute('aria-valuemin', String(range.min));
    this.setAttribute('aria-valuemax', String(range.max));
    this.setAttribute('aria-valuetext', text);
  }

  /* ---- shared options: number format ----------------------------------- */

  /** A function (value, context) => string that replaces the built-in formatting. */
  get formatter() { return this._formatter || null; }
  set formatter(fn) {
    this._formatter = typeof fn === 'function' ? fn : null;
    this._formatterWarned = false;
    // Tick labels may be baked into the structure, so rebuild once.
    this._built = false;
    if (this.isConnected) this._render();
  }

  /** The language for numbers: `locale`, else the closest `lang`, else the browser's. */
  _locale() {
    return this.getAttribute('locale') || this.closest?.('[lang]')?.getAttribute('lang') || undefined;
  }

  /**
   * Format options from the attributes, or null when none is set: then
   * components keep their 1.0 output. `unit` is plain text after the number,
   * except with format="unit", where it names an Intl unit.
   */
  _formatOptions() {
    const format = this.getAttribute('format');
    const currency = this.getAttribute('currency');
    const decimals = this.getAttribute('decimals');
    if (!format && !currency && decimals == null && !this.hasAttribute('locale')) return null;
    return {
      format: FORMATS.includes(format) ? format : (currency ? 'currency' : 'decimal'),
      locale: this._locale(), decimals, currency: cssValue(currency, 'USD').toUpperCase(),
      unit: this.getAttribute('unit')
    };
  }

  /** The unit text to print after a number ('' when format="unit" prints the unit itself). */
  _unitText(fallback = '') {
    return this.getAttribute('format') === 'unit' ? '' : this._str('unit', fallback) ?? '';
  }

  /**
   * One number, as text. ctx: { kind: 'value' | 'tick' | 'aria', min, max,
   * fallback }. `fallback(value)` is the component's own 1.0 formatting, used
   * when no format attribute is set.
   */
  _format(value, ctx = {}) { return this._formatParts(value, ctx).text; }

  /** A number with its unit text, unless a `formatter` took over the whole string. */
  _formatText(value, ctx = {}, unit = this._unitText()) {
    const { text, custom } = this._formatParts(value, ctx);
    return custom ? text : `${text}${unit}`;
  }

  _formatParts(value, ctx) {
    const { fallback, ...info } = ctx;
    const options = this._formatOptions();
    if (this._formatter) {
      try {
        const out = this._formatter(value, { kind: 'value', ...info, locale: options?.locale ?? this._locale(), format: options?.format ?? null, unit: this.getAttribute('unit'), element: this });
        if (out != null) return { text: String(out), custom: true };
      } catch (err) {
        if (!this._formatterWarned) { this._formatterWarned = true; console.warn(`<${this.localName}> formatter threw:`, err); }
      }
    }
    if (!options) return { text: fallback ? fallback(value) : String(value), custom: false };
    // Whole-number ticks drop the cents: a scale reads 500 €, not 500,00 €.
    const decimals = options.decimals == null && info.kind === 'tick' && Number.isInteger(Number(value)) ? 0 : options.decimals;
    return { text: formatNumber(value, { ...options, decimals, min: info.min, max: info.max }), custom: false };
  }

  /** Restore the author's original inline declaration when an override ends. */
  _applyTheme(values) {
    this._themeOriginals ??= new Map();
    for (const [prop, value] of Object.entries(values)) {
      const clean = value == null ? '' : cssValue(value);
      if (clean !== '') {
        if (!this._themeOriginals.has(prop)) this._themeOriginals.set(prop, [this.style.getPropertyValue?.(prop) || '', this.style.getPropertyPriority?.(prop) || '']);
        this.style.setProperty(prop, clean);
      } else if (this._themeOriginals.has(prop)) {
        const [original, priority] = this._themeOriginals.get(prop);
        if (original) this.style.setProperty(prop, original, priority);
        else this.style.removeProperty?.(prop);
        this._themeOriginals.delete(prop);
      }
    }
  }

  /** Generated roles and names never replace ones the author supplied. */
  _describe(text, role = 'img') {
    if (!this.hasAttribute('role') || this.getAttribute('role') === this._generatedRole) {
      this._generatedRole = role;
      if (this.getAttribute('role') !== role) this.setAttribute('role', role);
    }
    if (this.hasAttribute('aria-labelledby')) return;
    const current = this.getAttribute('aria-label');
    if (current == null || current === this._generatedLabel) {
      this._generatedLabel = String(text);
      if (current !== this._generatedLabel) this.setAttribute('aria-label', this._generatedLabel);
    }
  }

  /**
   * Default `from` angle that centers an arc's gap at the bottom (6 o'clock),
   * matching the classic 3/4 gauge: range 270 -> from 225.
   */
  _autoFrom(range) {
    return ((360 - range / 2) % 360 + 360) % 360;
  }

  /** Blur radius for the opt-in `glow` attribute (`glow` or `glow="12"`). */
  _glowPx(fallbackPx = 6) {
    return Math.max(0, this._num('glow', fallbackPx));
  }

  /** Opt-in neon glow: a drop-shadow tinted with the indicator color. */
  _glow(color, fallbackPx = 6) {
    if (!this.hasAttribute('glow')) return '';
    return `filter:drop-shadow(0 0 ${this._glowPx(fallbackPx)}px ${color});`;
  }

  _render() {
    const cfg = this.readConfig();
    const sig = this.structuralSignature ? this.structuralSignature(cfg) : null;
    if (!this._built || sig === null || sig !== this._sig) {
      this.build(cfg);
      this._sig = sig;
      this._built = true;
    }
    this.sync?.(cfg);
  }
}


/**
 * FormControl(Base): turns a kit component into a form-associated custom
 * element, like <input>. It submits under `name`, takes `disabled` (also from
 * a disabled <fieldset>) and `required`, resets with its form, restores on
 * back/forward navigation, and exposes validity like a native control.
 *
 * The component supplies:
 *   get value() / set value(v)   the current value; setting it fires no event
 *   _formValue()                 optional: string | FormData | null to submit
 *                                (default: String(this.value), null when undefined)
 *   _formValidity()              optional: { flags, message } (default: valid)
 *   _formAnchor()                optional: element the browser points at when invalid
 * and calls this._updateForm() after its value changes outside _render().
 * The `value` attribute is the default value: setting it from markup or code
 * moves the control, and form reset goes back to it. Values the user picks
 * are written back to the attribute through _reflectValue(), which leaves the
 * default alone.
 */
export const FormControl = (Base) => class extends Base {
  static formAssociated = true;

  constructor() {
    super();
    try { this._internals = this.attachInternals?.() ?? null; } catch { this._internals = null; }
  }

  get form() { return this._internals?.form ?? null; }
  get labels() { return this._internals?.labels ?? []; }
  get type() { return this.localName; }
  get name() { return this.getAttribute('name') ?? ''; }
  set name(value) { this.setAttribute('name', String(value)); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) { if (value) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
  get required() { return this.hasAttribute('required'); }
  set required(value) { if (value) this.setAttribute('required', ''); else this.removeAttribute('required'); }
  get defaultValue() { return this._defaultValue !== undefined ? this._defaultValue : this.getAttribute('value'); }
  set defaultValue(value) { this.setAttribute('value', String(value)); }
  get validity() { return this._internals?.validity; }
  get validationMessage() { return this._internals?.validationMessage ?? ''; }
  get willValidate() { return this._internals?.willValidate ?? false; }
  checkValidity() { return this._internals?.checkValidity() ?? true; }
  reportValidity() { return this._internals?.reportValidity() ?? true; }

  /** Disabled by its own attribute or by a disabled fieldset around it. */
  _isDisabled() { return this.hasAttribute('disabled') || !!this._fieldsetDisabled; }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && !this._reflecting) this._defaultValue = newValue;
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback() {
    if (this._defaultValue === undefined) this._defaultValue = this.getAttribute('value');
    super.connectedCallback();
  }

  /** Write a value the user picked to the attribute without making it the default. */
  _reflectValue(text) {
    if (this.getAttribute('value') === text) return;
    this._reflecting = true;
    try { if (text == null) this.removeAttribute('value'); else this.setAttribute('value', text); } finally { this._reflecting = false; }
  }

  _render() {
    super._render();
    this._updateForm();
  }

  _formValue() {
    const value = this.value;
    if (value === undefined || value === null) return null;
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  _updateForm() {
    const disabled = this._isDisabled();
    this.setAttribute('aria-disabled', String(disabled));
    if (this.toggleAttribute) this.toggleAttribute('data-disabled', disabled);
    if (this.hasAttribute('required')) this.setAttribute('aria-required', 'true');
    else if (this.getAttribute('aria-required') === 'true') this.removeAttribute('aria-required');
    const internals = this._internals;
    if (!internals) return;
    const value = this._formValue();
    try { internals.setFormValue(value, value); } catch { /* not in a form-capable browser */ }
    const { flags = {}, message = '' } = this._formValidity?.() || {};
    try {
      if (Object.values(flags).some(Boolean)) internals.setValidity(flags, message || 'Invalid value', this._formAnchor?.() || undefined);
      else internals.setValidity({});
    } catch { /* setValidity needs a connected element in some engines */ }
  }

  formDisabledCallback(disabled) {
    this._fieldsetDisabled = !!disabled;
    if (this.isConnected) this._render();
  }

  formResetCallback() {
    this._reflecting = true;
    try {
      const fallback = this._defaultValue;
      if (fallback == null) this.removeAttribute('value'); else this.setAttribute('value', fallback);
    } finally { this._reflecting = false; }
    this._onFormReset?.();
    if (this.isConnected) this._render();
  }

  formStateRestoreCallback(state) {
    if (state == null || typeof state !== 'string') return;
    this.value = state;
  }
};

/** Register a custom element once (safe against double-registration). */
export function define(tag, cls) {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, cls);
  }
}

/** Inject a stylesheet once, keyed by id. */
export function injectStyleOnce(id, css) {
  if (typeof document === 'undefined' || !document.head || document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export const KIT_TAGS = 'o-gauge,o-donut,o-rings,o-meter,o-knob,o-menu,o-compass,o-radar,o-spinner,o-radar-chart,o-clock,o-instrument,o-timer,o-status,o-range,o-time-picker,o-sunburst,o-wheel,o-color-wheel';


/**
 * Themes: sets of the shared --ok-* properties. `theme="dark|light|glass"` on
 * a component, or the class `ok-theme-dark|light|glass` on any ancestor (the
 * attribute works on any element too), and everything inside follows. They sit
 * in :where(), so any rule of yours wins; the color attributes win too. With
 * no theme, components keep their own defaults.
 *
 * Shared tokens: --ok-fill, --ok-track, --ok-accent, --ok-text, --ok-face,
 * --ok-bezel, --ok-tick, --ok-hand (hands, needles' partners, major ticks,
 * strong numbers), --ok-case, --ok-surface (panels like the menu hub),
 * --ok-focus, --ok-backdrop (a backdrop-filter for .ok-surface elements).
 */
export const THEMES = {
  dark: {
    '--ok-fill': '#4fd1c5', '--ok-track': '#222a33', '--ok-accent': '#ffb547', '--ok-text': '#e8edf2',
    '--ok-face': 'radial-gradient(circle at 50% 35%, #18202a, #0c0f13)', '--ok-bezel': '#2a3440',
    '--ok-tick': 'rgba(232,237,242,.35)', '--ok-hand': '#e8edf2', '--ok-case': 'linear-gradient(160deg, #1b222b, #0e1217)',
    '--ok-surface': '#161b22', '--ok-focus': '#4fd1c5',
    '--ok-menu-slate': '#232b35', '--ok-menu-text': '#e8edf2', '--ok-menu-hub-hover': '#1f2630',
    '--ok-radar-color': '#4fd1c5', '--ok-timer-button-text': '#0c0f13'
  },
  light: {
    '--ok-fill': '#0d9488', '--ok-track': '#e2e8f0', '--ok-accent': '#ea580c', '--ok-text': '#12161c',
    '--ok-face': 'radial-gradient(circle at 50% 35%, #ffffff, #eef2f6)', '--ok-bezel': '#cbd5e1',
    '--ok-tick': 'rgba(18,22,28,.32)', '--ok-hand': '#1e293b', '--ok-case': 'linear-gradient(160deg, #ffffff, #e5eaf0)',
    '--ok-surface': '#ffffff', '--ok-focus': '#0d9488',
    '--ok-menu-slate': '#e2e8f0', '--ok-menu-text': '#12161c', '--ok-menu-hub-hover': '#f1f5f9',
    '--ok-radar-color': '#0d9488', '--ok-timer-button-text': '#ffffff', '--ok-status-off': '#94a3b8'
  },
  glass: {
    '--ok-fill': 'rgba(255,255,255,.92)', '--ok-track': 'rgba(255,255,255,.16)', '--ok-accent': '#7dd3fc', '--ok-text': '#ffffff',
    '--ok-face': 'rgba(255,255,255,.08)', '--ok-bezel': 'rgba(255,255,255,.24)',
    '--ok-tick': 'rgba(255,255,255,.4)', '--ok-hand': '#ffffff', '--ok-case': 'rgba(255,255,255,.1)',
    '--ok-surface': 'rgba(255,255,255,.12)', '--ok-focus': '#ffffff', '--ok-backdrop': 'blur(14px) saturate(140%)',
    '--ok-menu-slate': 'rgba(255,255,255,.14)', '--ok-menu-text': '#ffffff', '--ok-menu-hub-hover': 'rgba(255,255,255,.2)',
    '--ok-radar-color': '#e0f2fe', '--ok-timer-button-text': '#0c0f13', '--ok-timer-button-alt': 'rgba(255,255,255,.18)'
  }
};

const THEME_CSS = Object.entries(THEMES).map(([name, tokens]) =>
  `:where([theme~="${name}"], .ok-theme-${name}) {\n${Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`).join('\n') + `
:where(.ok-surface) {
  -webkit-backdrop-filter: var(--ok-backdrop, none);
  backdrop-filter: var(--ok-backdrop, none);
}`;

/**
 * Kit baseline, injected once. Everything sits in :where(), so a single class
 * or custom property of yours wins.
 *
 * Text scales with the widget: the base font size of a kit universe is a share
 * of its box (--ok-font-size) and readouts are sized in em. Colors come from
 * custom properties that inherit, so a theme can be set once on a parent:
 * --ok-fill, --ok-track, --ok-accent, --ok-text, --ok-focus.
 */
const KIT_BASE_CSS = `
:where(${KIT_TAGS}) [hidden] { display: none !important; }
:where(${KIT_TAGS}) :where(.satellite) {
  border: none;
  background: transparent;
}
:where(${KIT_TAGS}) :where(.bigbang) > :where(.gravity-spot) {
  font-size: var(--ok-font-size, 8cqmin);
  color: var(--ok-text, inherit);
}
:where(${KIT_TAGS}) :where(.ok-hub) {
  font-size: var(--ok-hub-size, 1.4em);
  font-weight: 700;
  text-align: center;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--ok-hub-color, var(--ok-text, inherit));
  background: var(--ok-hub-bg, none);
  border-radius: 50%;
  aspect-ratio: 1;
}
:where(${KIT_TAGS}):focus-visible { outline: none; }
:where(${KIT_TAGS}):focus-visible > :where(.bigbang),
:where(${KIT_TAGS}) :where(button, .capsule[tabindex]):focus-visible {
  outline: 2px solid var(--ok-focus, #3da9fc);
  outline-offset: 3px;
  border-radius: 50%;
}`;

injectStyleOnce('orbit-kit-base', KIT_BASE_CSS + THEME_CSS);
