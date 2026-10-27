import { OrbitKitElement, define, injectStyleOnce, universe, finiteNumber, cssValue, fixed, normalizeRange, escapeHTML as e, withShared, FORMAT_ATTRS } from './base.js';

/**
 * <o-radar>: a scope with range rings, spokes, a rotating sweep and blips.
 *
 *   .orbit-12 ok-radar-grid           range rings (one element, any count)
 *   .orbit-0  > .vector × spokes      rays from the center, one radius long
 *   .orbit-12 o-radar-sweep           conic-gradient beam, rotating
 *   .orbit-12 > .satellite × targets  blips: angle from --o-angle-composite,
 *                                     distance from --o-alignment
 *
 * Target updates touch only the blip layers, so the sweep never restarts.
 */
const RADAR_CSS = `
o-radar { --ok-font-size: 6cqmin; }
@keyframes o-radar-sweep { to { rotate: 360deg; } }
@keyframes o-radar-ping { 0% { scale: .5; opacity: 1; } 70% { opacity: .45; } 100% { scale: 1.7; opacity: 0; } }
o-radar .ok-radar-grid {
  --c: var(--ok-radar-color, #22d3ee);
  background: repeating-radial-gradient(closest-side, transparent 0 calc(100% / var(--ok-radar-rings) - 1px),
    color-mix(in srgb, var(--c) 22%, transparent) calc(100% / var(--ok-radar-rings) - 1px) calc(100% / var(--ok-radar-rings)));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 35%, transparent);
}
o-radar .ok-radar-spoke { background: color-mix(in srgb, var(--ok-radar-color, #22d3ee) 14%, transparent); height: 1px; }
o-radar .o-radar-sweep {
  --c: var(--ok-radar-color, #22d3ee);
  background: conic-gradient(from 0deg, transparent 0deg,
    color-mix(in srgb, var(--c) 5%, transparent) calc(var(--ok-radar-beam) / 2),
    color-mix(in srgb, var(--c) 30%, transparent) calc(var(--ok-radar-beam) - 3deg),
    color-mix(in srgb, var(--c) 85%, transparent) var(--ok-radar-beam), transparent var(--ok-radar-beam));
  animation: o-radar-sweep var(--ok-radar-speed, var(--o-radar-speed, 4s)) linear infinite;
}
o-radar .ok-radar-target > .satellite { color: var(--ok-radar-color, #22d3ee); }
o-radar .o-radar-blip {
  position: relative; border-radius: 50%; width: max(5px, 3.5cqmin); aspect-ratio: 1;
  background: currentColor; box-shadow: 0 0 10px currentColor;
}
o-radar .o-radar-blip::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 1px solid currentColor; animation: o-radar-ping 1.8s ease-out infinite; }
o-radar .ok-radar-center { display: flex; flex-direction: column; align-items: center; gap: .3em; color: var(--ok-radar-color, #22d3ee); }
o-radar .ok-radar-center::before { content: ""; width: max(4px, 2.4cqmin); aspect-ratio: 1; border-radius: 50%; background: currentColor; }
o-radar .ok-radar-label { font-weight: 800; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { o-radar .o-radar-sweep, o-radar .o-radar-blip::after { animation: none; } }
`;

export class OrbitRadar extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['targets', 'rings', 'spokes', 'size', 'color', 'accent', 'sweep', 'sweep-width', 'speed', 'label', 'min', 'max'], FORMAT_ATTRS);
  }
  readConfig() {
    // `dist` is read in min..max (0 to 1 by default): min at the center, max at the edge.
    const r = normalizeRange({ min: this._num('min', 0), max: this._num('max', 1) });
    const share = (d) => (r.span ? (d - r.min) / r.span : 0);
    return {
      min: r.min, max: r.max,
      targets: this._array('targets').map((t) => {
        const raw = Math.min(r.max, Math.max(r.min, finiteNumber(t.dist, r.min + r.span / 2)));
        return { angle: ((finiteNumber(t.angle) % 360) + 360) % 360, raw, dist: share(raw), color: cssValue(t.color), label: t.label == null ? null : String(t.label) };
      }),
      rings: Math.max(1, Math.min(60, Math.round(this._num('rings', 4)))),
      spokes: Math.max(0, Math.min(360, Math.round(this._num('spokes', 8)))), size: this._size('size', '240px'),
      color: this._color('color', this._color('accent', null)), sweep: this._str('sweep', 'true') !== 'false',
      sweepWidth: Math.min(300, Math.max(10, this._num('sweep-width', 110))), speed: Math.max(.01, this._num('speed', 4)), label: this.getAttribute('label')
    };
  }
  structuralSignature({ targets, speed, label, color, min, max, ...structure }) { return JSON.stringify(structure); }
  _target(t) {
    return `<div class="orbit-12 ok-radar-target"><div class="satellite" style="--o-angle-composite:${fixed(t.angle - 90)}deg;--o-alignment:calc(var(--o-radius) * ${fixed(1 - t.dist, 4)});${t.color ? `color:${e(t.color)}` : ''}"><div class="capsule o-radar-blip"></div></div></div>`;
  }
  build(cfg) {
    const spokes = cfg.spokes ? `<div class="orbit-0">${'<div class="vector outer-orbit ok-radar-spoke" style="--o-size-ratio:12"></div>'.repeat(cfg.spokes)}</div>` : '';
    const sweep = cfg.sweep ? '<div class="orbit-12 o-radar-sweep"></div>' : '';
    this.innerHTML = universe(cfg.size, `
      <div class="orbit-12 ok-radar-grid"></div>${spokes}${sweep}${cfg.targets.map((t) => this._target(t)).join('')}
      <div class="orbit-0"><div class="satellite at-center"><div class="capsule ok-radar-center"><span class="ok-radar-label">${e(cfg.label ?? '')}</span></div></div></div>`,
    { spot: `--ok-radar-rings:${cfg.rings};--ok-radar-beam:${cfg.sweepWidth}deg` });
    this._scope = this.querySelector('.gravity-spot');
    this._targets = [...this.querySelectorAll('.ok-radar-target')];
    this._label = this.querySelector('.ok-radar-label');
    this._sweep = this.querySelector('.o-radar-sweep');
  }
  sync(cfg) {
    this._applyTheme({ '--ok-radar-color': cfg.color, '--ok-radar-speed': `${cfg.speed}s` });
    // Reconcile only the target layers, keeping the animated sweep node alive.
    while (this._targets.length > cfg.targets.length) this._targets.pop().remove();
    while (this._targets.length < cfg.targets.length && this._scope?.insertAdjacentHTML) {
      this._scope.insertAdjacentHTML('beforeend', this._target(cfg.targets[this._targets.length]));
      this._targets.push(this._scope.lastElementChild);
    }
    this._targets.forEach((layer, i) => {
      const t = cfg.targets[i];
      const satellite = layer.querySelector('.satellite');
      satellite.style.setProperty('--o-angle-composite', `${fixed(t.angle - 90)}deg`);
      satellite.style.setProperty('--o-alignment', `calc(var(--o-radius) * ${fixed(1 - t.dist, 4)})`);
      if (t.color) satellite.style.setProperty('color', t.color);
      else satellite.style.removeProperty?.('color');
    });
    if (this._label) { this._label.textContent = cfg.label ?? ''; this._label.hidden = !cfg.label; }
    this._describe([cfg.label || 'Radar', ...cfg.targets.map((t, i) => `${t.label ?? `Target ${i + 1}`}: ${t.angle} degrees, ${this._formatOptions() || this._formatter ? `distance ${this._formatText(t.raw, { min: cfg.min, max: cfg.max, kind: 'aria' })}` : `${Math.round(t.dist * 100)}% distance`}`)].join('; '));
  }
}
injectStyleOnce('orbit-kit-radar', RADAR_CSS);
define('o-radar', OrbitRadar);
