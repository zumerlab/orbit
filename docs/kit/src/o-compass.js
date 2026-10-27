/**
 * <o-compass> — heading indicator.
 *
 * A fixed dial with a lubber index at the top; the compass card (36 ticks and
 * the cardinal letters) turns so the current `heading` sits under the index,
 * the way an aircraft heading indicator reads. Turning the card is Orbit's own
 * `--o-from` on its rings, so changing `heading` only re-rotates. Capsules
 * stay upright on their own.
 *
 *   .bigbang > .gravity-spot
 *     ├── .orbit-12 (filled)                     dial face + bezel
 *     ├── .orbit-12 (turns) > .vector × 36       tick scale
 *     ├── .orbit-10 (turns) > .satellite × n     cardinals
 *     ├── .orbit-12 > .satellite.angle-0         lubber index (fixed)
 *     └── .orbit-0  > heading readout
 *
 *   <o-compass heading="45"></o-compass>
 *   <o-compass heading="120" labels="N,NE,E,SE,S,SW,W,NW"></o-compass>
 */
import { OrbitKitElement, define, injectStyleOnce, universe, escapeHTML as e, withShared, FORMAT_ATTRS } from './base.js';

const CMP_CSS = `
o-compass { --ok-font-size: 7cqmin; }
o-compass .ok-cmp-dial {
  background: var(--ok-cmp-face, var(--ok-face, radial-gradient(circle at 50% 35%, #1b212b, #0a0d12)));
  box-shadow: inset 0 0 0 4px var(--ok-cmp-bezel, var(--ok-bezel, #2a3340)), inset 0 4px 18px rgba(0,0,0,.65);
}
o-compass .ok-cmp-tick   { background: var(--ok-cmp-tick, var(--ok-tick, rgba(203,213,225,.4))); height: 1px; }
o-compass .ok-cmp-tick-M { background: var(--ok-cmp-tick-M, var(--ok-hand, #e6edf3)); height: max(2px, .9cqmin); border-radius: 1px; }
o-compass .ok-cmp-card   { font-weight: 800; color: var(--ok-cmp-text, var(--ok-text, #e6edf3)); }
o-compass .ok-cmp-card.north { color: var(--ok-cmp-accent, var(--ok-accent, #ef4444)); }
o-compass .ok-cmp-lubber {
  filter: drop-shadow(0 0 var(--ok-cmp-glow, 0px) var(--ok-cmp-accent, var(--ok-accent, #ef4444)));
  width: 0; height: 0; border-left: .45em solid transparent; border-right: .45em solid transparent;
  border-top: .8em solid var(--ok-cmp-accent, var(--ok-accent, #ef4444)); translate: 0 40%;
}
o-compass .ok-cmp-readout { display: flex; flex-direction: column; align-items: center; line-height: 1.05; }
o-compass .ok-cmp-deg { font-weight: 800; font-size: 1.5em; font-variant-numeric: tabular-nums; color: var(--ok-cmp-text, var(--ok-text, #f8fafc)); }
o-compass .ok-cmp-sub { font-size: .65em; opacity: .6; }
`;

// Compass point abbreviations for the heading readout.
const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export class OrbitCompass extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['heading', 'size', 'labels', 'fill', 'accent', 'glow'], FORMAT_ATTRS);
  }

  readConfig() {
    const labels = this._str('labels', 'N,E,S,W').split(',').map((s) => s.trim()).filter(Boolean);
    return {
      heading: ((this._num('heading', 0) % 360) + 360) % 360,
      labels,
      size: this._size('size', '220px'),
      fill: this._color('accent', this._color('fill', null)),
      unit: this._unitText('°'),
      glow: this.getAttribute('glow')
    };
  }

  structuralSignature(cfg) {
    const { heading, unit, fill, ...rest } = cfg;
    return JSON.stringify(rest);
  }

  build(cfg) {
    injectStyleOnce('orbit-kit-compass', CMP_CSS);
    this._applyTheme({ '--ok-cmp-glow': cfg.glow == null ? null : `${Math.max(0, this._num('glow', 6))}px` });

    // 36 ticks every 10°; every 9th (90°) is a long cardinal tick.
    const ticks = Array.from({ length: 36 }, (_, i) =>
      `<div class="vector inner-orbit ${i % 9 === 0 ? 'ok-cmp-tick-M" style="--o-size-ratio:1.5' : 'ok-cmp-tick" style="--o-size-ratio:.8'}"></div>`).join('');

    // Cardinals distributed by count (NO fit-range — that overlaps on a 360 loop).
    // Plain satellites (NOT spin-lock): the capsule stays upright by default
    // while the ring's --o-from rotates only their POSITION. spin-lock would
    // over-rotate the letters once we drive --o-from for the heading.
    const cards = cfg.labels.map((l, i) =>
      `<div class="satellite"><div class="capsule ok-cmp-card${i === 0 ? ' north' : ''}">${e(l)}</div></div>`).join('');

    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12 ok-cmp-dial ok-surface"></div>
      <div class="orbit-12 ok-cmp-rotor o-cmp-ticks" style="--o-from:0deg">${ticks}</div>
      <div class="orbit-10 ok-cmp-rotor o-cmp-cards" style="--o-from:0deg">${cards}</div>
      <div class="orbit-12"><div class="satellite angle-0"><div class="capsule ok-cmp-lubber"></div></div></div>
      <div class="orbit-0"><div class="satellite at-center"><div class="capsule ok-cmp-readout">
        <span class="ok-cmp-deg"></span><span class="ok-cmp-sub"></span>
      </div></div></div>`);

    this._ticks = this.querySelector('.o-cmp-ticks');
    this._cards = this.querySelector('.o-cmp-cards');
    this._deg = this.querySelector('.ok-cmp-deg');
    this._sub = this.querySelector('.ok-cmp-sub');
  }

  sync(cfg) {
    // Rotate the card so the heading lands under the fixed top index.
    const rot = `${-cfg.heading}deg`;
    if (this._ticks) this._ticks.style.setProperty('--o-from', rot);
    if (this._cards) this._cards.style.setProperty('--o-from', rot);
    const range = { min: 0, max: 360 };
    const degrees = (h) => String(Math.round(h) % 360).padStart(3, '0');
    if (this._deg) this._deg.textContent = this._formatText(cfg.heading, { ...range, fallback: degrees }, cfg.unit);
    if (this._sub) this._sub.textContent = POINTS[Math.round(cfg.heading / 45) % 8];
    this._describe(`Heading ${this._formatText(cfg.heading, { ...range, kind: 'aria', fallback: (h) => String(Math.round(h) % 360) }, cfg.unit)}, ${POINTS[Math.round(cfg.heading / 45) % 8]}`);
    this._applyTheme({ '--ok-cmp-accent': cfg.fill });
  }
}

define('o-compass', OrbitCompass);
