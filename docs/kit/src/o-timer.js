/**
 * <o-timer>: a countdown ring with start, pause and reset.
 *
 *   .orbit-12 > o-arc.inner-orbit        track
 *   .orbit-12 > o-progress.inner-orbit   time left (shrinks back toward 12 o'clock)
 *   .orbit-11 > .vector × ticks          optional dial marks
 *   .orbit-0  > .satellite.at-center     time, caption and a start/pause button
 *
 * Methods: start(), pause(), toggle(), reset(). Properties: remaining,
 * running, duration. Events (bubbling): start, pause, reset, tick, done.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, escapeHTML as e } from './base.js';

const TIMER_CSS = `
o-timer .ok-track { --o-fill: var(--ok-track, rgba(127,127,127,.18)); --o-stroke: var(--o-fill); }
o-timer .ok-value { --o-fill: var(--ok-fill, #3da9fc); --o-stroke: var(--o-fill); transition: fill .3s; }
o-timer.is-warning .ok-value { --o-fill: var(--ok-timer-warn, #f59e0b); }
o-timer.is-done .ok-value { --o-fill: var(--ok-timer-done, #ef4565); }
o-timer .ok-timer-tick { background: var(--ok-tick, currentColor); opacity: .35; height: max(1px, .5cqmin); }
o-timer .ok-timer-tick.is-major { opacity: .7; height: max(1px, .8cqmin); }
o-timer .ok-timer-hub { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .15em; }
o-timer .ok-timer-time { font-size: 2em; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: -.02em; }
o-timer .ok-timer-label { font-size: .75em; opacity: .7; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
o-timer .ok-timer-controls { display: flex; gap: .4em; margin-top: .35em; }
o-timer .ok-timer-btn {
  font: inherit; font-size: .8em; line-height: 1; display: grid; place-items: center;
  width: 2.4em; aspect-ratio: 1; padding: 0; border-radius: 50%; cursor: pointer;
  color: var(--ok-timer-button-text, #0c0f13); background: var(--ok-timer-button, var(--ok-fill, #3da9fc));
  border: none; transition: filter .15s, scale .15s;
}
o-timer .ok-timer-btn.is-secondary { color: inherit; background: var(--ok-timer-button-alt, rgba(127,127,127,.22)); }
o-timer .ok-timer-btn:hover { filter: brightness(1.12); }
o-timer .ok-timer-btn:active { scale: .94; }
o-timer .ok-timer-btn svg { width: 1em; height: 1em; fill: currentColor; }
o-timer .ok-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { o-timer .ok-value, o-timer .ok-timer-btn { transition: none; } }
`;

const ICONS = {
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5v11l9-5.5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z"/></svg>',
  reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.7l1.4.5A4 4 0 1 0 8 4v2L4.5 3.25 8 .5z"/></svg>'
};

/** "90", "1:30", "1:02:03" or "90s" → seconds. */
export function parseDuration(value, fallback = 60) {
  const text = String(value ?? '').trim();
  if (/^\d+(?:\.\d+)?s?$/.test(text)) return Number.parseFloat(text);
  if (/^\d+(?::\d{1,2}){1,2}$/.test(text)) return text.split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
  return fallback;
}

/** Seconds → "m:ss" or "h:mm:ss", rounded up so 0:00 means done. */
export function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds - 1e-6));
  const h = Math.floor(whole / 3600), m = Math.floor(whole / 60) % 60, s = whole % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export class OrbitTimer extends OrbitKitElement {
  static get observedAttributes() {
    return ['duration', 'remaining', 'running', 'label', 'size', 'thickness', 'fill', 'track', 'shape', 'ticks', 'warn', 'controls', 'glow'];
  }

  constructor() {
    super();
    this._frame = this._frame.bind(this);
  }

  readConfig() {
    const duration = Math.max(.001, parseDuration(this.getAttribute('duration'), 60));
    return {
      duration, size: this._size('size', '200px'), thickness: this._thickness(1.4, 6),
      fill: this._color('fill', null), track: this._color('track', null), shape: this._str('shape', 'rounded'),
      ticks: Math.max(0, Math.min(120, Math.round(this._num('ticks', 0)))),
      warn: Math.max(0, parseDuration(this.getAttribute('warn'), 0)),
      controls: this._str('controls', 'true') !== 'false',
      label: this.getAttribute('label'), glow: this.hasAttribute('glow') ? this._glowPx() : null
    };
  }

  structuralSignature({ duration, label, fill, track, warn, ...rest }) { return JSON.stringify(rest); }

  build(cfg) {
    injectStyleOnce('orbit-kit-timer', TIMER_CSS);
    const ring = `--o-size-ratio:${fixed(cfg.thickness)};--o-gap:0`;
    const glow = cfg.glow == null ? '' : ` style="filter:drop-shadow(0 0 ${cfg.glow}px var(--ok-fill, #3da9fc))"`;
    const ticks = cfg.ticks
      ? `<div class="orbit-${Math.max(1, Math.floor(12 - cfg.thickness - .3))}" style="--o-size-ratio:.6">${Array.from({ length: cfg.ticks }, (_, i) =>
        `<div class="vector inner-orbit ok-timer-tick${cfg.ticks % 4 === 0 && i % (cfg.ticks / 4) === 0 ? ' is-major' : ''}"></div>`).join('')}</div>` : '';
    const controls = cfg.controls ? `<span class="ok-timer-controls">
        <button type="button" class="ok-timer-btn ok-timer-toggle"></button>
        <button type="button" class="ok-timer-btn is-secondary ok-timer-reset" aria-label="Reset">${ICONS.reset}</button>
      </span>` : '';
    const inner = Math.floor(12 - cfg.thickness - (cfg.ticks ? 1.2 : .4));
    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12" style="${ring}"><o-arc class="inner-orbit ok-track" value="100" shape="${e(cfg.shape)}"></o-arc></div>
      <div class="orbit-12" style="${ring}"><o-progress class="inner-orbit ok-value" value="100" shape="${e(cfg.shape)}"${glow}></o-progress></div>
      ${ticks}
      ${hub(2 * inner, `<span class="ok-timer-time" aria-hidden="true"></span><span class="ok-timer-label" hidden></span>${controls}<span class="ok-sr" aria-live="polite"></span>`, 'ok-timer-hub')}`);
    this._ring = this.querySelector('o-progress');
    this._time = this.querySelector('.ok-timer-time');
    this._label = this.querySelector('.ok-timer-label');
    this._toggle = this.querySelector('.ok-timer-toggle');
    this._reset = this.querySelector('.ok-timer-reset');
    this._live = this.querySelector('.ok-sr');
    this._toggle?.addEventListener('click', () => this.toggle());
    this._reset?.addEventListener('click', () => this.reset());
  }

  sync(cfg) {
    this._cfg = cfg;
    this._applyTheme({ '--ok-fill': cfg.fill, '--ok-track': cfg.track });
    // A new duration (or a remaining attribute) sets the clock while stopped.
    const remainingAttr = this.getAttribute('remaining');
    if (this._remaining == null || this._duration !== cfg.duration || remainingAttr !== this._remainingAttr) {
      this._duration = cfg.duration;
      this._remainingAttr = remainingAttr;
      const start = remainingAttr == null ? cfg.duration : Math.min(cfg.duration, Math.max(0, parseDuration(remainingAttr, cfg.duration)));
      if (this._ticking) this.remaining = start;
      else this._remaining = start;
    }
    if (this._label) { this._label.textContent = cfg.label ?? ''; this._label.hidden = !cfg.label; }
    const wantRunning = this.hasAttribute('running') && this.getAttribute('running') !== 'false';
    if (wantRunning && !this._ticking && this.isConnected) this.start();
    else if (!wantRunning && this._ticking) this.pause();
    this._paint(true);
  }

  get duration() { return this._duration ?? this.readConfig().duration; }
  set duration(value) { this.setAttribute('duration', String(value)); }
  get remaining() { return Math.max(0, this._remaining ?? this.duration); }
  set remaining(value) {
    this._remaining = Math.min(this.duration, Math.max(0, Number(value) || 0));
    if (this._ticking) this._endAt = performance.now() + this._remaining * 1000;
    this._paint(true);
  }
  get running() { return !!this._ticking; }
  set running(value) { value ? this.start() : this.pause(); }

  start() {
    if (this._ticking) return;
    if (this.remaining <= 0) this._remaining = this.duration;
    this._ticking = true;
    this._doneSent = false;
    this._endAt = performance.now() + this.remaining * 1000;
    if (this.getAttribute('running') == null || this.getAttribute('running') === 'false') this.setAttribute('running', '');
    this._emit('start');
    this._raf = requestAnimationFrame(this._frame);
    this._paint(true);
  }

  pause() {
    if (!this._ticking) return;
    this._update();
    this._ticking = false;
    cancelAnimationFrame(this._raf);
    if (this.hasAttribute('running')) this.removeAttribute('running');
    this._emit('pause');
    this._paint(true);
  }

  toggle() { this._ticking ? this.pause() : this.start(); }

  reset() {
    const wasRunning = this._ticking;
    if (wasRunning) { this._ticking = false; cancelAnimationFrame(this._raf); if (this.hasAttribute('running')) this.removeAttribute('running'); }
    this._remaining = this.duration;
    this._doneSent = false;
    if (this._live) this._live.textContent = '';
    this._emit('reset');
    this._paint(true);
  }

  onDisconnected() {
    if (this._ticking) { this._update(); this._ticking = false; cancelAnimationFrame(this._raf); }
  }

  onConnected() {
    if (this.hasAttribute('running') && this.getAttribute('running') !== 'false' && !this._ticking) this.start();
  }

  _update() {
    if (this._ticking) this._remaining = Math.max(0, (this._endAt - performance.now()) / 1000);
  }

  _frame() {
    if (!this._ticking) return;
    this._update();
    this._paint();
    if (this._remaining <= 0) {
      this._ticking = false;
      if (this.hasAttribute('running')) this.removeAttribute('running');
      this._paint(true);
      if (!this._doneSent) {
        this._doneSent = true;
        if (this._live) this._live.textContent = `${this._cfg?.label ? `${this._cfg.label}: ` : ''}time is up`;
        this._emit('done');
      }
      return;
    }
    this._raf = requestAnimationFrame(this._frame);
  }

  _emit(type) {
    this.dispatchEvent(new CustomEvent(type, { detail: { remaining: this.remaining, duration: this.duration }, bubbles: true, composed: true }));
  }

  _paint(force = false) {
    const remaining = this.remaining, duration = this.duration, cfg = this._cfg;
    const pct = remaining / duration * 100;
    // Redraw the ring in steps of a thousandth: smooth, without a new path every frame.
    if (this._ring && (force || Math.abs(pct - (this._drawn ?? -1)) >= .1)) {
      this._drawn = pct;
      this._ring.setAttribute('value', pct.toFixed(2));
    }
    const text = formatTime(remaining);
    if (force || text !== this._shown) {
      const changed = this._shown !== undefined && text !== this._shown;
      this._shown = text;
      if (this._time) this._time.textContent = text;
      this._describe(`${cfg?.label ? `${cfg.label}: ` : ''}${text} left of ${formatTime(duration)}`, 'timer');
      if (changed && this._ticking) this._emit('tick');
    }
    const done = remaining <= 0;
    this.classList.toggle('is-running', !!this._ticking);
    this.classList.toggle('is-done', done);
    this.classList.toggle('is-warning', !done && !!cfg?.warn && remaining <= cfg.warn);
    if (this._toggle) {
      const state = this._ticking ? 'pause' : 'play';
      if (this._toggle.dataset.state !== state) {
        this._toggle.dataset.state = state;
        this._toggle.innerHTML = ICONS[state];
        this._toggle.setAttribute('aria-label', this._ticking ? 'Pause' : (remaining < duration && !done ? 'Resume' : 'Start'));
      } else if (!this._ticking) this._toggle.setAttribute('aria-label', remaining < duration && !done ? 'Resume' : 'Start');
    }
  }
}

define('o-timer', OrbitTimer);
