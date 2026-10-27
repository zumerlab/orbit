/**
 * <o-menu>: a radial menu with drill-down or concentric branches.
 * Items have a label, an optional emoji or sanitized inline SVG icon, a value
 * and children. Events: select { value, label, item, path } and
 * navigate { path, depth }; both bubble. Picking an item also fires `input`
 * and `change`, like a <select>. It is a form control (FormControl): with a
 * `name` it submits the picked value; `value` picks one from markup.
 *
 * Sectors are `interactive` <o-arc>s with the label drawn along the arc. The
 * outer ring touches the edge of the universe; in concentric mode the open
 * levels stack inward from it.
 */
import { OrbitKitElement, FormControl, define, injectStyleOnce, escapeHTML, safeIcon, cssValue, fixed, withShared, FORM_ATTRS } from './base.js';

const MENU_CSS = `
o-menu { --ok-font-size: 5cqmin; }
o-menu o-arc.o-menu-item { cursor: pointer; outline: none; transition: filter .18s ease; --o-color: var(--ok-menu-text, #f8fafc); }
o-menu o-arc.o-menu-item:hover { filter: brightness(1.25); }
o-menu o-arc.o-menu-item:is(.is-active,.is-selected) { filter: brightness(1.4) drop-shadow(0 0 6px currentColor); }
o-menu o-arc.o-menu-item:focus-visible { filter: brightness(1.5) drop-shadow(0 0 4px var(--ok-menu-accent, var(--ok-accent, #3da9fc))); }
o-menu .o-menu-icon { pointer-events: none; }
o-menu .o-menu-icon .capsule { display: flex; align-items: center; justify-content: center; font-size: 1.3em; }
o-menu .o-menu-icon svg { width: 1.2em; height: 1.2em; }
o-menu .ok-menu-ring { animation: ok-menu-in .22s cubic-bezier(.2,.7,.3,1); }
@keyframes ok-menu-in { from { opacity: .25; scale: .92; } to { opacity: 1; scale: 1; } }
o-menu .o-menu-hub {
  -webkit-backdrop-filter: var(--ok-backdrop, none); backdrop-filter: var(--ok-backdrop, none);
  border-radius: 50%; aspect-ratio: 1; background: var(--ok-menu-hub, var(--o-menu-hub, var(--ok-surface, rgba(20,22,30,.92))));
  color: var(--ok-menu-text, #f8fafc);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); padding: 12%;
  font-weight: 700; text-align: center; line-height: 1.12; overflow-wrap: anywhere;
  display: flex; align-items: center; justify-content: center;
  transition: color .18s ease, background .18s ease;
}
o-menu .o-menu-hub.is-back { cursor: pointer; }
o-menu .o-menu-hub.is-back:hover { background: var(--ok-menu-hub-hover, var(--o-menu-hub-hover, rgba(36,40,54,.96))); }
o-menu .o-menu-hub:focus-visible { outline: 2px solid var(--ok-menu-accent, var(--ok-accent, #3da9fc)); outline-offset: 2px; }
o-menu.o-menu--mono o-arc.o-menu-item { --o-fill: var(--ok-menu-slate, #2b333f); --o-stroke: var(--o-fill); }
o-menu.o-menu--mono o-arc.o-menu-item:is(:hover,:focus-visible,.is-active,.is-selected) { --o-fill: var(--ok-menu-accent, var(--ok-accent, #3da9fc)); filter: none; }
o-menu[data-disabled] > .bigbang { opacity: .5; }
o-menu[data-disabled] :is(o-arc.o-menu-item, .o-menu-hub) { cursor: default; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { o-menu .ok-menu-ring { animation: none; } o-menu o-arc.o-menu-item { transition: none; } }
`;
const PALETTE = ['#6b72c9', '#3ea58f', '#cf9a52', '#cf6b6b', '#5e9fd0', '#9b80c9', '#c77ba2', '#85ab5c'];
const equalPath = (a, b) => !!a && !!b && a.length === b.length && a.every((value, i) => value === b[i]);
const sameValue = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b) || (typeof b === 'string' && (String(a) === b || JSON.stringify(a) === b));

export class OrbitMenu extends FormControl(OrbitKitElement) {
  static get observedAttributes() {
    return withShared(['items', 'size', 'orbit', 'thickness', 'range', 'from', 'gap', 'label', 'label-color', 'expand', 'theme', 'palette', 'accent', 'value'], FORM_ATTRS);
  }

  _norm(items, depth = 0) {
    if (!Array.isArray(items) || depth > 32) return [];
    return items.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map((item, i) => ({
      label: item.label != null ? String(item.label) : `Item ${i + 1}`,
      value: item.value !== undefined ? item.value : (item.label ?? i),
      color: cssValue(item.color, null),
      icon: item.icon == null ? null : String(item.icon),
      children: Array.isArray(item.children) ? this._norm(item.children, depth + 1) : null
    }));
  }

  readConfig() {
    const range = Math.min(360, Math.max(0, this._num('range', 360)));
    return {
      items: this._norm(this._json('items', [])), range,
      from: this.hasAttribute('from') ? this._num('from', 0) : (range === 360 ? 0 : this._autoFrom(range)),
      thickness: this._thickness(3.6, 6),
      size: this._size('size', '280px'), gap: this._gap(1.2),
      labelColor: this._color('label-color', null),
      // Sector colors: palette="color" (1.0: theme="color"); theme also takes dark, light, glass.
      theme: (this.getAttribute('palette') ?? (this._str('theme', '').split(/\s+/).includes('color') ? 'color' : 'mono')) === 'color' ? 'color' : 'mono',
      disabled: this._isDisabled(),
      accent: this._color('accent', null),
      expand: this._str('expand', 'drill') === 'concentric' ? 'concentric' : 'drill',
      label: this._str('label', 'MENU')
    };
  }

  structuralSignature(cfg) { return JSON.stringify(cfg); }

  /** The `value` attribute picks an item; it is also what a form reset returns to. */
  sync() {
    const attr = this.getAttribute('value');
    if (attr === this._valueAttr) return;
    this._valueAttr = attr;
    if (attr == null) this._clearSelection();
    else this._selectValue(attr);
  }

  _findValue(value, items = this._cfg?.items || [], path = []) {
    for (const [index, item] of items.entries()) {
      if (item.children?.length) {
        const found = this._findValue(value, item.children, [...path, index]);
        if (found) return found;
      } else if (sameValue(item.value, value)) return { item, path: [...path, index] };
    }
    return null;
  }

  _selectValue(value) {
    const found = this._findValue(value);
    if (!found) { this._clearSelection(); return; }
    this._value = found.item.value;
    this._selectedLabel = found.item.label;
    this._selectedPath = found.path;
    if (this._cfg) this.build(this._cfg);
  }

  _clearSelection() {
    const had = this._selectedPath != null;
    this._selectedPath = null;
    this._value = undefined;
    this._selectedLabel = undefined;
    if (had && this._cfg) this.build(this._cfg);
  }

  _onFormReset() { this._valueAttr = undefined; }
  _formValidity() {
    return this.required && this._value === undefined ? { flags: { valueMissing: true }, message: 'Select an item.' } : {};
  }
  _formAnchor() { return this._arcs?.[0]; }

  build(cfg) {
    injectStyleOnce('orbit-kit-menu', MENU_CSS);
    const active = this.ownerDocument?.activeElement;
    const restoreFocus = active === this || (active && this.contains?.(active));
    const focusKey = this._nextFocus || this._focusKey;
    this._nextFocus = null;
    this._cfg = cfg;
    this._path ||= [];
    this._validateSelection();
    this.classList.toggle('o-menu--mono', cfg.theme === 'mono');
    this._applyTheme({ '--ok-menu-accent': cfg.accent, '--ok-menu-text': cfg.labelColor });
    this.setAttribute('role', 'menu');
    if (!this.hasAttribute('aria-labelledby') && (!this.hasAttribute('aria-label') || this.getAttribute('aria-label') === this._autoLabel)) {
      this._autoLabel = cfg.label || 'Radial menu';
      this.setAttribute('aria-label', this._autoLabel);
    }
    if (cfg.expand === 'concentric') this._buildConcentric(cfg);
    else this._buildDrill(cfg);
    this._wireKeys();
    this._options = [...this._arcs, ...(this._path.length && this._hub ? [this._hub] : [])];
    const target = cfg.disabled ? null : this._options.find(option => this._keyFor(option) === focusKey) || this._options[0];
    this.tabIndex = target || cfg.disabled ? -1 : 0;
    if (cfg.disabled) for (const option of this._options) option.tabIndex = -1;
    this._setFocus(target, restoreFocus);
    this._setHub();
    const pathKey = JSON.stringify(this._path);
    const pathChanged = this._announcedPath !== undefined && this._announcedPath !== pathKey;
    this._announcedPath = pathKey;
    if (pathChanged) {
      this.dispatchEvent(new CustomEvent('navigate', { detail: { path: this.path, depth: this._path.length }, bubbles: true, composed: true }));
    }
  }

  _validateSelection() {
    if (!this._selectedPath) return;
    let items = this._cfg.items, item;
    for (const index of this._selectedPath) {
      item = items[index];
      if (!item) break;
      items = item.children || [];
    }
    if (!item || item.children?.length || JSON.stringify(item.value) !== JSON.stringify(this._value)) {
      this._selectedPath = null;
      this._value = undefined;
      this._selectedLabel = undefined;
    } else this._selectedLabel = item.label;
  }

  _ring(items, from, range, orbit, thickness, level, openIndex, cfg) {
    const e = escapeHTML, slice = range / (items.length || 1);
    const arcs = items.map((item, index) => {
      const color = item.color || PALETTE[index % PALETTE.length];
      const branch = !!item.children?.length;
      const selected = !branch && equalPath(this._selectedPath, [...this._path.slice(0, level), index]);
      const text = item.icon ? '' : item.label + (branch ? ' ›' : '');
      const cls = `inner-orbit o-menu-item${branch ? ' is-branch' : ''}${openIndex === index ? ' is-active' : ''}${selected ? ' is-selected' : ''}`;
      const style = cfg.theme === 'mono' ? '' : `--o-fill:${color};--o-stroke:${color};`;
      const phi = ((from + (index + .5) * slice) % 360 + 360) % 360;
      return `<o-arc class="${cls}" data-level="${level}" data-index="${index}" role="menuitem" interactive tabindex="-1"${cfg.disabled ? ' aria-disabled="true"' : ''} aria-label="${e(item.label)}"${branch ? ` aria-haspopup="menu" aria-expanded="${openIndex === index}"` : ''}${selected ? ' aria-current="true"' : ''} shape="rounded"${phi > 90 && phi < 270 ? ' flip' : ''}${style ? ` style="${e(style)}"` : ''}>${e(text)}</o-arc>`;
    }).join('');
    // Icons ride the middle of their sector: a satellite pointed at the sector
    // center and moved in by half the band (inner-orbit); its capsule stays upright.
    const icons = items.map((item, index) => item.icon
      ? `<div class="satellite inner-orbit o-menu-icon" aria-hidden="true" style="--o-angle-composite:${fixed((index + .5) * slice - 90, 2)}deg"><div class="capsule">${safeIcon(item.icon)}</div></div>` : '').join('');
    const ring = `--o-range:${fixed(range)}deg;--o-from:${fixed(from)}deg;--o-size-ratio:${fixed(thickness)};--o-gap:${fixed(cfg.gap * 6)};font-weight:700`;
    return `<div class="orbit-${orbit} ok-menu-ring" style="${ring}">${arcs}</div>` +
      (icons ? `<div class="orbit-${orbit}" style="--o-from:${fixed(from)}deg;--o-size-ratio:${fixed(thickness)}">${icons}</div>` : '');
  }

  _markup(rings, hubText, hubLanes) {
    const cfg = this._cfg, open = this._path.length > 0;
    const hubLabel = cfg.expand === 'concentric' ? 'Reset menu' : 'Back to previous menu';
    return `<div class="bigbang" style="width:${escapeHTML(cfg.size)}">
      <div class="gravity-spot">
        ${rings}<div class="orbit-0" style="--o-size-ratio:${fixed(hubLanes)}"><div class="satellite at-center"><div class="capsule o-menu-hub${open ? ' is-back' : ''}"${open ? ` role="menuitem" tabindex="-1" aria-label="${hubLabel}"` : ' aria-hidden="true"'}>${escapeHTML(hubText)}</div></div></div>
      </div></div>`;
  }

  _buildConcentric(cfg) {
    // Resolve the open path first, so the layout knows how many levels show.
    let items = cfg.items;
    for (let depth = 0; depth < this._path.length; depth++) {
      const branch = items[this._path[depth]];
      if (!branch?.children?.length) { this._path = this._path.slice(0, depth); break; }
      items = branch.children;
    }
    const levels = this._path.length + 1;
    // One level uses the whole band; open levels stack inward from the edge.
    const spacing = levels === 1 ? cfg.thickness : Math.max(2, Math.min(3, Math.floor(9 / levels)));
    const thickness = levels === 1 ? cfg.thickness : spacing * .94;
    let rings = '', from = cfg.from, range = cfg.range;
    items = cfg.items;
    for (let depth = 0; depth < levels; depth++) {
      const openIndex = this._path[depth];
      const orbit = 12 - Math.round((levels - 1 - depth) * spacing);
      rings += this._ring(items, from, range, orbit, thickness, depth, openIndex, cfg);
      if (openIndex == null) break;
      const slice = range / items.length;
      from += openIndex * slice;
      range = slice;
      items = items[openIndex].children;
    }
    const hole = 12 - (levels === 1 ? cfg.thickness : Math.round((levels - 1) * spacing) + thickness);
    this.innerHTML = this._markup(rings, cfg.label, Math.max(3, 2 * hole * .8));
    this._bindArcs();
  }

  _buildDrill(cfg) {
    const { level, trail } = this._resolveLevel(cfg.items);
    const hubText = this._path.length ? `‹ ${trail[trail.length - 1].label}` : cfg.label;
    this.innerHTML = this._markup(this._ring(level, cfg.from, cfg.range, 12, cfg.thickness, this._path.length, null, cfg), hubText, 2 * (12 - cfg.thickness) * .8);
    this._bindArcs();
  }

  _bindArcs() {
    this._hub = this.querySelector('.o-menu-hub');
    this._arcs = [...this.querySelectorAll('.o-menu-item')];
    for (const arc of this._arcs) {
      const level = Number(arc.dataset.level), index = Number(arc.dataset.index);
      arc.addEventListener('click', () => { arc.focus(); this._activateAt(level, index); });
      arc.addEventListener('focus', () => { this._setFocus(arc); this._setHub(this._itemsAtLevel(level)[index]?.label); });
      arc.addEventListener('blur', () => this._setHub());
      arc.addEventListener('pointerenter', () => this._setHub(this._itemsAtLevel(level)[index]?.label));
      arc.addEventListener('pointerleave', () => this._setHub());
    }
    if (this._hub && this._path.length) {
      this._hub.addEventListener('focus', () => this._setFocus(this._hub));
      this._hub.addEventListener('click', () => { this._hub.focus(); this._cfg.expand === 'concentric' ? this.reset() : this.back(); });
    }
  }

  _keyFor(option) { return option === this._hub ? 'hub' : `${option?.dataset.level}:${option?.dataset.index}`; }
  _setFocus(option, move = false) {
    if (!option) return;
    this._focusKey = this._keyFor(option);
    for (const candidate of this._options || []) candidate.tabIndex = candidate === option ? 0 : -1;
    if (move) option.focus();
  }

  _wireKeys() {
    if (this._keyBound) return;
    this._keyBound = true;
    this.addEventListener('keydown', event => {
      if (this._isDisabled()) return;
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      const options = this._options || [];
      const index = Math.max(0, options.indexOf(this.ownerDocument?.activeElement));
      if ((Object.hasOwn(keys, event.key) || event.key === 'Home' || event.key === 'End') && options.length) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + keys[event.key] + options.length) % options.length;
        this._setFocus(options[next], true);
      } else if ((event.key === 'Enter' || event.key === ' ') && options.length) {
        event.preventDefault();
        options[index].click();
      } else if ((event.key === 'Escape' || event.key === 'Backspace') && this._path.length) {
        event.preventDefault();
        this.back();
      }
    });
  }

  _itemsAtLevel(level) {
    let items = this._cfg.items;
    for (let depth = 0; depth < level; depth++) {
      const node = items[this._path[depth]];
      if (!node?.children) return [];
      items = node.children;
    }
    return items;
  }

  _resolveLevel(root) {
    let level = root;
    const trail = [];
    for (const index of this._path) {
      const node = level[index];
      if (!node?.children?.length) { this._path = []; return { level: root, trail: [] }; }
      trail.push(node);
      level = node.children;
    }
    return { level, trail };
  }

  _setHub(text) {
    if (!this._hub) return;
    const nextText = text ?? (this._path.length && this._cfg.expand === 'drill'
      ? `‹ ${this._itemsAtLevel(this._path.length - 1)[this._path[this._path.length - 1]]?.label ?? this._cfg.label}`
      : (this._selectedLabel ?? this._cfg.label));
    // Keep the hit-tested text node stable through hover and focus transitions.
    if (this._hub.textContent !== nextText) this._hub.textContent = nextText;
  }

  _activateAt(level, index) {
    const item = this._itemsAtLevel(level)[index];
    if (!item || this._isDisabled()) return;
    if (item.children?.length) {
      const collapse = this._cfg.expand === 'concentric' && this._path[level] === index;
      this._path = collapse ? this._path.slice(0, level) : [...this._path.slice(0, level), index];
      this._nextFocus = collapse ? `${level}:${index}` : `${level + 1}:0`;
      this.build(this._cfg);
    } else {
      this._value = item.value;
      this._selectedLabel = item.label;
      this._path = this._path.slice(0, level);
      this._selectedPath = [...this._path, index];
      this._nextFocus = `${level}:${index}`;
      this.build(this._cfg);
      this._updateForm();
      const detail = { value: item.value, label: item.label, item, path: [...this._selectedPath] };
      this.dispatchEvent(new CustomEvent('select', { detail, bubbles: true, composed: true }));
      for (const type of ['input', 'change']) this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
    }
  }

  get path() { return [...(this._path || [])]; }
  get value() { return this._value; }
  /** Pick the item with this value (or clear with null) without firing events. */
  set value(value) {
    if (value == null || value === '') this._clearSelection();
    else this._selectValue(value);
    this._updateForm();
  }
  get selectedIndex() {
    const path = this._path || [];
    return this._selectedPath?.length === path.length + 1 && equalPath(this._selectedPath.slice(0, -1), path)
      ? this._selectedPath[this._selectedPath.length - 1] : -1;
  }
  back() {
    if (!this._path?.length) return;
    this._nextFocus = `${this._path.length - 1}:${this._path[this._path.length - 1]}`;
    this._path = this._path.slice(0, -1);
    this.build(this._cfg);
  }
  reset() {
    if (!this._path?.length) return;
    this._nextFocus = `0:${this._path[0]}`;
    this._path = [];
    this.build(this._cfg);
  }
  _activate(index) { this._activateAt(this._path?.length || 0, index); }
  _select(index) { this._activate(index); }
}

define('o-menu', OrbitMenu);
