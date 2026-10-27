/**
 * <o-spinner>: a circular loading indicator, in five variants.
 *
 *   ring       .orbit-12 > o-arc × 2, turning at two paces, so the arc
 *              they draw together stretches and shrinks as it goes round
 *   dots       .orbit-9  > .satellite × count, pulsing one after another
 *   segments   .orbit-12 > .vector × count, ticks fading in turn (iOS-like)
 *   orbit      .orbit-11 and .orbit-6, each with satellites, turning at
 *              their own pace around a core in .orbit-0
 *   progress   .orbit-12 > o-arc track + value; determinate once `value`
 *              is set, a turning arc until then
 *
 * Everything moves with CSS (rotate / opacity / scale), so a spinner costs no
 * script while it runs. With prefers-reduced-motion nothing turns: the arcs,
 * dots and ticks breathe slowly in place instead.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, escapeHTML as e, withShared, RANGE_ATTRS, FORMAT_ATTRS } from './base.js';

export const SPINNER_VARIANTS = ['ring', 'dots', 'segments', 'orbit', 'progress'];

const SPINNER_CSS = `
:where(o-spinner) { display: inline-block; vertical-align: middle; line-height: 0; }
o-spinner {
  --ok-font-size: 17cqmin;
  --_c: var(--ok-spinner-color, var(--ok-fill, #4fd1c5));
  --_t: var(--ok-spinner-track, var(--ok-track, rgba(127,127,127,.2)));
  --_a: var(--ok-spinner-accent, var(--ok-accent, #ffb547));
  --_s: var(--ok-spinner-speed, 1s);
}
o-spinner .ok-track { --o-fill: var(--_t); --o-stroke: var(--o-fill); }
o-spinner .ok-value { --o-fill: var(--_c); --o-stroke: var(--o-fill); }

/* ring: two equal arcs, one turning steadily and one easing around it. */
o-spinner .ok-spin-rotor { animation: ok-spin-turn calc(var(--_s) * 1.1) linear infinite; }
o-spinner .ok-spin-rotor.is-lead { animation-timing-function: cubic-bezier(.55, .1, .45, .9); }
@keyframes ok-spin-turn { to { rotate: 360deg; } }

/* dots: each one swells and brightens in turn. */
o-spinner .ok-spin-dot {
  width: 100%; aspect-ratio: 1; border-radius: 50%; background: var(--_c);
  animation: ok-spin-dot var(--_s) ease-in-out infinite;
  animation-delay: calc(var(--i) / var(--n) * var(--_s) - var(--_s));
}
@keyframes ok-spin-dot { 0%, 100% { scale: .42; opacity: .3; } 30% { scale: 1; opacity: 1; } }

/* segments: rounded ticks; the bright one walks around. */
o-spinner .ok-spin-tick {
  height: max(1.5px, 7.2cqmin * var(--ok-spinner-weight, 1)); border-radius: 99px; background: var(--_c);
  animation: ok-spin-fade var(--_s) linear infinite;
  animation-delay: calc(var(--i) / var(--n) * var(--_s) - var(--_s));
}
@keyframes ok-spin-fade { 0% { opacity: 1; } 100% { opacity: .16; } }

/* orbit: two lanes turning at their own pace around a breathing core. */
o-spinner .ok-spin-path { box-shadow: inset 0 0 0 max(1px, .9cqmin) var(--_t); }
o-spinner .ok-spin-path.is-outer { animation: ok-spin-turn calc(var(--_s) * 1.6) linear infinite; }
o-spinner .ok-spin-path.is-inner { animation: ok-spin-turn calc(var(--_s) * 1.1) linear infinite reverse; }
o-spinner .ok-spin-planet { width: 100%; aspect-ratio: 1; border-radius: 50%; background: var(--_c); box-shadow: 0 0 6cqmin color-mix(in srgb, var(--_c) 60%, transparent); }
o-spinner .ok-spin-moon { width: 100%; aspect-ratio: 1; border-radius: 50%; background: var(--_a); }
o-spinner .ok-spin-core {
  width: 100%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--_c) 55%, #fff), var(--_c));
  animation: ok-spin-core calc(var(--_s) * 1.6) ease-in-out infinite;
}
@keyframes ok-spin-core { 50% { scale: .72; opacity: .7; } }

o-spinner .ok-spin-readout { font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }

/* Reduced motion: nothing turns or swells; the drawing breathes in place. */
@keyframes ok-spin-breathe { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  o-spinner .ok-spin-rotor { animation: ok-spin-breathe calc(var(--_s) * 2.4) ease-in-out infinite; }
  o-spinner .ok-spin-rotor.is-lead { visibility: hidden; }
  o-spinner .ok-spin-dot { animation-name: ok-spin-breathe; animation-duration: calc(var(--_s) * 2.4); scale: .8; }
  o-spinner .ok-spin-tick { animation-duration: calc(var(--_s) * 2.4); }
  o-spinner .ok-spin-path.is-outer, o-spinner .ok-spin-path.is-inner { animation: none; }
  o-spinner .ok-spin-planet, o-spinner .ok-spin-moon { animation: ok-spin-breathe calc(var(--_s) * 2.4) ease-in-out infinite; }
  o-spinner .ok-spin-moon { animation-delay: calc(var(--_s) * -1.2); }
  o-spinner .ok-spin-core { animation: none; }
}
o-spinner[paused] *, o-spinner[paused] { animation-play-state: paused; }
`;

const DEFAULT_COUNT = { dots: 8, segments: 12, orbit: 2 };

export class OrbitSpinner extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['variant', 'value', 'size', 'speed', 'color', 'track', 'accent', 'thickness', 'count', 'label', 'readout', 'shape', 'paused'], RANGE_ATTRS, FORMAT_ATTRS);
  }

  constructor() {
    super();
    this._shown = null;
    this._tween = 0;
  }

  readConfig() {
    const variant = SPINNER_VARIANTS.includes(this.getAttribute('variant')) ? this.getAttribute('variant') : 'ring';
    const raw = this.getAttribute('value');
    const determinate = variant === 'progress' && raw != null && raw.trim() !== '' && Number.isFinite(Number(raw));
    const r = this._range({ min: 0, max: 100, step: 0 });
    const count = Math.round(this._num('count', DEFAULT_COUNT[variant] || 0));
    return {
      variant, determinate, value: r.value, min: r.min, max: r.max, fraction: r.fraction,
      size: this._size('size', '48px'), speed: Math.max(.05, this._num('speed', 1)),
      color: this._color('color', null), track: this._color('track', null), accent: this._color('accent', null),
      thickness: this._thickness(variant === 'progress' ? 1.8 : 2, 6),
      count: variant === 'orbit' ? Math.max(1, Math.min(4, count)) : Math.max(3, Math.min(36, count)),
      label: this.getAttribute('label'), shape: this._str('shape', 'rounded'),
      readout: variant === 'progress' && this.hasAttribute('readout') && this.getAttribute('readout') !== 'false'
    };
  }

  structuralSignature({ variant, determinate, size, count, thickness, shape, readout }) {
    return JSON.stringify({ variant, determinate, size, count, thickness, shape, readout });
  }

  build(cfg) {
    this.onDisconnected();
    this._shown = null;
    const T = fixed(cfg.thickness);
    const shape = e(cfg.shape);
    const arc = (cls, value, extra = '') => `<o-arc class="inner-orbit ${cls}" value="${value}" shape="${shape}"${extra}></o-arc>`;
    let body = '';
    if (cfg.variant === 'dots') {
      body = `<div class="orbit-9" style="--o-size-ratio:3.4">${Array.from({ length: cfg.count }, (_, i) =>
        `<div class="satellite"><div class="capsule ok-spin-dot" style="--i:${i};--n:${cfg.count}"></div></div>`).join('')}</div>`;
    } else if (cfg.variant === 'segments') {
      body = `<div class="orbit-12">${Array.from({ length: cfg.count }, (_, i) =>
        `<div class="vector inner-orbit ok-spin-tick" style="--o-size-ratio:4.6;--i:${i};--n:${cfg.count}"></div>`).join('')}</div>`;
    } else if (cfg.variant === 'orbit') {
      const planets = '<div class="satellite"><div class="capsule ok-spin-planet"></div></div>';
      const moons = '<div class="satellite"><div class="capsule ok-spin-moon"></div></div>'.repeat(cfg.count);
      body = `<div class="orbit-10 ok-spin-path is-outer" style="--o-size-ratio:3.2">${planets}</div>
        <div class="orbit-5 ok-spin-path is-inner" style="--o-size-ratio:2.2">${moons}</div>
        <div class="orbit-0" style="--o-size-ratio:4.2"><div class="satellite at-center"><div class="capsule ok-spin-core"></div></div></div>`;
    } else {
      const ring = `--o-size-ratio:${T};--o-gap:0`;
      const track = `<div class="orbit-12" style="${ring}"><o-arc class="inner-orbit ok-track" value="100"></o-arc></div>`;
      if (cfg.determinate) {
        body = `${track}<div class="orbit-12" style="${ring}">${arc('ok-value ok-spin-fill', 0)}</div>` +
          (cfg.readout ? hub(2 * (12 - cfg.thickness) - 2, '', 'ok-hub ok-spin-readout', ' aria-hidden="true"') : '');
      } else {
        // Two equal arcs: one turns steadily, the other eases ahead and falls
        // behind, so together they draw an arc that stretches and shrinks.
        body = `${track}<div class="orbit-12 ok-spin-rotor" style="${ring}">${arc('ok-value', 18)}</div>` +
          `<div class="orbit-12 ok-spin-rotor is-lead" style="${ring}">${arc('ok-value', 18)}</div>`;
      }
    }
    this.innerHTML = universe(cfg.size, body);
    this._fill = this.querySelector('.ok-spin-fill');
    this._readout = this.querySelector('.ok-spin-readout');
  }

  sync(cfg) {
    this._applyTheme({
      '--ok-spinner-color': cfg.color, '--ok-spinner-track': cfg.track, '--ok-spinner-accent': cfg.accent,
      '--ok-spinner-speed': this.hasAttribute('speed') ? `${fixed(cfg.speed)}s` : null
    });
    const name = this.getAttribute('label') || 'Loading';
    if (cfg.determinate) {
      const range = { min: cfg.min, max: cfg.max };
      // Without a format, the readout is the share done: 40 of 200 reads 20%.
      const fallback = () => `${Math.round(cfg.fraction * 100)}%`;
      const unit = this._formatOptions() ? this._unitText() : '';
      const text = this._formatText(cfg.value, { ...range, fallback }, unit);
      if (this._readout) this._readout.textContent = text;
      this._describe(name, 'progressbar');
      this._ariaRange(cfg, cfg.value, this._formatText(cfg.value, { ...range, kind: 'aria', fallback }, unit));
      this.setAttribute('aria-busy', String(cfg.fraction < 1));
      this._animateTo(cfg.fraction * 100);
    } else {
      this._describe(name, 'progressbar');
      for (const a of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext']) this.removeAttribute(a);
      this.setAttribute('aria-busy', 'true');
    }
  }

  /** Determinate progress glides to its new value (instantly with reduced motion). */
  _animateTo(target) {
    if (!this._fill) return;
    this.onDisconnected();
    const from = this._shown;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (from == null || reduce || Math.abs(target - from) < .05 || typeof requestAnimationFrame !== 'function') {
      this._shown = target;
      this._fill.setAttribute('value', target.toFixed(2));
      return;
    }
    const start = performance.now(), duration = 360;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration), k = 1 - (1 - t) ** 3;
      this._shown = from + (target - from) * k;
      this._fill?.setAttribute('value', this._shown.toFixed(2));
      if (t < 1) this._tween = requestAnimationFrame(step);
    };
    this._tween = requestAnimationFrame(step);
  }

  onDisconnected() { if (this._tween && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._tween); this._tween = 0; }

  /** The progress value; undefined while indeterminate. Setting it does not fire events. */
  get value() {
    const raw = this.getAttribute('value');
    return raw == null || raw.trim() === '' ? undefined : this.readConfig().value;
  }
  set value(v) {
    if (v == null || v === '') this.removeAttribute('value');
    else this.setAttribute('value', String(v));
  }
}

injectStyleOnce('orbit-kit-spinner', SPINNER_CSS);
define('o-spinner', OrbitSpinner);
