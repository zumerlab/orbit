/**
 * <o-wheel>: a prize wheel. Segments are sized by their weight, the wheel
 * spins with a long ease-out and lands on a result picked at random by weight,
 * or on the one you ask for with spin(index).
 *
 *   .orbit-11 > o-arc.ok-wheel-pointer…   (outer system, fixed)
 *   .bigbang.ok-wheel-rotor               a universe inside the universe: it turns
 *     .orbit-12 > o-arc                   rim
 *     .orbit-11 > o-arc[value] × n        segments (stacked by Orbit)
 *     .orbit-7  > .satellite              one ring per label, at the segment's angle
 *     .orbit-12 > .satellite              one ring per peg, at each boundary
 *   .orbit-11 > .satellite                the pointer, at 12 o'clock
 *   .orbit-0  > .satellite.at-center      the Spin button
 *
 * The rotor turns with the Web Animations API, so Orbit has nothing to redraw
 * while it spins. Methods: spin(index?) returns a Promise with the result.
 * Properties: items, spinning, result. Events (bubbling): spin, tick, result.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, finiteNumber, cssValue, escapeHTML as e } from './base.js';
import { contrastText } from './color.js';

/** The demos' accents: all light, so labels are dark and read well. */
export const WHEEL_PALETTE = ['#4fd1c5', '#ffb547', '#ff7a6b', '#a78bfa', '#60a5fa', '#a3e635'];
const MAX_ITEMS = 100;
const ROTOR = 0.92; // the wheel is 92% of the universe, so the pointer fits inside it

const WHEEL_CSS = `
o-wheel { -webkit-tap-highlight-color: transparent; }
o-wheel :where(.satellite) { border: none; background: transparent; }
o-wheel > .bigbang > .gravity-spot { font-size: var(--ok-font-size, 8cqmin); color: var(--ok-text, inherit); }
o-wheel .ok-wheel-rotor { --o-force-ratio: ${ROTOR}; }
o-wheel .ok-wheel-rotor > .gravity-spot { font-size: 8cqmin; }
o-wheel .ok-wheel-rim { --o-fill: var(--ok-wheel-rim, var(--ok-bezel, #232b35)); --o-stroke: var(--o-fill); }
o-wheel .ok-wheel-bed { --o-fill: var(--ok-wheel-rim, var(--ok-bezel, #232b35)); --o-stroke: var(--o-fill); }
o-wheel .ok-wheel-seg { --o-stroke: var(--o-fill); transition: opacity .3s; }
o-wheel .ok-wheel-text { --o-fill: transparent; --o-stroke: transparent; font-weight: 650; transition: opacity .3s; }
o-wheel .ok-wheel-label { --o-transform-custom: rotate(var(--ok-wheel-turn, 0deg)); }
o-wheel .ok-wheel-label.is-flipped { --o-transform-custom: rotate(calc(var(--ok-wheel-turn, 0deg) + 180deg)); }
o-wheel .ok-wheel-label.is-flipped span { text-align: start; }
o-wheel .ok-wheel-label span {
  display: block; width: 100%; padding-inline: .2em; text-align: end; font-weight: 650; line-height: 1.1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: opacity .3s;
}
o-wheel .ok-wheel-peg { background: var(--ok-wheel-peg, var(--ok-hand, #e8edf2)); box-shadow: 0 0 0 .5px rgba(0,0,0,.35); }
o-wheel.has-result .ok-wheel-seg:not(.is-winner),
o-wheel.has-result .ok-wheel-text:not(.is-winner),
o-wheel.has-result .ok-wheel-label:not(.is-winner) span { opacity: .32; }
o-wheel .ok-wheel-pointer { width: 100%; height: 100%; overflow: visible; transform-origin: 50% 30%; filter: drop-shadow(0 .04em .08em rgba(0,0,0,.5)); }
o-wheel .ok-wheel-pointer path { fill: var(--ok-wheel-pointer, var(--ok-hand, #e8edf2)); }
o-wheel .ok-wheel-pointer circle { fill: var(--ok-wheel-rim, var(--ok-bezel, #232b35)); }
o-wheel .ok-wheel-hub { display: grid; place-items: center; }
o-wheel .ok-wheel-spin, o-wheel .ok-wheel-cap {
  font: inherit; font-size: .62em; font-weight: 700; line-height: 1; letter-spacing: .01em;
  width: 100%; aspect-ratio: 1; padding: 0; margin: 0; border-radius: 50%; display: grid; place-items: center;
  color: var(--ok-wheel-hub-text, var(--ok-text, #e8edf2)); background: var(--ok-wheel-hub, var(--ok-surface, #161b22));
  border: .09em solid var(--ok-wheel-rim, var(--ok-bezel, #232b35));
  box-shadow: 0 .06em .3em rgba(0,0,0,.45);
}
o-wheel .ok-wheel-spin { cursor: pointer; transition: scale .15s, filter .15s; }
o-wheel .ok-wheel-spin:hover { filter: brightness(1.25); background: var(--ok-wheel-hub, var(--ok-surface, #161b22)); }
o-wheel .ok-wheel-spin:active { scale: .95; }
o-wheel .ok-wheel-spin[aria-disabled="true"] { cursor: default; filter: none; scale: 1; }
o-wheel .ok-wheel-spin:focus-visible { outline: 2px solid var(--ok-focus, #3da9fc); outline-offset: 2px; }
o-wheel.is-spinning .ok-wheel-spin { color: color-mix(in srgb, var(--ok-wheel-hub-text, var(--ok-text, #e8edf2)) 55%, transparent); }
o-wheel[data-disabled] > .bigbang { opacity: .5; }
o-wheel:not([data-disabled]):not(.is-spinning) > .bigbang { cursor: pointer; }
o-wheel .ok-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { o-wheel .ok-wheel-seg, o-wheel .ok-wheel-label span, o-wheel .ok-wheel-spin { transition: none; } }
`;

const POINTER_SVG = '<svg class="ok-wheel-pointer" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 99 29 45a23 23 0 1 1 42 0z"/><circle cx="50" cy="31" r="8"/></svg>';

/** "5", "5s" or "4500ms" → seconds. */
export function parseSeconds(value, fallback) {
  const text = String(value ?? '').trim().toLowerCase();
  const m = text.match(/^(\d+(?:\.\d+)?)(ms|s)?$/);
  if (!m) return fallback;
  return m[2] === 'ms' ? Number(m[1]) / 1000 : Number(m[1]);
}

/** Items from JSON: strings or { label, color?, weight?, value? }; weight ≤ 0 leaves an item out. */
export function normalizeItems(list) {
  if (!Array.isArray(list)) return [];
  const items = [];
  for (const raw of list) {
    if (items.length >= MAX_ITEMS) break;
    const item = typeof raw === 'string' || typeof raw === 'number' ? { label: String(raw) } : raw;
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const weight = item.weight == null ? 1 : finiteNumber(item.weight, 1);
    if (!(weight > 0) || !Number.isFinite(weight)) continue;
    items.push({ label: item.label == null ? `Item ${items.length + 1}` : String(item.label), color: cssValue(item.color, null), weight, value: item.value, item: raw });
  }
  // Default colors never put the same color side by side, also across the seam.
  items.forEach((item, i) => {
    if (item.color) return;
    const before = items[i - 1]?.color, first = i === items.length - 1 && i > 0 ? items[0].color : null;
    let k = i % WHEEL_PALETTE.length;
    while ((WHEEL_PALETTE[k] === before || WHEEL_PALETTE[k] === first) && items.length > 2) k = (k + 1) % WHEEL_PALETTE.length;
    item.color = WHEEL_PALETTE[k];
    item.auto = true;
  });
  return items;
}

/** Index of the segment that holds `angle` (degrees clockwise from the segment start, 0 to 360). */
export function segmentAt(angle, bounds) {
  const a = ((angle % 360) + 360) % 360;
  for (let i = 0; i < bounds.length; i++) if (a < bounds[i].end) return i;
  return bounds.length - 1;
}

/** A fair pick by weight. `random` is a number in [0, 1). */
export function pickByWeight(items, random) {
  const total = items.reduce((n, item) => n + item.weight, 0);
  let r = random * total;
  for (let i = 0; i < items.length; i++) { r -= items[i].weight; if (r < 0) return i; }
  return items.length - 1;
}

/** Uniform in [0, 1), from crypto when there is one. */
function random() {
  try {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  } catch { return Math.random(); }
}

/** Ease-out with a long tail: fast at first, a slow last turn. */
export const easeOut = (t) => 1 - (1 - t) ** 4;

/** Rough width of a label in ems, for fitting text along an arc without a browser. */
let measureCtx;
function textEms(text, font) {
  try {
    measureCtx ??= typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    if (measureCtx) { measureCtx.font = `650 100px ${font || 'system-ui, sans-serif'}`; return measureCtx.measureText(text).width / 100; }
  } catch { /* fall through */ }
  return text.length * 0.56;
}

export class OrbitWheel extends OrbitKitElement {
  static get observedAttributes() {
    return ['items', 'size', 'labels', 'duration', 'turns', 'gap', 'controls', 'label', 'remove-winner', 'disabled', 'pegs'];
  }

  constructor() {
    super();
    this._angle = null;
    this._onClick = this._onClick.bind(this);
    this._onKey = this._onKey.bind(this);
  }

  readConfig() {
    const items = normalizeItems(this._json('items', []));
    const total = items.reduce((n, item) => n + item.weight, 0) || 1;
    let start = 0;
    const bounds = items.map((item) => {
      const span = item.weight / total * 360;
      const b = { start, end: start + span, span, mid: start + span / 2 };
      start += span;
      return b;
    });
    if (bounds.length) bounds[bounds.length - 1].end = 360;
    const labels = this._str('labels', 'across');
    return {
      items, bounds, size: this._size('size', '300px'),
      labels: ['across', 'along', 'none'].includes(labels) ? labels : 'across',
      duration: Math.min(30, Math.max(.2, parseSeconds(this.getAttribute('duration'), 5))),
      turns: Math.min(40, Math.max(0, Math.round(this._num('turns', 5)))),
      gap: this._gap(.4), controls: this._str('controls', 'true') !== 'false',
      label: this._str('label', 'Spin'), removeWinner: this.hasAttribute('remove-winner') && this.getAttribute('remove-winner') !== 'false',
      pegs: this.hasAttribute('pegs') ? this.getAttribute('pegs') !== 'false' : items.length <= 36,
      disabled: this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false'
    };
  }

  structuralSignature({ duration, turns, label, removeWinner, disabled, ...rest }) {
    return JSON.stringify({ ...rest, items: rest.items.map(({ item, ...i }) => i) });
  }

  /** Label size in rotor lanes: as big as the narrowest point of the segment allows. */
  _labelLanes(span, radius) {
    const chord = 2 * radius * Math.sin(Math.min(180, span) * Math.PI / 360);
    return Math.min(1.15, Math.max(.32, chord * .42));
  }

  build(cfg) {
    injectStyleOnce('orbit-kit-wheel', WHEEL_CSS);
    const gap = `--o-gap:${fixed(cfg.items.length > 1 ? cfg.gap * 6 : 0)}`;
    const font = typeof getComputedStyle === 'function' && this.isConnected ? getComputedStyle(this).fontFamily : '';
    // A rotor lane is a twelfth of its radius; 1em of the rotor is 8% of its width, 1.92 lanes.
    const em = (lanes) => fixed(lanes / 1.92, 3);
    const segments = cfg.items.map((item, i) =>
      `<o-arc class="inner-orbit ok-wheel-seg" data-index="${i}" value="${fixed(cfg.bounds[i].span / 3.6, 4)}" shape="none" style="--o-fill:${e(item.color)}"></o-arc>`).join('');
    let labels = '';
    if (cfg.labels === 'across') {
      labels = cfg.items.map((item, i) => {
        const b = cfg.bounds[i];
        // Shrink a long label (down to 60%) before it gets an ellipsis; 6.6 lanes of room.
        const most = this._labelLanes(b.span, 6.5);
        const size = Math.max(most * .6, Math.min(most, 6.6 / Math.max(.1, textEms(item.label, font))));
        return `<div class="orbit-7" style="--o-from:${fixed(b.mid)}deg"><div class="satellite ok-wheel-label" data-index="${i}" data-mid="${fixed(b.mid)}" style="--o-size-ratio:7;--o-alignment:calc(var(--o-radius) / 7 * .25);--ok-wheel-turn:${fixed(b.mid - 90)}deg"><div class="capsule"><span style="font-size:${em(size)}em;color:${contrastText(item.color)}">${e(item.label)}</span></div></div></div>`;
      }).join('');
    } else if (cfg.labels === 'along') {
      const arcs = cfg.items.map((item, i) => {
        const b = cfg.bounds[i];
        // Fit the text to 85% of its arc (radius 9 lanes): smaller type first (down
        // to 65%), then an ellipsis, so nothing is cut.
        const arc = 9 * b.span * Math.PI / 180 * .85;
        const most = Math.min(1.1, this._labelLanes(b.span, 9) * 1.2);
        const lanes = Math.max(most * .65, Math.min(most, arc / Math.max(.1, textEms(item.label, font))));
        const room = arc / lanes;
        let text = item.label;
        if (textEms(text, font) > room) {
          while (text.length > 1 && textEms(`${text}…`, font) > room) text = text.slice(0, -1);
          text = text.length > 1 ? `${text.trimEnd()}…` : '';
        }
        return `<o-arc class="inner-orbit ok-wheel-text" data-index="${i}" data-mid="${fixed(b.mid)}" value="${fixed(b.span / 3.6, 4)}" style="font-size:${em(lanes)}em;--o-color:${contrastText(item.color)}">${e(text)}</o-arc>`;
      }).join('');
      labels = `<div class="orbit-10" style="--o-size-ratio:2.4;${gap}">${arcs}</div>`;
    }
    const pegs = cfg.pegs && cfg.items.length > 1 ? cfg.bounds.map((b) =>
      `<div class="orbit-12" style="--o-from:${fixed(b.start)}deg"><div class="satellite ok-wheel-peg" style="--o-size-ratio:.42;--o-alignment:calc(var(--o-radius) / 12 * .58)"></div></div>`).join('') : '';
    if (this._angle == null) this._angle = cfg.bounds.length ? -cfg.bounds[0].mid : 0;
    const center = cfg.controls
      ? `<button type="button" class="ok-wheel-spin ok-surface">${e(cfg.label)}</button>`
      : '<span class="ok-wheel-cap ok-surface" aria-hidden="true"></span>';
    this.innerHTML = universe(cfg.size, `
      <div class="bigbang ok-wheel-rotor" aria-hidden="true" style="rotate:${fixed(this._angle)}deg">
        <div class="gravity-spot">
          <div class="orbit-12" style="--o-size-ratio:1.2;--o-gap:0"><o-arc class="inner-orbit ok-wheel-rim" value="100"></o-arc></div>
          <div class="orbit-11" style="--o-size-ratio:8.7;--o-gap:0"><o-arc class="inner-orbit ok-wheel-bed" value="100"></o-arc></div>
          <div class="orbit-11" style="--o-size-ratio:8.7;${gap}">${segments}</div>
          ${labels}${pegs}
        </div>
      </div>
      <div class="orbit-11" style="--o-size-ratio:2.5"><div class="satellite" style="--o-alignment:calc(var(--o-radius) / 11 * .3)"><div class="capsule">${POINTER_SVG}</div></div></div>
      ${hub(5.3, center, 'ok-wheel-hub')}
      <span class="ok-sr" aria-live="polite"></span>`);
    this._rotor = this.querySelector('.ok-wheel-rotor');
    this._pointer = this.querySelector('.ok-wheel-pointer');
    this._button = this.querySelector('.ok-wheel-spin');
    this._live = this.querySelector('.ok-sr');
    this._built = true;
    this._showWinner(null);
    this._orient();
  }

  sync(cfg) {
    this._cfg = cfg;
    if (this._button) {
      this._button.textContent = cfg.label;
      this._button.setAttribute('aria-disabled', String(cfg.disabled || !!this._spinning || !cfg.items.length));
    }
    this.toggleAttribute?.('data-disabled', cfg.disabled);
    const names = cfg.items.map((item) => item.label);
    const list = names.length > 12 ? `${names.slice(0, 12).join(', ')} and ${names.length - 12} more` : names.join(', ');
    if (cfg.controls) {
      if (this._autoTab) { this.removeAttribute('tabindex'); this._autoTab = false; }
      this._describe(names.length ? `Wheel: ${list}` : 'Empty wheel', 'group');
    } else {
      // Without the button the wheel itself is the button.
      if (!this.hasAttribute('tabindex') || this._autoTab) { this.tabIndex = cfg.disabled ? -1 : 0; this._autoTab = true; }
      this._describe(names.length ? `Spin the wheel: ${list}` : 'Empty wheel', 'button');
      this.setAttribute('aria-disabled', String(cfg.disabled));
    }
  }

  onConnected() {
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKey);
  }

  onDisconnected() {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKey);
    if (this._spinning) this._finish(true);
  }

  connectedCallback() {
    // `items` set by a page script before the element was defined.
    if (Object.hasOwn(this, 'items')) { const list = this.items; delete this.items; this.items = list; }
    super.connectedCallback();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // New items from outside cancel a winner waiting to be removed.
    if (name === 'items' && !this._removing) this._pendingRemoval = null;
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  get items() { return this.readConfig().items.map((i) => i.item); }
  set items(list) { this.setAttribute('items', JSON.stringify(Array.isArray(list) ? list : [])); }
  get spinning() { return !!this._spinning; }
  /** The last result: { index, label, value, item }, or null. */
  get result() { return this._result ?? null; }

  /** The button, or anywhere on the wheel itself (not the corners of its box). */
  _onClick(event) {
    if (event.target?.closest?.('.ok-wheel-spin')) { this.spin(); return; }
    const box = this.querySelector('.bigbang')?.getBoundingClientRect?.();
    if (!box || !box.width) return;
    const dx = event.clientX - (box.left + box.width / 2), dy = event.clientY - (box.top + box.height / 2);
    if (Math.hypot(dx, dy) <= Math.min(box.width, box.height) / 2 * ROTOR) this.spin();
  }

  _onKey(event) {
    if (event.target !== this || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    this.spin();
  }

  _reduced() {
    try { return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  /**
   * Spin. Without an index the result is picked at random, weighted; with one,
   * the wheel lands on that item. Resolves with the result, or null when the
   * wheel is empty or disabled. While spinning it returns the same promise.
   */
  spin(index) {
    if (this._spinning) return this._spinning.promise;
    if (this._pendingRemoval != null) {
      const keep = this._pendingRemoval;
      this._pendingRemoval = null;
      const list = this.items;
      list.splice(keep, 1);
      this._removing = true;
      try { this.items = list; } finally { this._removing = false; }
    }
    const cfg = this.readConfig();
    if (cfg.disabled || !cfg.items.length) return Promise.resolve(null);
    if (!this._built || this._sig !== this.structuralSignature(cfg)) this._render();
    const forced = index != null && Number.isInteger(Number(index)) && Number(index) >= 0 && Number(index) < cfg.items.length;
    const target = forced ? Number(index) : pickByWeight(cfg.items, random());
    const b = cfg.bounds[target];
    // Land somewhere inside the segment, never on a boundary.
    const landing = b.start + b.span * (.15 + .7 * random());
    const reduced = this._reduced();
    const from = this._angle ?? 0;
    let delta = (((-landing - from) % 360) + 360) % 360;
    if (reduced && delta < 30) delta += 360;
    delta += (reduced ? 0 : cfg.turns) * 360;
    const duration = (reduced ? Math.min(cfg.duration, .7) : cfg.duration) * 1000;
    this._showWinner(null);
    if (this._live) this._live.textContent = '';
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    this._spinning = { promise, resolve, target, from, delta, duration, reduced, cfg, last: segmentAt(-from, cfg.bounds), start: performance.now() };
    this.classList.add('is-spinning');
    this.setAttribute('aria-busy', 'true');
    this.sync(cfg);
    this.dispatchEvent(new CustomEvent('spin', { detail: { duration: duration / 1000 }, bubbles: true, composed: true }));
    // The rotor turns through sampled keyframes of the same curve the ticks follow.
    if (this._rotor?.animate) {
      const frames = Array.from({ length: 61 }, (_, k) => ({ offset: k / 60, rotate: `${fixed(from + delta * easeOut(k / 60))}deg` }));
      this._anim = this._rotor.animate(frames, { duration, easing: 'linear', fill: 'forwards' });
    }
    this._raf = requestAnimationFrame(() => this._frame());
    return promise;
  }

  _frame() {
    const s = this._spinning;
    if (!s) return;
    const elapsed = Number(this._anim?.currentTime ?? performance.now() - s.start);
    const t = Math.min(1, elapsed / s.duration);
    const angle = s.from + s.delta * easeOut(t);
    if (!this._anim && this._rotor) this._rotor.style.rotate = `${fixed(angle)}deg`;
    const under = segmentAt(-angle, s.cfg.bounds);
    if (under !== s.last) {
      s.last = under;
      const speed = s.delta * 4 * (1 - t) ** 3 / s.duration; // degrees per ms
      if (!s.reduced) this._wobble(speed);
      this.dispatchEvent(new CustomEvent('tick', { detail: { index: under, label: s.cfg.items[under]?.label }, bubbles: true, composed: true }));
    }
    if (t >= 1) { this._finish(); return; }
    this._raf = requestAnimationFrame(() => this._frame());
  }

  /** The pointer flicks back as a peg passes, and springs home. */
  _wobble(speed) {
    if (!this._pointer?.animate) return;
    const now = performance.now();
    if (now - (this._lastWobble || 0) < 28) return;
    this._lastWobble = now;
    this._wobbleAnim?.cancel();
    const kick = 10 + 10 * Math.min(1, speed);
    this._wobbleAnim = this._pointer.animate(
      [{ rotate: '0deg' }, { rotate: `${fixed(-kick)}deg`, offset: .25 }, { rotate: `${fixed(kick * .18)}deg`, offset: .7 }, { rotate: '0deg' }],
      { duration: 260, easing: 'ease-out' });
  }

  _finish(silent = false) {
    const s = this._spinning;
    if (!s) return;
    cancelAnimationFrame(this._raf);
    this._angle = ((s.from + s.delta) % 360 + 360) % 360;
    // One style write at the end; the animation is dropped after it.
    if (this._rotor) this._rotor.style.rotate = `${fixed(this._angle)}deg`;
    this._anim?.cancel();
    this._anim = null;
    this._orient();
    this._spinning = null;
    this.classList.remove('is-spinning');
    this.removeAttribute('aria-busy');
    const item = s.cfg.items[s.target];
    const detail = { index: s.target, label: item.label, value: item.value, item: item.item };
    this._result = detail;
    this.sync(this.readConfig());
    if (silent) { s.resolve(detail); return; }
    this._showWinner(s.target);
    if (this._live) this._live.textContent = `Result: ${item.label}`;
    if (s.cfg.removeWinner) this._pendingRemoval = s.target;
    this.dispatchEvent(new CustomEvent('result', { detail, bubbles: true, composed: true }));
    s.resolve(detail);
  }

  /** Labels on the left half of the wheel at rest turn over, so they read upright. */
  _orient() {
    for (const el of this.querySelectorAll('[data-mid]')) {
      const at = ((Number(el.dataset.mid) + (this._angle ?? 0)) % 360 + 360) % 360;
      if (el.localName === 'o-arc') el.toggleAttribute('flip', at > 90 && at < 270);
      else el.classList.toggle('is-flipped', at > 180);
    }
  }

  _showWinner(index) {
    this.classList.toggle('has-result', index != null);
    for (const el of this.querySelectorAll('[data-index]')) el.classList.toggle('is-winner', index != null && Number(el.dataset.index) === index);
  }
}

define('o-wheel', OrbitWheel);
