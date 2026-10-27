/**
 * <o-clock>: an analog clock or watch face.
 *
 * Every part is a plain Orbit element and the rotation math is Orbit's job.
 * The dial is the universe (orbit-12 is its edge). Hands are `.vector`s on the
 * center orbit, pointed by `--o-angle-composite`; ticks are vectors spread
 * around orbit-11; numerals are satellites on orbit-9; sub-dials are
 * satellites that hold a universe of their own, with their own hands.
 *
 * Variants:
 *   - case:    round | square | rounded | rectangle   (the body/bezel)
 *   - dial:    round | oval                            (oval uses Orbit ellipses,
 *              oriented to match the case so a rectangle gives a true tonneau)
 *   - numerals:arabic | roman | none
 *   - complications: digital readout, date window, brand label
 *   - subdials: chronograph tri-compax (small seconds / 24h / date), live
 *   - presets: classic | roman | minimal | chrono | smartwatch
 *
 *   <o-clock live seconds></o-clock>
 *   <o-clock preset="chrono" live brand="Orbit"></o-clock>
 *   <o-clock case="rectangle" dial="oval" live smooth></o-clock>   <!-- tonneau -->
 *
 * Hands/readouts are patched in place every frame/second; the structure is
 * rebuilt only when the face itself changes.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, hub, escapeHTML as e } from './base.js';

const CLOCK_CSS = `
o-clock { --ok-font-size: 7.5cqmin; }
o-clock .ok-clock-case {
  box-sizing: border-box; display: flex; align-items: center; justify-content: center;
}
o-clock .ok-clock-case > .bigbang { width: 100%; }
o-clock .ok-clock-case--round     { border-radius: 50%; }
o-clock .ok-clock-case--square    { border-radius: 9%; padding: 8%; }
o-clock .ok-clock-case--rounded   { border-radius: 26%; padding: 8%; }
o-clock .ok-clock-case--rectangle { border-radius: 24%; padding: 8%; }
o-clock .ok-clock-case--rectangle > .bigbang { height: auto; align-self: stretch; aspect-ratio: auto; }
o-clock .ok-clock-case--square,
o-clock .ok-clock-case--rounded,
o-clock .ok-clock-case--rectangle {
  background: var(--ok-clock-case-bg, var(--ok-case, linear-gradient(160deg, #232a34, #11151b)));
  box-shadow: 0 10px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);
}
o-clock .ok-clock-face { color: var(--ok-clock-numeral, var(--ok-text, #e6edf3)); }
o-clock .ok-clock-dial {
  background: var(--ok-clock-face, var(--ok-face, radial-gradient(circle at 50% 35%, #1b212b, #0c0f14)));
  box-shadow: inset 0 0 0 4px var(--ok-clock-bezel, var(--ok-bezel, #2a3340)), inset 0 4px 18px rgba(0,0,0,.6);
}
o-clock .ok-clock-tick   { background: var(--ok-clock-tick, var(--ok-tick, rgba(230,237,243,.35))); height: max(1px, .6cqmin); border-radius: 2px; }
o-clock .ok-clock-tick-h { background: var(--ok-clock-tick-h, var(--ok-hand, #e6edf3)); height: max(2px, 1cqmin); border-radius: 2px; }
o-clock .ok-clock-num    { font-weight: 700; font-variant-numeric: tabular-nums; }
o-clock .ok-clock-brand   { font-size: .6em; font-weight: 800; white-space: nowrap; color: var(--ok-clock-accent, var(--ok-accent, #ef4565)); }
o-clock .ok-clock-digital { font-size: .7em; font-weight: 700; font-variant-numeric: tabular-nums; opacity: .85; }
o-clock .ok-clock-date    { font-size: .62em; font-weight: 800; font-variant-numeric: tabular-nums; padding: .12em .4em; border-radius: 4px; background: color-mix(in srgb, currentColor 12%, transparent); }
o-clock .ok-clock-hour   { background: var(--ok-clock-hand, var(--ok-hand, #e6edf3)); height: max(3px, 2.4cqmin); border-radius: 9px; }
o-clock .ok-clock-min    { background: var(--ok-clock-hand, var(--ok-hand, #e6edf3)); height: max(2px, 1.7cqmin); border-radius: 9px; }
o-clock .ok-clock-sec    { background: var(--ok-clock-accent, var(--ok-accent, #ef4565)); height: max(1px, .7cqmin); border-radius: 2px; }
o-clock .ok-clock-cap    { background: var(--ok-clock-accent, var(--ok-accent, #ef4565)); box-shadow: 0 0 0 max(2px, .8cqmin) var(--ok-clock-face-cap, var(--ok-surface, #0c0f14)); }
o-clock .ok-clock-ringtime { font-weight: 800; font-variant-numeric: tabular-nums; color: var(--ok-clock-numeral, var(--ok-text, #e6edf3)); text-align: center; --ok-hub-size: 1.1em; }
/* sub-dials */
o-clock .ok-subdial-ring { border: 1px solid var(--ok-clock-tick, rgba(230,237,243,.3)); box-shadow: inset 0 0 8px rgba(0,0,0,.4); }
o-clock .ok-sub-tick     { background: var(--ok-clock-tick, rgba(230,237,243,.3)); height: 1px; }
o-clock .ok-subdial-hand { background: var(--ok-clock-accent, var(--ok-accent, #ef4565)); height: max(1px, .6cqmin); border-radius: 2px; }
o-clock .ok-subdial-cap  { background: var(--ok-clock-tick-h, var(--ok-hand, #e6edf3)); }
o-clock .ok-subdial-label{ font-size: .4em; opacity: .6; }
o-clock.ok-glow .ok-clock-hour,
o-clock.ok-glow .ok-clock-min  { filter: drop-shadow(0 0 var(--ok-clock-glow, 4px) var(--ok-clock-hand, var(--ok-hand, #e6edf3))); }
o-clock.ok-glow .ok-clock-sec  { filter: drop-shadow(0 0 var(--ok-clock-glow, 5px) var(--ok-clock-accent, var(--ok-accent, #ef4565))); }
o-clock .ok-ring-track, o-clock .ok-ring-value { --o-stroke: var(--o-fill); }
`;

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const ARABIC = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

// Presets are just default bundles; any explicit attribute overrides them.
const PRESETS = {
  classic:    { case: 'round',   numerals: 'arabic' },
  roman:      { case: 'round',   numerals: 'roman' },
  minimal:    { case: 'round',   numerals: 'none' },
  chrono:     { case: 'round',   numerals: 'arabic', subdials: true, brand: 'Orbit' },
  smartwatch: { case: 'rounded', numerals: 'arabic', seconds: true, smooth: true,
                digital: true, date: true, accent: '#3da9fc' }
};
const CASES = ['round', 'square', 'rounded', 'rectangle'];

export class OrbitClock extends OrbitKitElement {
  static get observedAttributes() {
    return ['time', 'live', 'smooth', 'seconds', 'numerals', 'size', 'preset',
            'case', 'dial', 'digital', 'date', 'brand', 'subdials',
            'face', 'bezel', 'case-bg', 'hand-color', 'accent', 'tick-color', 'glow',
            'hour-color', 'minute-color', 'second-color'];
  }

  /** Resolve a string attribute against the active preset, then a hard default. */
  _opt(name, dflt) {
    const v = this.getAttribute(name);
    if (v != null) return v;
    const p = PRESETS[this.getAttribute('preset')];
    return (p && p[name] != null) ? p[name] : dflt;
  }

  /** Resolve a boolean attribute (supports `attr="false"`) against the preset. */
  _flag(name, dflt = false) {
    if (this.hasAttribute(name)) return this.getAttribute(name) !== 'false';
    const p = PRESETS[this.getAttribute('preset')];
    return (p && p[name] != null) ? !!p[name] : dflt;
  }

  readConfig() {
    const caseShape = CASES.includes(this._opt('case', 'round')) ? this._opt('case', 'round') : 'round';
    const smooth = this._flag('smooth');
    return {
      time: this._str('time', null),
      live: this._flag('live'),
      smooth,
      seconds: this._flag('seconds') || smooth,
      numerals: this._opt('numerals', 'arabic'),
      caseShape,
      oval: this._opt('dial', 'round') === 'oval',
      ringsFace: this._opt('dial', 'round') === 'rings',
      digital: this._flag('digital'),
      date: this._flag('date'),
      subdials: this._flag('subdials'),
      brand: this._opt('brand', null),
      size: this._size('size', '300px'),
      glow: this.getAttribute('glow'),
      theme: ['face', 'bezel', 'case-bg', 'hand-color', 'accent', 'tick-color', 'hour-color', 'minute-color', 'second-color']
        .map((a) => this.getAttribute(a)).join('|')
    };
  }

  structuralSignature(cfg) {
    // Hands + digital/date/sub-dial readouts are patched live; only the face rebuilds.
    const { time, live, smooth, ...rest } = cfg;
    return JSON.stringify(rest);
  }

  build(cfg) {
    injectStyleOnce('orbit-kit-clock', CLOCK_CSS);
    this.classList.toggle('ok-glow', cfg.glow != null);
    this._ringTime = this._ringH = this._ringM = this._ringS = null; // reset face mode each build

    // Convenience attributes mirror the CSS custom properties.
    const map = {
      face: '--ok-clock-face', bezel: '--ok-clock-bezel', 'case-bg': '--ok-clock-case-bg',
      'hand-color': '--ok-clock-hand', accent: '--ok-clock-accent', 'tick-color': '--ok-clock-tick'
    };
    const overrides = Object.fromEntries(Object.entries(map).map(([attr, prop]) => [prop, this.getAttribute(attr)]));
    overrides['--ok-clock-accent'] = this.getAttribute('accent') ?? PRESETS[this.getAttribute('preset')]?.accent ?? null;
    overrides['--ok-clock-glow'] = cfg.glow == null ? null : `${Math.max(0, this._num('glow', 5))}px`;
    this._applyTheme(overrides);

    if (cfg.ringsFace) { this._buildRingsFace(cfg); return; }

    // The case is a box around the dial; the dial is the universe. A
    // rectangle case gives a tall universe whose shorter side is its width.
    const caseH = cfg.caseShape === 'rectangle' ? 126 : 100;
    const ellipse = cfg.oval ? `--o-ellipse-x:1;--o-ellipse-y:${cfg.caseShape === 'rectangle' ? (100 / caseH).toFixed(3) : '.82'};` : '';

    // --- ticks: 60 minute, 12 hour (overdraw every 5th) ---
    const minuteTicks = Array.from({ length: 60 }, () =>
      '<div class="vector inner-orbit ok-clock-tick"></div>').join('');
    const hourTicks = Array.from({ length: 12 }, () =>
      '<div class="vector inner-orbit ok-clock-tick-h"></div>').join('');

    // --- numerals ---
    const labels = cfg.numerals === 'roman' ? ROMAN
                 : cfg.numerals === 'none' ? null : ARABIC;
    const numerals = labels
      ? `<div class="orbit-${cfg.numerals === 'roman' ? 8 : 9}">${labels.map((n) =>
          `<div class="satellite"><div class="capsule ok-clock-num">${n}</div></div>`).join('')}</div>`
      : '';

    // --- complications (suppressed when sub-dials own the lower face) ---
    const brand = cfg.brand
      ? `<div class="orbit-4"><div class="satellite angle-0"><div class="capsule ok-clock-brand">${e(cfg.brand)}</div></div></div>`
      : '';
    const digital = (cfg.digital && !cfg.subdials)
      ? `<div class="orbit-4"><div class="satellite angle-180"><div class="capsule ok-clock-digital"></div></div></div>`
      : '';
    const date = (cfg.date && !cfg.subdials)
      ? `<div class="orbit-6"><div class="satellite angle-90"><div class="capsule ok-clock-date"></div></div></div>`
      : '';

    // --- sub-dials: chronograph tri-compax at 3/6/9 ---
    const subdials = cfg.subdials
      ? this._subdial('sec', 'angle-270', 'S')   // 9 o'clock: small seconds
      + this._subdial('h24', 'angle-90', '24')   // 3 o'clock: 24-hour
      + this._subdial('date', 'angle-180', '31') // 6 o'clock: date
      : '';

    // --- hands (length in lanes; outer-orbit starts them at the center) ---
    const secondHand = cfg.seconds
      ? '<div class="vector outer-orbit ok-clock-hand ok-clock-sec" style="--o-size-ratio:10"></div>'
      : '';

    this.innerHTML = `
      <div class="ok-clock-case ok-clock-case--${cfg.caseShape}${cfg.caseShape === 'round' ? '' : ' ok-surface'}" style="width:${e(cfg.size)};aspect-ratio:100 / ${caseH}">
        <div class="bigbang">
          <div class="gravity-spot ok-clock-face"${ellipse ? ` style="${ellipse}"` : ''}>
            <div class="orbit-12 ok-clock-dial ok-surface"></div>
            <div class="orbit-11" style="--o-size-ratio:.45">${minuteTicks}</div>
            <div class="orbit-11" style="--o-size-ratio:.9">${hourTicks}</div>
            ${numerals}
            ${brand}${digital}${date}${subdials}
            <div class="orbit-0">
              <div class="vector outer-orbit ok-clock-hand ok-clock-hour" style="--o-size-ratio:5.4"></div>
              <div class="vector outer-orbit ok-clock-hand ok-clock-min" style="--o-size-ratio:8.2"></div>
              ${secondHand}
              <div class="satellite at-center ok-clock-cap" style="--o-size-ratio:.9"></div>
            </div>
          </div>
        </div>
      </div>`;

    this._hourHand = this.querySelector('.ok-clock-hour');
    this._minHand = this.querySelector('.ok-clock-min');
    this._secHand = this.querySelector('.ok-clock-sec');
    this._digital = this.querySelector('.ok-clock-digital');
    this._dateEl = this.querySelector('.ok-clock-date');
    this._subSec = this.querySelector('.ok-sub-sec');
    this._sub24 = this.querySelector('.ok-sub-h24');
    this._subDate = this.querySelector('.ok-sub-date');
  }

  /**
   * One chronograph sub-dial: a satellite that is a universe of its own, with
   * a tick ring, a labeled counter and a single live hand.
   */
  _subdial(kind, angleClass, label) {
    const ticks = Array.from({ length: 12 }, () =>
      '<div class="vector inner-orbit ok-sub-tick"></div>').join('');
    return `
      <div class="orbit-5" style="--o-size-ratio:5.8">
        <div class="satellite ${angleClass}">
          <div class="gravity-spot">
            <div class="orbit-12 ok-subdial-ring"></div>
            <div class="orbit-12" style="--o-size-ratio:1.6">${ticks}</div>
            <div class="orbit-5"><div class="satellite angle-180"><div class="capsule ok-subdial-label">${label}</div></div></div>
            <div class="orbit-0">
              <div class="vector outer-orbit ok-subdial-hand ok-sub-${kind}" style="--o-size-ratio:8.5"></div>
              <div class="satellite at-center ok-subdial-cap" style="--o-size-ratio:1.4"></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  /** iOS-style face: concentric activity rings (hours / minutes / seconds). */
  _buildRingsFace(cfg) {
    // Clear analog refs so _paint takes the rings branch.
    this._hourHand = this._minHand = this._secHand = null;
    this._subSec = this._sub24 = this._subDate = this._digital = this._dateEl = null;

    const defs = [
      { key: 'H', color: this._color('hour-color', '#ff453a') },
      { key: 'M', color: this._color('minute-color', '#32d74b') }
    ];
    if (cfg.seconds) defs.push({ key: 'S', color: this._color('second-color', this._color('accent', '#0a84ff')) });

    const thickness = 2.6;
    const rings = defs.map((r, i) => {
      const ring = `class="orbit-${12 - i * 3}" style="--o-size-ratio:${thickness};--o-gap:0"`;
      const track = `color-mix(in srgb, ${r.color} 18%, transparent)`;
      const glow = cfg.glow != null ? `filter:drop-shadow(0 0 ${Math.max(0, this._num('glow', 5))}px ${r.color});` : '';
      // Solid track arc behind the progress value.
      return `<div ${ring}><o-arc class="inner-orbit ok-ring-track" value="100" shape="rounded" style="--o-fill:${track}"></o-arc></div>`
        + `<div ${ring}><o-progress class="inner-orbit ok-ring-value ok-ring-${r.key}" value="0" max="100" shape="rounded" style="${e(`--o-fill:${r.color};${glow}`)}"></o-progress></div>`;
    }).join('');
    const hole = 12 - (defs.length - 1) * 3 - thickness;
    this.innerHTML = universe(cfg.size, `${rings}${hub(2 * hole - .5, '', 'ok-hub ok-clock-ringtime')}`);

    this._ringH = this.querySelector('.ok-ring-H');
    this._ringM = this.querySelector('.ok-ring-M');
    this._ringS = this.querySelector('.ok-ring-S');
    this._ringTime = this.querySelector('.ok-clock-ringtime');
  }

  sync(cfg) {
    this._paint(this._resolveDate(cfg), cfg.smooth);
    if (cfg.live) this._startLoop(cfg.smooth);
    else this._stopLoop();
  }

  onDisconnected() {
    this._stopLoop();
  }

  /** Point all hands and update digital/date readouts for a given Date. */
  _paint(date, smooth) {
    const h = date.getHours(), m = date.getMinutes();
    this._describe(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`);
    const text = (el, value) => { if (el && el.textContent !== value) el.textContent = value; };
    const s = smooth ? date.getSeconds() + date.getMilliseconds() / 1000 : date.getSeconds();

    // Rings face (iOS-style): fill concentric progress rings by time.
    if (this._ringTime) {
      const setV = (el, frac) => { const v = (frac * 100).toFixed(2); if (el && el.getAttribute('value') !== v) el.setAttribute('value', v); };
      setV(this._ringH, ((h % 12) + m / 60) / 12);
      setV(this._ringM, (m + s / 60) / 60);
      setV(this._ringS, (s % 60) / 60);
      text(this._ringTime, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      return;
    }

    const set = (el, deg) => el && el.style.setProperty('--o-angle-composite', `${deg}deg`);
    // Main hands (composite folds in -90° so 12 o'clock points up).
    set(this._hourHand, (h % 12) * 30 + m / 2 + s / 120 - 90);
    set(this._minHand, m * 6 + s / 10 - 90);
    set(this._secHand, s * 6 - 90);
    // Sub-dials.
    set(this._subSec, s * 6 - 90);
    set(this._sub24, ((h + m / 60) / 24) * 360 - 90);
    set(this._subDate, ((date.getDate() - 1) / 31) * 360 - 90);
    // Digital / date readouts.
    if (this._digital) {
      text(this._digital, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    text(this._dateEl, String(date.getDate()));
  }

  /** Resolve the configured time: explicit `time="HH:MM[:SS]"` or now. */
  _resolveDate(cfg) {
    if (!cfg.live && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(cfg.time || '')) {
      const [hh, mm, ss = 0] = cfg.time.split(':').map(Number);
      if (hh < 24 && mm < 60 && ss < 60) {
        const d = new Date();
        d.setHours(hh, mm, ss, 0);
        return d;
      }
    }
    return new Date();
  }

  _startLoop(smooth) {
    if (this._running && this._loopSmooth === smooth) return;
    this._stopLoop();
    this._running = true;
    this._loopSmooth = smooth;
    if (smooth) {
      const frame = () => {
        this._paint(new Date(), true);
        this._raf = requestAnimationFrame(frame);
      };
      this._raf = requestAnimationFrame(frame);
    } else {
      this._timer = setInterval(() => this._paint(new Date(), false), 1000);
    }
  }

  _stopLoop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._timer) clearInterval(this._timer);
    this._raf = this._timer = null;
  }
}

define('o-clock', OrbitClock);
