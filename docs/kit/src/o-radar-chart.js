/**
 * <o-radar-chart>: a radar (spider) chart. One spoke per axis, one polygon
 * per series. Not to be confused with <o-radar>, the scope with a sweep.
 *
 *   .orbit-0  > .vector × axes             spokes, one web radius long
 *   .orbit-N  > .side × axes   (× levels)  the web: each level is a ring of
 *                                          chords, a regular polygon
 *   .orbit-0  > .satellite.at-center       the plot: an SVG as wide as the
 *     > .capsule > svg                     universe, in lanes (viewBox ±12)
 *   .orbit-N  > .satellite × axes          axis labels, pushed outward with
 *                                          --o-dir-x / --o-dir-y
 *
 * Values are drawn in SVG because every vertex sits at its own distance;
 * the web, spokes and labels are Orbit, so they follow the axes' angles.
 * New data glides from the old shape to the new one.
 *
 * Events (bubbling): select { axis, series, value, axisIndex, seriesIndex },
 * toggle { series, seriesIndex, hidden }.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, fixed, finiteNumber, cssValue, normalizeRange, escapeHTML as e, withShared, FORMAT_ATTRS } from './base.js';

export const RADAR_CHART_PALETTE = ['#4fd1c5', '#ffb547', '#ff7a6b', '#a78bfa', '#60a5fa', '#a3e635'];
/** The web's radius, in lanes; labels sit just outside it. */
const WEB = 7.8;
const LABEL_LANE = 8.7;

/** The smallest of 1, 2, 2.5, 5 × 10^n at or above `v`, for an automatic max. */
export function niceMax(v) {
  if (!(v > 0) || !Number.isFinite(v)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((f) => f * p).find((n) => n >= v * (1 - 1e-9));
}

/** An x/y point (in lanes) on axis i of n, at distance r. Axis 0 points up. */
const at = (i, n, r) => {
  const a = (i / n) * 2 * Math.PI;
  return [r * Math.sin(a), -r * Math.cos(a)];
};

/** A ring `lanes` out: the lane above it, shrunk back toward the one below. */
const ring = (lanes, cls, style = '', inner = '') => {
  const n = Math.max(1, Math.ceil(lanes - 1e-6));
  return `<div class="orbit-${n} ${cls}" style="--o-orbit-ratio:${fixed(n - lanes, 4)}${style}">${inner}</div>`;
};

const RADAR_CHART_CSS = `
:where(o-radar-chart) { display: inline-flex; flex-direction: column; align-items: center; gap: .75em; position: relative; vertical-align: top; }
o-radar-chart { --ok-font-size: 4.1cqmin; --_grid: var(--ok-radar-chart-grid, var(--ok-track, rgba(138,151,165,.3))); }
o-radar-chart .ok-rc-spoke, o-radar-chart .ok-rc-level > .side { background: var(--_grid); }
o-radar-chart .ok-rc-level.is-outer > .side, o-radar-chart .ok-rc-ring.is-outer { --_grid: var(--ok-radar-chart-edge, var(--ok-radar-chart-grid, var(--ok-tick, rgba(138,151,165,.5)))); }
o-radar-chart .ok-rc-ring { box-shadow: inset 0 0 0 1px var(--_grid); }
o-radar-chart .ok-rc-plot { width: 100%; aspect-ratio: 1; pointer-events: none; }
o-radar-chart .ok-rc-plot > svg { display: block; width: 100%; height: 100%; overflow: visible; }
o-radar-chart .ok-rc-scale { font-size: .7px; fill: currentColor; opacity: .55; font-variant-numeric: tabular-nums; }
o-radar-chart .ok-rc-series { color: var(--c); transition: opacity .25s; }
o-radar-chart .ok-rc-area {
  fill: currentColor; fill-opacity: var(--ok-radar-chart-fill-opacity, .18);
  stroke: currentColor; stroke-width: var(--ok-radar-chart-stroke, 2px); stroke-linejoin: round; vector-effect: non-scaling-stroke;
}
o-radar-chart .ok-rc-series.is-dim { opacity: .22; }
o-radar-chart .ok-rc-series.is-hidden { opacity: 0; visibility: hidden; }
o-radar-chart .ok-rc-point { pointer-events: auto; cursor: pointer; outline: none; }
o-radar-chart .ok-rc-hit { fill: transparent; }
o-radar-chart .ok-rc-dot { fill: currentColor; transform-box: fill-box; transform-origin: center; transition: scale .15s; }
o-radar-chart .ok-rc-halo { fill: none; stroke: currentColor; stroke-width: 2px; vector-effect: non-scaling-stroke; opacity: 0; transform-box: fill-box; transform-origin: center; scale: .6; transition: opacity .15s, scale .15s; }
o-radar-chart .ok-rc-point.is-active .ok-rc-dot { scale: 1.35; }
o-radar-chart .ok-rc-point.is-active .ok-rc-halo { opacity: .45; scale: 1; }
o-radar-chart .ok-rc-point:focus-visible .ok-rc-halo { stroke: var(--ok-focus, currentColor); opacity: 1; scale: 1; }
o-radar-chart .ok-rc-label {
  position: absolute; width: max-content; max-width: 7em; line-height: 1.2; font-weight: 600;
  color: var(--ok-radar-chart-label, inherit); opacity: .82;
  translate: calc(var(--o-dir-x) * 50% - 50%) calc(var(--o-dir-y) * 50% - 50%);
  left: 50%; top: 50%; text-align: var(--_align, center);
}
o-radar-chart .ok-rc-tip {
  position: absolute; z-index: 2; pointer-events: none; width: max-content; max-width: 14em;
  translate: -50% calc(-100% - 1.3em); padding: .45em .7em; border-radius: .6em;
  font-size: 4.1cqmin; line-height: 1.25; text-align: left; white-space: nowrap;
  color: var(--ok-radar-chart-tip-text, var(--ok-text, #e8edf2));
  background: var(--ok-radar-chart-tip, var(--ok-surface, rgba(18,22,28,.94)));
  box-shadow: 0 0 0 1px var(--_grid), 0 6px 18px rgba(0,0,0,.28);
}
o-radar-chart .ok-rc-tip strong { display: block; font-size: 1.25em; font-variant-numeric: tabular-nums; }
o-radar-chart .ok-rc-tip span { display: flex; align-items: center; gap: .4em; opacity: .75; }
o-radar-chart .ok-rc-tip i, o-radar-chart .ok-rc-swatch { width: .7em; height: .7em; border-radius: 50%; background: var(--c); flex: none; }
o-radar-chart .ok-rc-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: .3em .5em; font-size: var(--ok-radar-chart-legend-size, .875em); max-width: 100%; }
o-radar-chart .ok-rc-key {
  font: inherit; color: inherit; display: inline-flex; align-items: center; gap: .45em;
  padding: .3em .7em; border-radius: 99px; border: 1px solid transparent; background: none; cursor: pointer;
  transition: opacity .2s, background-color .2s;
}
o-radar-chart .ok-rc-key:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
o-radar-chart .ok-rc-key[aria-pressed="false"] { opacity: .45; }
o-radar-chart .ok-rc-key[aria-pressed="false"] .ok-rc-swatch { background: none; box-shadow: inset 0 0 0 1.5px var(--c); }
o-radar-chart .ok-rc-key:focus-visible { outline: 2px solid var(--ok-focus, #3da9fc); outline-offset: 2px; }
o-radar-chart .ok-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { o-radar-chart .ok-rc-series, o-radar-chart .ok-rc-dot, o-radar-chart .ok-rc-halo, o-radar-chart .ok-rc-key { transition: none; } }
`;

export class OrbitRadarChart extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['data', 'series', 'min', 'max', 'levels', 'grid', 'size', 'label', 'legend', 'scale', 'points', 'duration'], FORMAT_ATTRS);
  }

  constructor() {
    super();
    this._hidden = new Set();
    this._shown = null;
    this._frame = 0;
  }

  readConfig() {
    const raw = this._json('data', []);
    const items = Array.isArray(raw) ? raw : [];
    let axes = items.map((item, i) => {
      const o = item && typeof item === 'object' ? item : { label: item };
      return { label: o.label == null ? `Axis ${i + 1}` : String(o.label), min: o.min, max: o.max, value: o.value };
    });
    let series = this._array('series').map((s, i) => ({
      label: s.label == null ? `Series ${i + 1}` : String(s.label),
      values: Array.isArray(s.values) ? s.values : [],
      color: cssValue(s.color, ''), hidden: s.hidden === true
    }));
    // A single series can live in `data` itself: [{ label, value }].
    if (!series.length && axes.some((a) => a.value != null)) {
      series = [{ label: this.getAttribute('label') || 'Value', values: axes.map((a) => a.value), color: '', hidden: false }];
    }
    if (!axes.length) {
      const n = series.reduce((m, s) => Math.max(m, s.values.length), 0);
      axes = Array.from({ length: n }, (_, i) => ({ label: `Axis ${i + 1}` }));
    }
    const sharedMin = this._num('min', 0);
    const largest = series.reduce((m, s) => s.values.reduce((n, v) => Math.max(n, finiteNumber(v, -Infinity)), m), -Infinity);
    const sharedMax = this._num('max', niceMax(largest - Math.min(0, sharedMin)) + Math.min(0, sharedMin));
    let shared = true;
    axes = axes.map((a) => {
      if (a.min != null || a.max != null) shared = false;
      const r = normalizeRange({ min: finiteNumber(a.min, sharedMin), max: finiteNumber(a.max, sharedMax) });
      return { label: a.label, min: r.min, max: r.max };
    });
    series = series.map((s, i) => {
      const values = axes.map((a, j) => {
        const v = finiteNumber(s.values[j], a.min);
        return Math.min(a.max, Math.max(a.min, v));
      });
      return {
        ...s, values,
        fractions: values.map((v, j) => (axes[j].max > axes[j].min ? (v - axes[j].min) / (axes[j].max - axes[j].min) : 0)),
        color: s.color || (i === 0 ? `var(--ok-fill, ${RADAR_CHART_PALETTE[0]})` : RADAR_CHART_PALETTE[i % RADAR_CHART_PALETTE.length])
      };
    });
    const legend = this.getAttribute('legend');
    return {
      axes, series, shared,
      levels: Math.max(1, Math.min(12, Math.round(this._num('levels', 4)))),
      grid: this.getAttribute('grid') === 'circle' || axes.length < 3 ? 'circle' : 'polygon',
      size: this._size('size', '320px'), label: this.getAttribute('label'),
      legend: legend === 'false' ? false : (legend != null && legend !== 'auto') || series.length > 1,
      scale: this.getAttribute('scale') !== 'false' && shared,
      points: this.getAttribute('points') !== 'false',
      duration: Math.max(0, this._num('duration', 600))
    };
  }

  structuralSignature({ axes, series, levels, grid, size, legend, scale, points }) {
    return JSON.stringify({ axes: axes.length, series: series.length, levels, grid, size, legend, scale, points });
  }

  build(cfg) {
    const n = cfg.axes.length;
    const levels = Array.from({ length: cfg.levels }, (_, k) => WEB * (k + 1) / cfg.levels);
    const outer = (k) => (k === cfg.levels - 1 ? ' is-outer' : '');
    // The web: a ring of chords per level (a regular polygon), or plain rings.
    // Chords are laid out from their midpoints; this --o-from puts their
    // corners on the spokes, whatever the number of axes.
    const web = levels.map((r, k) => (cfg.grid === 'polygon'
      ? ring(r, `ok-rc-level${outer(k)}`, `;--o-from:${fixed(180 / n - 90)}deg`, '<div class="side"></div>'.repeat(n))
      : ring(r, `ok-rc-ring${outer(k)}`))).join('');
    const spokes = n ? `<div class="orbit-0">${`<div class="vector outer-orbit ok-rc-spoke" style="--o-size-ratio:${WEB}"></div>`.repeat(n)}</div>` : '';
    const scale = cfg.scale ? levels.map((r, k) => `<text class="ok-rc-scale" x=".35" y="${fixed(-r + .62)}" data-level="${k}"></text>`).join('') : '';
    const series = cfg.series.map((s, i) => `<g class="ok-rc-series" data-series="${i}"><polygon class="ok-rc-area"></polygon>${cfg.points ? cfg.axes.map((_, j) =>
      `<g class="ok-rc-point" tabindex="-1" role="img" data-series="${i}" data-axis="${j}"><circle class="ok-rc-hit" r="1.1"></circle><circle class="ok-rc-halo" r=".85"></circle><circle class="ok-rc-dot" r=".34"></circle></g>`).join('') : ''}</g>`).join('');
    const plot = `<div class="orbit-0" style="--o-size-ratio:24"><div class="satellite at-center"><div class="capsule ok-rc-plot">` +
      `<svg viewBox="-12 -12 24 24" role="presentation" focusable="false">${scale}${series}</svg><div class="ok-rc-tip" hidden></div></div></div></div>`;
    const labels = n ? ring(LABEL_LANE, 'ok-rc-labels', '', '<div class="satellite"><div class="capsule"><span class="ok-rc-label"></span></div></div>'.repeat(n)) : '';
    const legend = cfg.legend ? `<div class="ok-rc-legend">${cfg.series.map((_, i) => `<button type="button" class="ok-rc-key" data-series="${i}" aria-pressed="true"><span class="ok-rc-swatch"></span><span class="ok-rc-key-text"></span></button>`).join('')}</div>` : '';
    this.innerHTML = universe(cfg.size, `${web}${spokes}${plot}${labels}`) + legend +
      '<div class="ok-sr"><table><caption></caption><thead><tr></tr></thead><tbody></tbody></table></div>';

    this._groups = [...this.querySelectorAll('.ok-rc-series')];
    this._areas = this._groups.map((g) => g.querySelector('.ok-rc-area'));
    this._points = this._groups.map((g) => [...g.querySelectorAll('.ok-rc-point')]);
    this._labels = [...this.querySelectorAll('.ok-rc-label')];
    this._scaleText = [...this.querySelectorAll('.ok-rc-scale')];
    this._keys = [...this.querySelectorAll('.ok-rc-key')];
    this._tip = this.querySelector('.ok-rc-tip');
    this._table = this.querySelector('.ok-sr > table');
    this._active = null;

    for (const point of this._points.flat()) {
      point.addEventListener('pointerenter', () => this._activate(point, false));
      point.addEventListener('pointerleave', () => this._activate(this.contains(this.ownerDocument.activeElement) && this.ownerDocument.activeElement.classList?.contains('ok-rc-point') ? this.ownerDocument.activeElement : null, false));
      point.addEventListener('focus', () => this._activate(point, true));
      point.addEventListener('blur', () => this._activate(null, false));
      point.addEventListener('click', () => { point.focus?.(); this._select(point); });
    }
    for (const key of this._keys) {
      key.addEventListener('click', () => this._toggle(Number(key.dataset.series)));
      key.addEventListener('pointerenter', () => this._highlight(Number(key.dataset.series)));
      key.addEventListener('pointerleave', () => this._highlight(null));
      key.addEventListener('focus', () => this._highlight(Number(key.dataset.series)));
      key.addEventListener('blur', () => this._highlight(null));
    }
    if (!this._listening) {
      this._listening = true;
      this.addEventListener('keydown', (event) => this._onKey(event));
    }
  }

  sync(cfg) {
    this._cfg = cfg;
    const n = cfg.axes.length;
    cfg.series.forEach((s, i) => {
      if (s.hidden && !this._seeded?.has(i)) this._hidden.add(i);
    });
    this._seeded = new Set(cfg.series.map((_, i) => i));
    this._groups.forEach((g, i) => {
      const s = cfg.series[i];
      g.style.setProperty('--c', s.color);
      g.classList.toggle('is-hidden', this._hidden.has(i));
      this._points[i].forEach((p, j) => p.setAttribute('aria-label', `${s.label}, ${cfg.axes[j].label}: ${this._valueText(cfg, i, j, 'aria')}`));
    });
    this._keys.forEach((key, i) => {
      key.style.setProperty('--c', cfg.series[i].color);
      key.querySelector('.ok-rc-key-text').textContent = cfg.series[i].label;
      key.setAttribute('aria-pressed', String(!this._hidden.has(i)));
    });
    // Labels: centered at the top and bottom, flush toward the chart elsewhere.
    this._labels.forEach((label, j) => {
      label.textContent = cfg.axes[j].label;
      const x = Math.sin(j / n * 2 * Math.PI);
      label.style.setProperty('--_align', Math.abs(x) < .2 ? 'center' : x > 0 ? 'left' : 'right');
    });
    const axis0 = cfg.axes[0];
    this._scaleText.forEach((text, k) => {
      const v = axis0.min + (axis0.max - axis0.min) * (k + 1) / cfg.levels;
      text.textContent = this._format(Number(v.toPrecision(12)), { kind: 'tick', min: axis0.min, max: axis0.max, axis: axis0.label, axisIndex: 0, fallback: (x) => String(x) });
    });
    this._fillTable(cfg);
    this._roving();
    const name = cfg.label || 'Radar chart';
    this._describe(`${name}: ${n} axes, ${cfg.series.length === 1 ? '1 series' : `${cfg.series.length} series`}`, 'figure');
    this._animate(cfg.series.map((s) => s.fractions));
    if (this._active) this._activate(this._active, this._activeFocus);
  }

  _valueText(cfg, i, j, kind = 'value') {
    const a = cfg.axes[j];
    // A formatter also gets the axis and series, for a unit per axis.
    return this._formatText(cfg.series[i].values[j], { kind, min: a.min, max: a.max, axis: a.label, axisIndex: j, series: cfg.series[i].label, seriesIndex: i });
  }

  _fillTable(cfg) {
    if (!this._table) return;
    this._table.caption.textContent = cfg.label || 'Radar chart';
    const head = this._table.tHead.rows[0];
    head.innerHTML = `<th scope="col">Axis</th>${cfg.series.map((s) => `<th scope="col">${e(s.label)}</th>`).join('')}`;
    this._table.tBodies[0].innerHTML = cfg.axes.map((a, j) =>
      `<tr><th scope="row">${e(a.label)}</th>${cfg.series.map((_, i) => `<td>${e(this._valueText(cfg, i, j))}</td>`).join('')}</tr>`).join('');
  }

  /** Glide every vertex from what is drawn now to `target` (fractions 0..1). */
  _animate(target) {
    const n = this._cfg.axes.length;
    const from = target.map((row, i) => row.map((_, j) => this._shown?.[i]?.[j] ?? 0));
    if (this._frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._frame);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = this._cfg.duration;
    if (reduce || !duration || typeof requestAnimationFrame !== 'function' || !n) { this._draw(target); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration), k = 1 - (1 - t) ** 3;
      this._draw(target.map((row, i) => row.map((v, j) => from[i][j] + (v - from[i][j]) * k)));
      this._frame = t < 1 ? requestAnimationFrame(step) : 0;
    };
    this._draw(from);
    this._frame = requestAnimationFrame(step);
  }

  _draw(fractions) {
    this._shown = fractions;
    const n = this._cfg.axes.length;
    fractions.forEach((row, i) => {
      const pts = row.map((f, j) => at(j, n, f * WEB));
      this._areas[i]?.setAttribute('points', pts.map(([x, y]) => `${fixed(x)},${fixed(y)}`).join(' '));
      this._points[i]?.forEach((p, j) => p.setAttribute('transform', `translate(${fixed(pts[j][0])} ${fixed(pts[j][1])})`));
    });
    if (this._active) this._placeTip(this._active);
  }

  /** Show a point's value in the tooltip and bring its series forward. */
  _activate(point, focus) {
    this._active = point;
    this._activeFocus = focus;
    for (const p of this._points.flat()) p.classList.toggle('is-active', p === point);
    if (!point || !this._tip || !this._cfg) {
      if (this._tip) this._tip.hidden = true;
      this._highlight(null);
      return;
    }
    const i = Number(point.dataset.series), j = Number(point.dataset.axis), cfg = this._cfg;
    const s = cfg.series[i];
    if (!s) return;
    this._tip.style.setProperty('--c', s.color);
    this._tip.innerHTML = `<span>${cfg.series.length > 1 ? `<i></i>${e(s.label)} · ` : ''}${e(cfg.axes[j].label)}</span><strong>${e(this._valueText(cfg, i, j))}</strong>`;
    this._tip.hidden = false;
    this._placeTip(point);
    this._highlight(i);
    if (focus) this._roving(point);
  }

  _placeTip(point) {
    const i = Number(point.dataset.series), j = Number(point.dataset.axis);
    const f = this._shown?.[i]?.[j] ?? 0;
    const [x, y] = at(j, this._cfg.axes.length, f * WEB);
    this._tip.style.left = `${fixed(50 + x / 24 * 100)}%`;
    this._tip.style.top = `${fixed(50 + y / 24 * 100)}%`;
  }

  _highlight(index) {
    this._groups?.forEach((g, i) => g.classList.toggle('is-dim', index != null && i !== index && this._cfg.series.length > 1));
  }

  /** One tab stop for all the points: the last focused one, else the first visible. */
  _roving(point) {
    const visible = this._points.filter((_, i) => !this._hidden.has(i)).flat();
    const keep = point || (visible.includes(this._focusPoint) ? this._focusPoint : visible[0]);
    this._focusPoint = keep;
    for (const p of this._points.flat()) p.setAttribute('tabindex', p === keep ? '0' : '-1');
  }

  _select(point) {
    const i = Number(point.dataset.series), j = Number(point.dataset.axis), cfg = this._cfg;
    this.dispatchEvent(new CustomEvent('select', {
      detail: { axis: cfg.axes[j].label, series: cfg.series[i].label, value: cfg.series[i].values[j], axisIndex: j, seriesIndex: i },
      bubbles: true, composed: true
    }));
  }

  _toggle(i) {
    if (this._hidden.has(i)) this._hidden.delete(i);
    else if (this._hidden.size < this._cfg.series.length - 1) this._hidden.add(i);
    else return;
    const hidden = this._hidden.has(i);
    this._groups[i]?.classList.toggle('is-hidden', hidden);
    this._keys[i]?.setAttribute('aria-pressed', String(!hidden));
    if (this._active && Number(this._active.dataset.series) === i) this._activate(null, false);
    this._roving();
    this.dispatchEvent(new CustomEvent('toggle', { detail: { series: this._cfg.series[i].label, seriesIndex: i, hidden }, bubbles: true, composed: true }));
  }

  /** Left/Right walk the axes, Up/Down switch series, Home/End jump, Enter/Space select. */
  _onKey(event) {
    const point = event.target?.closest?.('.ok-rc-point');
    if (!point || !this._cfg) return;
    const n = this._cfg.axes.length;
    const visible = this._cfg.series.map((_, i) => i).filter((i) => !this._hidden.has(i));
    let i = Number(point.dataset.series), j = Number(point.dataset.axis);
    if (event.key === 'ArrowRight') j = (j + 1) % n;
    else if (event.key === 'ArrowLeft') j = (j - 1 + n) % n;
    else if (event.key === 'Home') j = 0;
    else if (event.key === 'End') j = n - 1;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const at = visible.indexOf(i);
      i = visible[(at + (event.key === 'ArrowUp' ? 1 : -1) + visible.length) % visible.length];
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this._select(point); return; }
    else if (event.key === 'Escape') { this._activate(null, false); return; }
    else return;
    event.preventDefault();
    const next = this._points[i]?.[j];
    if (next) { this._roving(next); next.focus(); }
  }

  onDisconnected() { if (this._frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._frame); this._frame = 0; }

  /** Series that the legend has hidden, by index. */
  get hiddenSeries() { return [...this._hidden].sort((a, b) => a - b); }
}

injectStyleOnce('orbit-kit-radar-chart', RADAR_CHART_CSS);
define('o-radar-chart', OrbitRadarChart);
