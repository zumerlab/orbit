/**
 * <o-status>: layered status rings. Each item is a segment colored by its
 * status; items with `children` become an inner ring of groups with their
 * children fanned out around them, like a sunburst.
 *
 *   .orbit-12 > o-arc[value] × leaves        outer ring (the deepest level)
 *   .orbit-10 > o-arc[value] × groups        inner ring, each as wide as its children
 *   .orbit-0  > .satellite.at-center         summary, or the item under the pointer
 *
 * Arcs with a `value` stack around their ring, so every group lines up with
 * its children. Segments are `interactive`, focusable and fire `select`.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, cssValue, escapeHTML as e } from './base.js';

export const STATUSES = ['error', 'warn', 'info', 'ok', 'off'];
const ALIASES = { good: 'ok', up: 'ok', healthy: 'ok', success: 'ok', warning: 'warn', degraded: 'warn', down: 'error', critical: 'error', fail: 'error', failed: 'error', danger: 'error', unknown: 'off', idle: 'off', disabled: 'off', maintenance: 'info' };
const WORDS = { ok: 'OK', warn: 'Warning', error: 'Error', info: 'Info', off: 'Off' };

export function normalizeStatus(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return STATUSES.includes(key) ? key : (ALIASES[key] || 'off');
}

const STATUS_CSS = `
o-status { --ok-font-size: 4.6cqmin; }
o-status .ok-status-seg { --o-color: var(--ok-status-text, #fff); cursor: pointer; outline: none; transition: filter .15s, opacity .15s; }
o-status .ok-status-seg[data-status="ok"]    { --o-fill: var(--ok-status-ok, #16a34a); }
o-status .ok-status-seg[data-status="warn"]  { --o-fill: var(--ok-status-warn, #d97706); }
o-status .ok-status-seg[data-status="error"] { --o-fill: var(--ok-status-error, #dc2626); }
o-status .ok-status-seg[data-status="info"]  { --o-fill: var(--ok-status-info, #2563eb); }
o-status .ok-status-seg[data-status="off"]   { --o-fill: var(--ok-status-off, #475569); }
o-status .ok-status-seg { --o-stroke: var(--o-fill); }
o-status .ok-status-seg:is(:hover, :focus-visible) { filter: brightness(1.25) drop-shadow(0 0 4px var(--o-fill)); }
o-status .ok-status-seg:focus-visible { --o-stroke: var(--ok-focus, #fff); }
o-status .ok-status-seg.is-selected { filter: brightness(1.3); }
o-status .ok-status-spacer { --o-fill: transparent; --o-stroke: transparent; }
o-status[pulse] .ok-status-seg[data-status="error"] { animation: ok-status-pulse 1.6s ease-in-out infinite; }
@keyframes ok-status-pulse { 50% { opacity: .55; } }
o-status .ok-status-hub { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1em; padding: 8%; }
o-status .ok-status-title { font-size: .95em; opacity: .7; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
o-status .ok-status-main { font-size: 1.9em; font-weight: 700; line-height: 1.05; overflow-wrap: anywhere; }
o-status .ok-status-sub { font-size: 1em; font-weight: 700; }
o-status .ok-status-sub[data-status="ok"]    { color: var(--ok-status-ok, #16a34a); }
o-status .ok-status-sub[data-status="warn"]  { color: var(--ok-status-warn, #d97706); }
o-status .ok-status-sub[data-status="error"] { color: var(--ok-status-error, #dc2626); }
o-status .ok-status-sub[data-status="info"]  { color: var(--ok-status-info, #2563eb); }
o-status .ok-status-sub[data-status="off"]   { color: var(--ok-status-off, #94a3b8); }
@media (prefers-reduced-motion: reduce) { o-status[pulse] .ok-status-seg { animation: none; } o-status .ok-status-seg { transition: none; } }
`;

export class OrbitStatus extends OrbitKitElement {
  static get observedAttributes() {
    return ['data', 'size', 'thickness', 'gap', 'range', 'from', 'label', 'labels', 'shape', 'pulse'];
  }

  _norm(items, depth = 0) {
    if (!Array.isArray(items) || depth > 2) return [];
    return items.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map((item, i) => {
      const children = this._norm(item.children, depth + 1);
      const own = item.status == null ? null : normalizeStatus(item.status);
      // A group without its own status shows the worst of its children.
      const worst = children.length ? STATUSES.find((s) => children.some((c) => c.status === s)) : null;
      return {
        label: item.label != null ? String(item.label) : `Item ${i + 1}`,
        status: own ?? worst ?? 'off',
        note: item.note == null ? null : String(item.note),
        color: cssValue(item.color, null),
        value: item.value,
        children,
        leaves: children.length ? children.reduce((n, c) => n + c.leaves, 0) : 1
      };
    });
  }

  readConfig() {
    const items = this._norm(this._json('data', []));
    const depth = (list) => list.reduce((n, item) => Math.max(n, item.children.length ? 1 + depth(item.children) : 1), 0);
    const levels = Math.max(1, depth(items));
    const thickness = this._thickness(levels === 1 ? 2.4 : 2, 4);
    const range = Math.max(0, Math.min(360, this._num('range', 360)));
    return {
      items, levels, thickness, spacing: Math.max(1, Math.ceil(thickness + .15)),
      range, from: this.hasAttribute('from') ? this._num('from', 0) : (range === 360 ? 0 : this._autoFrom(range)),
      gap: this._gap(.8), size: this._size('size', '220px'), label: this.getAttribute('label'),
      labels: this.hasAttribute('labels') && this.getAttribute('labels') !== 'false', shape: this._str('shape', 'none')
    };
  }

  structuralSignature(cfg) { const { label, ...rest } = cfg; return JSON.stringify(rest); }

  build(cfg) {
    injectStyleOnce('orbit-kit-status', STATUS_CSS);
    const total = cfg.items.reduce((n, item) => n + item.leaves, 0) || 1;
    this._levels = [];
    let rings = '';
    // Level d holds the items at depth d; an item that ends early leaves a
    // transparent spacer in the outer rings so everything stays aligned.
    let row = cfg.items.map((item, i) => ({ item, path: [i] }));
    for (let d = 0; d < cfg.levels; d++) {
      const orbit = 12 - (cfg.levels - 1 - d) * cfg.spacing;
      let before = 0;
      const arcs = row.map(({ item, path, spacer }) => {
        const value = fixed(item.leaves / total * 100, 4);
        const phi = ((cfg.from + (before + item.leaves / 2) / total * cfg.range) % 360 + 360) % 360;
        before += item.leaves;
        if (spacer) return `<o-arc class="inner-orbit ok-status-spacer" value="${value}" aria-hidden="true"></o-arc>`;
        const name = `${item.label}: ${WORDS[item.status]}${item.note ? `, ${item.note}` : ''}`;
        const color = item.color ? ` style="--o-fill:${e(item.color)}"` : '';
        return `<o-arc class="inner-orbit ok-status-seg" interactive role="button" tabindex="-1" data-path="${path.join('.')}" data-status="${item.status}" aria-label="${e(name)}" value="${value}" shape="${e(cfg.shape)}"${cfg.labels && phi > 90 && phi < 270 ? ' flip' : ''}${color}>${cfg.labels ? e(item.label) : ''}</o-arc>`;
      }).join('');
      rings += `<div class="orbit-${orbit} ok-status-ring" style="--o-range:${cfg.range}deg;--o-from:${fixed(cfg.from)}deg;--o-size-ratio:${fixed(cfg.thickness)};--o-gap:${fixed(cfg.gap * 6)};font-weight:700">${arcs}</div>`;
      row = row.flatMap(({ item, path, spacer }) => item.children.length && !spacer
        ? item.children.map((child, i) => ({ item: child, path: [...path, i] }))
        : [{ item, path, spacer: true }]);
    }
    const hole = 12 - (cfg.levels - 1) * cfg.spacing - cfg.thickness;
    this.innerHTML = universe(cfg.size, `${rings}
      ${hub(2 * hole - .6, '<span class="ok-status-title" hidden></span><span class="ok-status-main"></span><span class="ok-status-sub"></span>', 'ok-hub ok-status-hub', ' aria-hidden="true"')}`);
    this._segments = [...this.querySelectorAll('.ok-status-seg')];
    this._title = this.querySelector('.ok-status-title');
    this._main = this.querySelector('.ok-status-main');
    this._sub = this.querySelector('.ok-status-sub');
    for (const seg of this._segments) {
      seg.addEventListener('click', () => { seg.focus(); this._select(seg); });
      seg.addEventListener('pointerenter', () => this._show(seg));
      seg.addEventListener('pointerleave', () => this._show(this.contains(this.ownerDocument.activeElement) ? this.ownerDocument.activeElement : null));
      seg.addEventListener('focus', () => { this._roving(seg); this._show(seg); });
      seg.addEventListener('blur', () => this._show(null));
    }
    this._roving(this._segments.find((s) => s.dataset.path === this._focusPath) || this._segments[0]);
    if (!this._keys) {
      this._keys = true;
      this.addEventListener('keydown', (event) => this._onKey(event));
    }
  }

  sync(cfg) {
    this._cfg = cfg;
    const leaves = [];
    const walk = (list) => list.forEach((item) => (item.children.length ? walk(item.children) : leaves.push(item)));
    walk(cfg.items);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, leaves.filter((l) => l.status === s).length]));
    this._counts = counts;
    this._leaves = leaves;
    if (this._title) { this._title.textContent = cfg.label ?? ''; this._title.hidden = !cfg.label; }
    this._show(this.contains?.(this.ownerDocument?.activeElement) ? this.ownerDocument.activeElement : null);
    const parts = STATUSES.filter((s) => counts[s]).map((s) => `${counts[s]} ${WORDS[s].toLowerCase()}`);
    this._describe(`${cfg.label ? `${cfg.label}: ` : ''}${parts.join(', ') || 'no items'}`, 'group');
  }

  /** The hub: the item under the pointer or in focus, else a summary. */
  _show(seg) {
    if (!this._main || !this._cfg) return;
    const item = seg?.dataset?.path ? this._itemAt(seg.dataset.path) : null;
    if (item) {
      this._main.textContent = item.label;
      this._sub.textContent = item.note ? `${WORDS[item.status]} · ${item.note}` : WORDS[item.status];
      this._sub.dataset.status = item.status;
      return;
    }
    const counts = this._counts || {};
    const issues = (counts.error || 0) + (counts.warn || 0);
    const worst = STATUSES.find((s) => s !== 'off' && s !== 'info' && counts[s]) || 'off';
    this._main.textContent = issues ? String(issues) : `${counts.ok || 0}/${this._leaves?.length || 0}`;
    const total = this._leaves?.length || 0;
    this._sub.textContent = issues ? (issues === 1 ? 'issue' : 'issues') : (!total ? 'no items' : counts.ok === total ? 'all OK' : 'OK');
    this._sub.dataset.status = issues ? worst : (counts.ok ? 'ok' : 'off');
  }

  _itemAt(path) {
    let list = this._cfg.items, item;
    for (const index of String(path).split('.').map(Number)) { item = list[index]; if (!item) return null; list = item.children; }
    return item;
  }

  _roving(seg) {
    if (!seg) return;
    this._focusPath = seg.dataset.path;
    for (const other of this._segments || []) other.tabIndex = other === seg ? 0 : -1;
  }

  _select(seg) {
    const item = this._itemAt(seg.dataset.path);
    if (!item) return;
    for (const other of this._segments) other.classList.toggle('is-selected', other === seg);
    const path = seg.dataset.path.split('.').map(Number);
    this.dispatchEvent(new CustomEvent('select', { detail: { label: item.label, status: item.status, note: item.note, value: item.value, item, path }, bubbles: true, composed: true }));
  }

  _onKey(event) {
    const current = event.target?.closest?.('.ok-status-seg');
    if (!current) return;
    const depth = current.dataset.path.split('.').length;
    const same = this._segments.filter((s) => s.dataset.path.split('.').length === depth);
    const i = same.indexOf(current);
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = same[(i + (event.key === 'ArrowRight' ? 1 : -1) + same.length) % same.length];
    else if (event.key === 'Home') next = same[0];
    else if (event.key === 'End') next = same[same.length - 1];
    else if (event.key === 'ArrowUp') next = this._segments.find((s) => s.dataset.path.startsWith(`${current.dataset.path}.`));
    else if (event.key === 'ArrowDown') next = depth > 1 ? this._segments.find((s) => s.dataset.path === current.dataset.path.split('.').slice(0, -1).join('.')) : null;
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this._select(current); return; }
    else return;
    event.preventDefault();
    if (next) { this._roving(next); next.focus(); }
  }
}

define('o-status', OrbitStatus);
