/**
 * <o-sunburst>: a hierarchical chart. `data` is a tree of
 * { label, value?, color?, children? }; every depth is a ring of <o-arc>s with
 * a `value`, so Orbit stacks them in order and each child lands inside its
 * parent. A node's value is its own `value` or the sum of its children (the
 * larger of the two; the difference stays empty in the outer rings).
 *
 *   .orbit-12.ok-sb-ring × depth          one ring per depth; its radius is a
 *     > o-arc.ok-sb-node[value] × nodes   fractional --o-orbit-number, so a zoom
 *     > o-arc.ok-sb-spacer[value]         can move rings in and out
 *   .orbit-0 > .satellite.at-center       hub: path, value and share
 *   ul.ok-sb-tree                         the same tree for assistive tech
 *
 * Hover or focus lights a branch and shows it in the hub. Click (or Enter)
 * zooms into a branch, the hub zooms out. The element is a role="tree" with
 * aria-activedescendant on the visually hidden list: Left/Right move between
 * siblings, Up goes out to the first child, Down back in to the parent.
 * Events: select { value, label, item, path, labels, depth } and
 * navigate { path, depth }; both bubble.
 */
import { OrbitKitElement, define, injectStyleOnce, universe, hub, fixed, finiteNumber, cssValue, formatNumber, escapeHTML as e, withShared, FORMAT_ATTRS } from './base.js';

const PALETTE = ['#4fd1c5', '#ffb547', '#ff7a6b', '#a78bfa', '#60a5fa', '#a3e635', '#f472b6', '#facc15'];
const MAX_DEPTH = 8;
const DURATION = 650;
const SMOOTH_LIMIT = 4000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let uid = 0;

const SUNBURST_CSS = `
o-sunburst { display: inline-block; -webkit-tap-highlight-color: transparent; }
o-sunburst .ok-sb-ring { transition: opacity .2s; }
o-sunburst .ok-sb-ring.is-off { visibility: hidden; }
o-sunburst .ok-sb-node {
  --o-stroke: var(--o-fill); --o-stroke-width: 0;
  color: var(--ok-sunburst-label, #0c0f13); font-size: var(--ok-sunburst-label-size, clamp(10px, 3.3cqmin, 15px)); font-weight: 600;
  transition: opacity .2s, color .25s, filter .2s;
}
o-sunburst .ok-sb-spacer { --o-fill: transparent; --o-stroke: transparent; }
o-sunburst.is-moving .ok-sb-node { color: transparent; transition: none; }
o-sunburst[data-lit] .ok-sb-node:not(.is-lit) { opacity: var(--ok-sunburst-dim, .3); }
o-sunburst .ok-sb-node.is-selected { filter: brightness(1.12); }
o-sunburst:focus-visible, o-sunburst:focus-visible > .bigbang { outline: none; }
o-sunburst:focus-visible .ok-sb-node.is-focus { --o-stroke: var(--ok-focus, #e8edf2); --o-stroke-width: 2; }
o-sunburst .ok-sb-hub {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .15em;
  box-sizing: border-box; width: 100%; aspect-ratio: 1; border-radius: 50%; padding: 12%; font-weight: 400; background: var(--ok-sb-hub-bg, none); transition: background .25s;
}
o-sunburst .ok-sb-hub.is-back { cursor: pointer; }
o-sunburst .ok-sb-hub.is-back:hover { background: color-mix(in srgb, var(--ok-sb-tint, transparent) 26%, transparent); }
o-sunburst:focus-visible .ok-sb-hub.is-focus { outline: 2px solid var(--ok-focus, #e8edf2); outline-offset: -2px; }
o-sunburst .ok-sb-path {
  font-size: max(11px, 12cqmin); color: var(--ok-sunburst-muted, color-mix(in srgb, currentColor 62%, transparent));
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
o-sunburst .ok-sb-value { font-size: var(--ok-sunburst-value-size, 23cqmin); font-weight: 650; letter-spacing: -.02em; line-height: 1.05; white-space: nowrap; }
o-sunburst .ok-sb-share { font-size: max(10px, 10cqmin); line-height: 1.2; color: var(--ok-sunburst-muted, color-mix(in srgb, currentColor 62%, transparent)); max-width: 100%; overflow-wrap: anywhere; }
o-sunburst .ok-sb-tree {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; list-style: none;
}
@media (prefers-reduced-motion: reduce) { o-sunburst .ok-sb-node, o-sunburst .ok-sb-ring { transition: none; } }
`;

/** The tree, normalized: every node knows its value, depth, key, parent and fill. */
export function normalizeTree(raw, { maxDepth = MAX_DEPTH, palette = PALETTE } = {}) {
  const source = Array.isArray(raw) ? { children: raw } : (raw && typeof raw === 'object' ? raw : { children: [] });
  const walk = (item, depth, path, parent) => {
    const node = { item, depth, path, key: path.join('.'), parent, label: '', value: 0, own: null, children: [] };
    const list = Array.isArray(item.children) ? item.children.filter((c) => c && typeof c === 'object' && !Array.isArray(c)) : [];
    // Past the deepest ring a branch counts as one slice, children included.
    const kids = depth > 32 ? [] : list.map((child, i) => walk(child, depth + 1, [...path, i], node));
    const sum = kids.reduce((n, c) => n + c.value, 0);
    const own = item.value == null || item.value === '' ? null : Math.max(0, finiteNumber(item.value, 0));
    node.own = own;
    node.value = Math.max(own ?? 0, sum);
    node.label = item.label != null ? String(item.label) : (depth ? `Item ${path[path.length - 1] + 1}` : '');
    node.children = depth < maxDepth ? kids : [];
    return node;
  };
  const root = walk(source, 0, [], null);
  // Colors: the top level takes the palette, children lighter shades of it.
  const paint = (node, base, steps) => {
    node.children.forEach((child, i) => {
      const own = cssValue(child.item.color, null);
      const n = node.children.length;
      if (own) { child.fill = own; child.base = own; child.steps = 0; }
      else if (!node.depth) { child.base = palette[i % palette.length]; child.fill = child.base; child.steps = 0; }
      else {
        child.base = base; child.steps = steps + 1;
        const share = Math.round(clamp(100 - child.steps * 17 - (n > 1 ? i / (n - 1) * 12 : 0), 30, 100));
        child.fill = `color-mix(in oklab, ${base} ${share}%, var(--ok-sunburst-tint, #fff))`;
      }
      paint(child, child.base, child.steps);
    });
  };
  paint(root, null, 0);
  return root;
}

const descendantOf = (node, root) => { for (let n = node; n; n = n.parent) if (n === root) return true; return false; };

let measureContext;
function textWidth(text, font) {
  if (!measureContext && typeof document !== 'undefined') measureContext = document.createElement('canvas').getContext?.('2d') || null;
  if (!measureContext) return Infinity;
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

export class OrbitSunburst extends OrbitKitElement {
  static get observedAttributes() {
    return withShared(['data', 'size', 'levels', 'hole', 'gap', 'from', 'label', 'labels'], FORMAT_ATTRS);
  }

  constructor() {
    super();
    this._uid = `ok-sb-${++uid}`;
    for (const name of ['_onKey', '_onOver', '_onOut', '_onClick', '_onFocus', '_onBlur']) this[name] = this[name].bind(this);
  }

  readConfig() {
    const root = normalizeTree(this._json('data', []));
    let depth = 0;
    const visit = (node) => { depth = Math.max(depth, node.depth); node.children.forEach(visit); };
    visit(root);
    const levels = clamp(Math.round(this._num('levels', 4)), 1, 6);
    const shown = Math.max(1, Math.min(levels, depth));
    const thickness = Math.min(3.2, 8.4 / shown);
    const hole = this.hasAttribute('hole') ? clamp(this._num('hole', 3.6), 0, 10) : Math.max(3.6, 12 - shown * thickness);
    return {
      root, depth, shown, hole, thickness: (12 - hole) / shown,
      gap: clamp(this._num('gap', 1), 0, 10), from: this._num('from', 0), size: this._size('size', '320px'),
      label: this.getAttribute('label'), labels: this._str('labels', 'true') !== 'false', unit: this._unitText()
    };
  }

  structuralSignature({ root, label, unit, labels, ...rest }) {
    const shape = (node) => [node.key, node.value, node.fill, node.label, node.children.map(shape)];
    return JSON.stringify({ ...rest, tree: shape(root) });
  }

  connectedCallback() {
    // `data` set before the element was defined shadows the setter.
    if (Object.hasOwn(this, 'data')) { const value = this.data; delete this.data; this.data = value; }
    super.connectedCallback();
  }

  /** The data as an object; setting it writes the `data` attribute. */
  get data() { return this._json('data', []); }
  set data(value) { this.setAttribute('data', JSON.stringify(value ?? [])); }

  build(cfg) {
    injectStyleOnce('orbit-kit-sunburst', SUNBURST_CSS);
    this._stopTween();
    const nodes = [];
    const visit = (node) => { nodes.push(node); node.children.forEach(visit); };
    visit(cfg.root);
    this._nodes = new Map(nodes.map((node) => [node.key, node]));
    // Keep the zoom and focus when the same branch still exists.
    this._zoom = this._nodes.get(this._zoom?.key) || cfg.root;
    if (!this._zoom.children.length) this._zoom = this._zoom.parent || cfg.root;
    this._focus = this._nodes.get(this._focus?.key) || null;
    if (this._focus === cfg.root) this._focus = null;
    this._selected = this._nodes.get(this._selected?.key) || null;

    // Ring d holds the nodes at depth d in tree order. A node that ends early
    // (or has room left over) leaves a transparent spacer in the outer rings.
    const emit = (node, d) => {
      if (node.depth === d) return [{ node, amount: node.value }];
      const out = node.children.flatMap((child) => emit(child, d));
      const rest = node.value - node.children.reduce((n, c) => n + c.value, 0);
      if (rest > 1e-9 * node.value) out.push({ owner: node, amount: rest });
      return out;
    };
    let rings = '';
    for (let d = 1; d <= cfg.depth; d++) {
      const arcs = emit(cfg.root, d).map(({ node, owner, amount }) => node
        ? `<o-arc class="inner-orbit ok-sb-node" interactive data-key="${node.key}" value="0" style="--o-fill:${e(node.fill)}"></o-arc>`
        : `<o-arc class="inner-orbit ok-sb-spacer" data-owner="${owner.key}" data-amount="${amount}" value="0"></o-arc>`).join('');
      rings += `<div class="orbit-12 ok-sb-ring is-off" data-depth="${d}" style="--o-orbit-number:12;--o-size-ratio:${fixed(Math.max(.2, cfg.thickness - .14))};--o-gap:${fixed(cfg.gap)};opacity:0">${arcs}</div>`;
    }
    const inner = '<span class="ok-sb-path"></span><strong class="ok-sb-value"></strong><span class="ok-sb-share"></span>';
    this.innerHTML = universe(cfg.size, `${rings}${hub(Math.max(1, 2 * cfg.hole - .5), inner, 'ok-hub ok-sb-hub', ' aria-hidden="true"')}`,
      { spot: `--o-from:${fixed(cfg.from)}deg` }) + `<ul class="ok-sb-tree" role="none">${this._treeMarkup(cfg.root)}</ul>`;
    this._box = this.querySelector('.bigbang');
    this._box.setAttribute('aria-hidden', 'true');
    this._rings = [...this.querySelectorAll('.ok-sb-ring')];
    this._order = new Map(this._rings.map((ring) => [ring, [...ring.children]]));
    this._arcs = [...this.querySelectorAll('.ok-sb-node')].map((el) => ({ el, node: this._nodes.get(el.dataset.key) }));
    this._spacers = [...this.querySelectorAll('.ok-sb-spacer')].map((el) => ({ el, owner: this._nodes.get(el.dataset.owner), amount: Number(el.dataset.amount) }));
    this._hub = this.querySelector('.ok-sb-hub');
    this._hubPath = this.querySelector('.ok-sb-path');
    this._hubValue = this.querySelector('.ok-sb-value');
    this._hubShare = this.querySelector('.ok-sb-share');
    this._items = new Map([...this.querySelectorAll('.ok-sb-tree [role="treeitem"]')].map((li) => [li.dataset.key, li]));
    this._cfg = cfg;
    this._root = cfg.root;
    this._shown = null;
    this._wire();
    this._observeSize();
  }

  _treeMarkup(node) {
    return node.children.map((child, i) => `<li role="treeitem" id="${this._uid}-${child.key}" data-key="${child.key}" aria-level="${child.depth}" aria-setsize="${node.children.length}" aria-posinset="${i + 1}"${child.children.length ? ' aria-expanded="true"' : ''}>${child.children.length ? `<ul role="group">${this._treeMarkup(child)}</ul>` : ''}</li>`).join('');
  }

  sync(cfg) {
    // Same structure: keep the tree that the arcs were built from.
    cfg.root = this._root;
    this._cfg = cfg;
    for (const [key, li] of this._items || []) {
      const node = this._nodes.get(key);
      li.setAttribute('aria-label', this._nodeText(node));
      li.setAttribute('aria-selected', String(node === this._selected));
    }
    for (const { el, node } of this._arcs || []) el.title = this._nodeText(node);
    this._describe(cfg.label ?? (cfg.root.label || 'Sunburst chart'), 'tree');
    this.tabIndex = this._arcs?.length ? 0 : -1;
    if (!this._tween) this._apply(this._layout(this._zoom), true);
    this._showHub();
  }

  /* ---- numbers ----------------------------------------------------------- */

  _valueText(value) {
    const total = this._cfg.root.value;
    return this._formatText(value, { min: 0, max: total, fallback: (v) => formatNumber(v, { locale: this._locale() }) });
  }

  /** Share of `of` (the zoomed branch by default), always as a percent. */
  _shareText(value, of) {
    return formatNumber(of > 0 ? value / of : 0, { format: 'percent', locale: this._locale(), min: 0, max: 1, decimals: this.getAttribute('decimals') ?? undefined });
  }

  _nodeText(node) {
    const parent = node.parent;
    const share = parent ? `, ${this._shareText(node.value, parent.value)} of ${parent.depth ? parent.label : (this._cfg.label ?? (parent.label || 'the total'))}` : '';
    return `${node.label}: ${this._valueText(node.value)}${share}`;
  }

  /* ---- layout and zoom --------------------------------------------------- */

  /** Where everything sits when `root` is in the middle: arc shares and ring radii. */
  _layout(root) {
    const cfg = this._cfg, total = root.value;
    const shares = new Map();
    for (const { el, node } of this._arcs) {
      shares.set(el, descendantOf(node, root) ? (total > 0 ? node.value / total : 0) : (descendantOf(root, node) ? 1 : 0));
    }
    for (const { el, owner, amount } of this._spacers) shares.set(el, descendantOf(owner, root) && total > 0 ? amount / total : 0);
    const rings = this._rings.map((ring) => {
      const rel = Number(ring.dataset.depth) - root.depth;
      const visible = rel >= 1 && rel <= cfg.shown;
      // Rings inside the window step out from the hub; the others fold into
      // the hub or wait at the edge, faded out.
      const outer = rel < 1 ? cfg.hole : rel > cfg.shown ? 12 : cfg.hole + rel * cfg.thickness;
      return { ring, outer, opacity: visible ? 1 : 0, visible };
    });
    return { root, shares, rings, ringOf: new Map(rings.map((r) => [r.ring, r])) };
  }

  /**
   * Only arcs with a share stay in their ring: Orbit stacks every sibling, so
   * slices outside the zoomed branch would cost layout time and draw nothing.
   * During a transition the arcs of both ends stay. Returns the work left:
   * stacking is quadratic in the arcs of a ring.
   */
  _keep(...states) {
    let cost = 0;
    for (const [ring, all] of this._order) {
      const list = all.filter((el) => states.some((s) => s.shares.get(el) > 1e-6 && s.ringOf.get(ring).opacity > 0));
      cost += list.length ** 2;
      const current = ring.children;
      if (list.length !== current.length || list.some((el, i) => current[i] !== el)) ring.replaceChildren(...list);
    }
    return cost;
  }

  _apply(state, final = false) {
    if (final) this._keep(state);
    for (const [el, share] of state.shares) {
      const value = fixed(clamp(share * 100, 0, 100), 3);
      if (el.getAttribute('value') !== value) el.setAttribute('value', value);
    }
    for (const { ring, outer, opacity, visible } of state.rings) {
      ring.style.setProperty('--o-orbit-number', fixed(Math.max(.01, outer), 4));
      ring.style.opacity = fixed(opacity, 3);
      if (final) ring.classList.toggle('is-off', !visible);
      else if (opacity > 0) ring.classList.remove('is-off');
    }
    this._shown = state;
    if (final) {
      this._labelArcs();
      this._paintHub();
    }
  }

  _mix(a, b, t) {
    const shares = new Map();
    for (const [el, to] of b.shares) shares.set(el, (a.shares.get(el) ?? 0) + (to - (a.shares.get(el) ?? 0)) * t);
    const rings = b.rings.map((r, i) => ({
      ring: r.ring, visible: r.visible,
      outer: a.rings[i].outer + (r.outer - a.rings[i].outer) * t,
      opacity: a.rings[i].opacity + (r.opacity - a.rings[i].opacity) * t
    }));
    return { root: b.root, shares, rings, ringOf: new Map(rings.map((r) => [r.ring, r])) };
  }

  _stopTween() {
    if (this._tween && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._tween);
    this._tween = 0;
    this.classList?.remove('is-moving');
  }

  /** Zoom so that `node` is in the middle, with a transition unless motion is reduced. */
  _zoomTo(node, { focus } = {}) {
    if (!node || !this._cfg) return;
    if (!node.children.length) node = node.parent || this._cfg.root;
    const from = this._shown || this._layout(this._zoom);
    const changed = node !== this._zoom;
    this._zoom = node;
    if (focus !== undefined) this._setFocus(focus);
    this._lit(null);
    const target = this._layout(node);
    this._stopTween();
    this._paintHub();
    const still = typeof matchMedia === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof requestAnimationFrame === 'undefined';
    // Big trees swap with a short fade: a frame-by-frame zoom would stutter.
    const heavy = !still && changed && this._keep(from, target) > SMOOTH_LIMIT;
    if (still || !changed || heavy) {
      this._apply(target, true);
      if (heavy && this._box?.animate) this._box.animate([{ opacity: .35, scale: .94 }, { opacity: 1, scale: 1 }], { duration: 320, easing: 'ease-out' });
    } else {
      this.classList.add('is-moving');
      for (const { el } of this._arcs) if (el.textContent) el.textContent = '';
      const start = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        if (t < 1) { this._apply(this._mix(from, target, ease(t))); this._tween = requestAnimationFrame(frame); }
        else { this._tween = 0; this.classList.remove('is-moving'); this._apply(target, true); }
      };
      this._tween = requestAnimationFrame(frame);
    }
    this._showHub();
    if (changed) this.dispatchEvent(new CustomEvent('navigate', { detail: { path: this.path, depth: node.depth }, bubbles: true, composed: true }));
  }

  /** Labels run along the arcs that have room for them, upright on the lower half. */
  _labelArcs() {
    const cfg = this._cfg, state = this._shown;
    if (!state || !this._arcs.length) return;
    const width = this._box?.clientWidth || 0;
    const style = width && typeof getComputedStyle !== 'undefined' ? getComputedStyle(this._arcs[0].el) : null;
    const px = style ? parseFloat(style.fontSize) || 12 : 12;
    const font = style ? `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}` : '';
    const lane = width / 24;
    for (const ring of state.rings) {
      let before = 0;
      for (const el of ring.ring.children) {
        const share = state.shares.get(el) || 0;
        const node = el.classList.contains('ok-sb-node') ? this._nodes.get(el.dataset.key) : null;
        if (node) {
          let text = '';
          if (cfg.labels && width && ring.visible && share > 0) {
            const radius = (ring.outer - cfg.thickness / 2) * lane;
            const room = radius * (share * 360 - cfg.gap) * Math.PI / 180;
            if (cfg.thickness * lane >= px * 1.35 && textWidth(node.label, font) + px * .8 <= room * .96) text = node.label;
          }
          // Text on the lower half runs the other way, so it reads upright.
          const middle = ((cfg.from + (before + share / 2) * 360) % 360 + 360) % 360;
          el.toggleAttribute('flip', !!text && middle > 90 && middle < 270);
          if (el.textContent !== text) el.textContent = text;
        }
        before += share;
      }
    }
  }

  _observeSize() {
    if (this._resize || typeof ResizeObserver === 'undefined') { this._resize?.disconnect(); this._resize?.observe(this._box); return; }
    let width = 0;
    this._resize = new ResizeObserver(() => {
      const now = this._box?.clientWidth || 0;
      if (now !== width && !this._tween) { width = now; this._labelArcs(); }
    });
    this._resize.observe(this._box);
  }

  /* ---- hub, highlight, focus --------------------------------------------- */

  _paintHub() {
    if (!this._hub) return;
    const root = this._zoom, zoomed = root !== this._cfg.root;
    this._hub.classList.toggle('is-back', zoomed);
    this._hub.style.setProperty('--ok-sb-tint', zoomed ? root.fill : 'transparent');
    this._hub.style.setProperty('--ok-sb-hub-bg', zoomed ? `color-mix(in srgb, ${root.fill} 16%, transparent)` : 'none');
  }

  /** The hub: the node under the pointer or in focus, else the branch in the middle. */
  _showHub(node = this._hover || (this._focusShown() ? this._focus : null)) {
    if (!this._hubValue || !this._cfg) return;
    const root = this._zoom, cfg = this._cfg;
    const rootName = root.depth ? root.label : (cfg.label ?? (cfg.root.label || 'Total'));
    if (node && node !== root) {
      const trail = [];
      for (let n = node; n && n !== root; n = n.parent) trail.unshift(n.label);
      this._hubPath.textContent = trail.length > 2 ? `… › ${trail.slice(-2).join(' › ')}` : trail.join(' › ');
      this._hubValue.textContent = this._valueText(node.value);
      this._hubShare.textContent = `${this._shareText(node.value, root.value)} of ${rootName}`;
    } else {
      this._hubPath.textContent = root.depth ? `‹ ${rootName}` : rootName;
      this._hubValue.textContent = this._valueText(root.value);
      this._hubShare.textContent = root.depth ? `${this._shareText(root.value, cfg.root.value)} of ${cfg.label ?? (cfg.root.label || 'the total')}` : '';
    }
    this._hubShare.hidden = !this._hubShare.textContent;
    this._hub?.classList.toggle('is-focus', this._focus === root && root.depth > 0);
  }

  /** Light a branch: the node, its parents and everything under it. */
  _lit(node) {
    this._hover = node;
    if (!this._arcs) return;
    if (!node) delete this.dataset.lit;
    else this.dataset.lit = node.key;
    for (const { el, node: other } of this._arcs) el.classList.toggle('is-lit', !!node && (descendantOf(other, node) || descendantOf(node, other)));
    this._showHub();
  }

  _setFocus(node) {
    this._focus = node || null;
    for (const { el, node: other } of this._arcs || []) el.classList.toggle('is-focus', other === this._focus);
    const li = this._focus && this._items.get(this._focus.key);
    if (li) this.setAttribute('aria-activedescendant', li.id);
    else this.removeAttribute('aria-activedescendant');
    if (this._focusShown()) this._lit(this._focus === this._zoom ? null : this._focus);
    this._showHub();
  }

  /** Keyboard focus shows in the chart; a click that focuses the element does not. */
  _focusShown() {
    try { return !!this.matches?.(':focus-visible'); } catch { return !!this.matches?.(':focus'); }
  }

  _wire() {
    if (this._wired) return;
    this._wired = true;
    this.addEventListener('keydown', this._onKey);
    this.addEventListener('pointerover', this._onOver);
    this.addEventListener('pointerout', this._onOut);
    this.addEventListener('click', this._onClick);
    this.addEventListener('focus', this._onFocus);
    this.addEventListener('blur', this._onBlur);
  }

  onDisconnected() {
    this._stopTween();
    this._resize?.disconnect();
    this._resize = null;
  }

  onConnected() { if (this._box && this._resize === null) this._observeSize(); }

  _nodeAt(event) {
    const arc = event.target?.closest?.('.ok-sb-node');
    return arc && !this._tween ? this._nodes.get(arc.dataset.key) : null;
  }

  _onOver(event) {
    const node = this._nodeAt(event);
    if (node && node !== this._hover) this._lit(node);
  }

  _onOut(event) {
    if (!this._hover || this._nodeAt({ target: event.relatedTarget })) return;
    this._lit(this._focusShown() && this._focus !== this._zoom ? this._focus : null);
  }

  _onClick(event) {
    if (event.target?.closest?.('.ok-sb-hub')) {
      if (this._zoom.parent) this._zoomTo(this._zoom.parent, { focus: this._zoom });
      return;
    }
    const node = this._nodeAt(event);
    if (!node) return;
    this._focus = node;
    this._choose(node);
  }

  _onFocus() {
    if (!this._focus || !this._isVisible(this._focus)) this._setFocus(this._zoom.children[0] || null);
    else this._setFocus(this._focus);
  }

  _onBlur() { this._lit(null); }

  _isVisible(node) {
    const rel = node.depth - this._zoom.depth;
    return node === this._zoom ? node.depth > 0 : descendantOf(node, this._zoom) && rel <= this._cfg.shown;
  }

  /** Select a node and zoom into it when it is a branch. */
  _choose(node) {
    this._selected = node;
    for (const [key, li] of this._items) li.setAttribute('aria-selected', String(key === node.key));
    for (const { el, node: other } of this._arcs) el.classList.toggle('is-selected', other === node);
    const labels = [];
    for (let n = node; n?.depth; n = n.parent) labels.unshift(n.label);
    const detail = { value: node.value, label: node.label, item: node.item, path: [...node.path], labels, depth: node.depth };
    this.dispatchEvent(new CustomEvent('select', { detail, bubbles: true, composed: true }));
    if (node.children.length && node !== this._zoom) this._zoomTo(node, { focus: node.children[0] });
    else this._setFocus(node);
  }

  _onKey(event) {
    const node = this._focus || this._zoom.children[0];
    if (!node || !this._cfg) return;
    const siblings = node === this._zoom ? [node] : node.parent.children;
    const i = siblings.indexOf(node);
    let next = null;
    switch (event.key) {
      case 'ArrowRight': next = siblings[(i + 1) % siblings.length]; break;
      case 'ArrowLeft': next = siblings[(i - 1 + siblings.length) % siblings.length]; break;
      case 'Home': next = siblings[0]; break;
      case 'End': next = siblings[siblings.length - 1]; break;
      case 'ArrowUp':
        if (!node.children.length) break;
        // Out of the window: zoom in so the children show.
        if (node !== this._zoom && node.depth - this._zoom.depth >= this._cfg.shown) { event.preventDefault(); this._zoomTo(node, { focus: node.children[0] }); return; }
        next = node.children[0];
        break;
      case 'ArrowDown':
        if (node === this._zoom || !node.parent?.depth) break;
        next = node.parent;
        break;
      case 'Enter': case ' ':
        event.preventDefault();
        if (node === this._zoom) this._zoomTo(node.parent, { focus: node });
        else this._choose(node);
        return;
      case 'Escape': case 'Backspace':
        if (!this._zoom.parent) return;
        event.preventDefault();
        this._zoomTo(this._zoom.parent, { focus: this._zoom });
        return;
      default: return;
    }
    event.preventDefault();
    if (next) this._setFocus(next);
  }

  /* ---- API ---------------------------------------------------------------- */

  /** Index path of the branch in the middle ([] at the top). */
  get path() { return [...(this._zoom?.path || [])]; }

  /** Zoom into the branch at an index path, e.g. [0, 2]. */
  zoom(path = []) {
    if (!this._cfg) return;
    const key = Array.isArray(path) ? path.join('.') : String(path);
    this._zoomTo(key ? this._nodes.get(key) : this._cfg.root);
  }

  zoomOut() { if (this._zoom?.parent) this._zoomTo(this._zoom.parent); }
  reset() { if (this._cfg) this._zoomTo(this._cfg.root); }
}

define('o-sunburst', OrbitSunburst);
