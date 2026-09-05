// CSS owns presentation; this scheduler owns discovery, ordering and invalidation.
// One observer per document batches related changes into one animation frame.
// Shared across repeated classic-script loads and ESM/classic entrypoints.
const STATE = Symbol.for('zumer.orbit.layout.state.v1');
const REGISTRY = Symbol.for('zumer.orbit.layout.registry.v1');
const PROBE = Symbol.for('zumer.orbit.layout.probe.v1');
const VISUALS = 'o-arc, o-progress';
const OBSERVE = { subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true };

export function orbitNumber(element) {
  for (const token of element.classList || []) {
    if (/^orbit-\d+$/.test(token)) return Number(token.slice(6));
  }
  return element.classList?.contains('orbit') ? null : undefined;
}

export function setLayoutProperty(element, name, value) {
  const text = String(value);
  if (element.style.getPropertyValue(name) !== text) element.style.setProperty(name, text);
}

/** Resolve calc()/angle units through the browser, without evaluating CSS as JS. */
export function cssNumber(element, value, fallback = 0, type = 'number') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  if (type === 'number' && /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(raw)) return Number(raw);
  const angle = raw.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(deg|rad|grad|turn)?$/);
  if (type === 'angle' && angle) {
    return Number(angle[1]) * ({ deg: 1, rad: 180 / Math.PI, grad: .9, turn: 360 }[angle[2]] || 1);
  }
  const doc = element.ownerDocument;
  if (!doc?.documentElement) return fallback;
  let probe = doc[PROBE];
  if (!probe) {
    probe = doc.createElement('span');
    probe.setAttribute('data-orbit-measure', '');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'all:initial!important;position:fixed!important;visibility:hidden!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important;';
    doc.documentElement.appendChild(probe);
    Object.defineProperty(doc, PROBE, { value: probe, configurable: true });
  }
  const property = type === 'angle' ? 'rotate' : 'scale';
  probe.style.removeProperty(property);
  probe.style.setProperty(property, raw, 'important');
  if (!probe.style.getPropertyValue(property)) return fallback;
  const computed = doc.defaultView.getComputedStyle(probe).getPropertyValue(property);
  const resolved = parseFloat(computed);
  return Number.isFinite(resolved) ? resolved : fallback;
}

function group(element) {
  if (element.localName === 'o-arc') return 'arc';
  for (const name of ['satellite', 'vector', 'side']) if (element.classList.contains(name)) return name;
  return null;
}

function layoutRing(ring) {
  const counts = { arc: 0, satellite: 0, vector: 0, side: 0 };
  for (const child of ring.children) {
    const kind = group(child);
    if (kind) setLayoutProperty(child, '--o-layout-index', counts[kind]++ - (kind === 'side' ? 1 : 0));
    else if (child.localName === 'o-progress') setLayoutProperty(child, '--o-layout-index', 0);
  }
  const count = Math.max(counts.arc, counts.satellite, counts.vector, 1);
  // Preserve Orbit's existing mixed-group convention. Sides close a polygon
  // and therefore never subtract the fit-range endpoint.
  const divisor = counts.side ? String(counts.side) : `max(1, ${count} - var(--o-fit-range, 0))`;
  setLayoutProperty(ring, '--o-layout-angle', `calc(var(--o-range, 360deg) / ${divisor})`);
}

function isScope(root) {
  return root?.nodeType === 9 || (root?.nodeType === 11 && !!root.host);
}

function scopeFor(element) {
  if (isScope(element)) return element;
  const root = element?.getRootNode?.();
  return isScope(root) ? root : null;
}

function composedContains(ancestor, node) {
  for (let current = node; current; current = current.getRootNode?.().host) {
    if (ancestor === current || ancestor.contains?.(current)) return true;
  }
  return false;
}

function registryFor(doc) {
  if (!doc[REGISTRY]) Object.defineProperty(doc, REGISTRY, {
    value: { states: new Set() }, configurable: true,
  });
  return doc[REGISTRY];
}

function dispose(state) {
  if (state.disposed) return;
  state.disposed = true;
  state.view.cancelAnimationFrame(state.frame);
  state.observer.disconnect();
  state.resize.disconnect();
  for (const remove of state.listeners) remove();
  state.rings.clear();
  state.visuals.clear();
  state.dirty.clear();
  state.registry.states.delete(state);
  if (state.scope[STATE] === state) delete state.scope[STATE];
}

function pruneDisconnected(registry) {
  for (const state of registry.states) {
    if (state.scope.host && !state.scope.host.isConnected) dispose(state);
  }
}

function invalidateDescendants(state, target = state.scope) {
  for (const other of state.registry.states) {
    if (other !== state && other.scope.host && composedContains(target, other.scope.host)) {
      other.all = true;
      other.queue();
    }
  }
}

function hasLayoutStructure(node) {
  if (node.nodeType !== 1 || node.hasAttribute('data-orbit-measure')) return false;
  if (orbitNumber(node) !== undefined || node.matches('.gravity-spot, o-arc, o-progress')) return true;
  return !!node.querySelector('.gravity-spot, .orbit, [data-orbit-ring], o-arc, o-progress');
}

function hasStylesheet(node) {
  return node.nodeType === 1 && (node.matches('style, link[rel~="stylesheet"]') ||
    !!node.querySelector('style, link[rel~="stylesheet"]'));
}

function needsDiscovery(record, state) {
  if (record.type === 'childList') {
    return [...record.addedNodes, ...record.removedNodes].some(hasLayoutStructure);
  }
  if (record.attributeName !== 'class') return false;
  const element = record.target;
  return state.rings.has(element) || element.classList.contains('gravity-spot') ||
    orbitNumber(element) !== undefined ||
    (record.oldValue || '').split(/\s+/).some(token => token === 'gravity-spot' || token === 'orbit' || /^orbit-\d+$/.test(token));
}

function createState(scope) {
  const doc = scope.nodeType === 9 ? scope : scope.ownerDocument;
  const view = doc.defaultView;
  const registry = registryFor(doc);
  const state = { scope, doc, view, registry, rings: new Set(), visuals: new Set(), dirty: new Set(),
    scan: true, all: true, frame: 0, disposed: false, listeners: [] };
  const listen = (target, event, listener, options) => {
    target?.addEventListener(event, listener, options);
    state.listeners.push(() => target?.removeEventListener(event, listener, options));
  };
  const queue = () => {
    if (!state.disposed && !state.frame) state.frame = view.requestAnimationFrame(() => {
      state.frame = 0;
      state.flush();
    });
  };
  state.queue = queue;
  state.flush = () => flush(state);
  state.invalidate = (target = scope, includeDescendants = true) => {
    if (includeDescendants && (target === scope || target === doc.documentElement || target === doc.head)) state.all = true;
    else {
      for (const ring of state.rings) if (ring === target || ring.contains(target) || (includeDescendants && target.contains?.(ring))) state.dirty.add(ring);
      for (const visual of state.visuals) if (visual === target || visual.contains(target) || (includeDescendants && target.contains?.(visual))) state.dirty.add(visual);
    }
    if (state.all || state.dirty.size || state.scan) queue();
  };
  state.observer = new view.MutationObserver(records => {
    if (records.some(record => record.type === 'childList')) pruneDisconnected(registry);
    if (state.disposed) return;
    for (const record of records) {
      const target = record.target.nodeType === 3 ? record.target.parentElement : record.target;
      if (!target || target.hasAttribute?.('data-orbit-measure')) continue;
      const structural = needsDiscovery(record, state);
      if (structural) state.scan = true;
      const stylesheetChange = record.type === 'childList' &&
        [...record.addedNodes, ...record.removedNodes].some(hasStylesheet);
      if (stylesheetChange || target.closest?.('head, style') || target.localName === 'link') {
        state.all = true;
        invalidateDescendants(state);
      } else if (record.type === 'attributes') invalidateDescendants(state, target);
      state.invalidate(target, record.type === 'attributes' || structural);
    }
  });
  state.observer.observe(scope, OBSERVE);
  state.resize = new view.ResizeObserver(entries => {
    for (const entry of entries) state.dirty.add(entry.target);
    queue();
  });
  const invalidateAll = () => {
    state.all = true;
    invalidateDescendants(state);
    queue();
  };
  // A document state supplies viewport/font events for all its shadow scopes.
  if (scope === doc) {
    listen(view, 'resize', invalidateAll);
    listen(doc.fonts, 'loadingdone', invalidateAll);
  }
  listen(scope, 'load', event => {
    if (event.target.localName === 'link') invalidateAll();
  }, true);
  for (const event of ['pointerover', 'pointerout', 'focusin', 'focusout']) {
    listen(scope, event, e => {
      state.invalidate(e.target);
      invalidateDescendants(state, e.target);
    }, true);
  }
  Object.defineProperty(scope, STATE, { value: state, configurable: true });
  registry.states.add(state);
  queue();
  return state;
}

function ensureState(scope) {
  const doc = scope.nodeType === 9 ? scope : scope.ownerDocument;
  if (!doc?.defaultView || !doc.documentElement || (scope.host && !scope.host.isConnected)) return null;
  if (scope[STATE] && scope[STATE].doc !== doc) dispose(scope[STATE]);
  // Observing each ancestor root catches host inheritance and host removal,
  // including nested and closed shadow trees registered by their components.
  if (scope.host) {
    const parent = scopeFor(scope.host);
    if (parent) ensureState(parent);
  }
  return scope[STATE] || createState(scope);
}

function discover(state) {
  const nextRings = new Set();
  const automaticCounts = new Map();
  for (const ring of state.scope.querySelectorAll('.gravity-spot > *')) {
    const number = orbitNumber(ring);
    if (number === undefined) continue;
    let automatic = automaticCounts.get(ring.parentElement) || 0;
    if (ring.classList.contains('orbit')) automaticCounts.set(ring.parentElement, ++automatic);
    const resolved = number === null ? automatic : number;
    ring.setAttribute('data-orbit-ring', '');
    setLayoutProperty(ring, '--o-layout-number', resolved === 0 ? .00001 : resolved);
    nextRings.add(ring);
    state.dirty.add(ring);
    if (!state.rings.has(ring)) state.resize.observe(ring);
  }
  for (const old of state.rings) if (!nextRings.has(old)) {
    state.resize.unobserve(old);
    old.removeAttribute('data-orbit-ring');
    for (const name of ['--o-layout-number', '--o-layout-angle']) old.style.removeProperty(name);
  }
  state.rings = nextRings;
  const nextVisuals = new Set(state.scope.querySelectorAll(VISUALS));
  for (const old of state.visuals) if (!nextVisuals.has(old)) state.resize.unobserve(old);
  for (const visual of nextVisuals) if (!state.visuals.has(visual)) {
    state.resize.observe(visual);
    state.dirty.add(visual);
  }
  state.visuals = nextVisuals;
  state.scan = false;
}

function flush(state) {
  if (state.disposed) return;
  if (state.scope.host && !state.scope.host.isConnected) { dispose(state); return; }
  // Discard only our synchronous layout writes, not future user mutations.
  state.observer.disconnect();
  try {
    if (state.scan) discover(state);
    const dirty = state.all ? new Set([...state.rings, ...state.visuals]) : state.dirty;
    const visuals = new Set();
    for (const target of dirty) {
      if (!target.isConnected) continue;
      if (state.rings.has(target)) {
        layoutRing(target);
        for (const visual of target.querySelectorAll(VISUALS)) visuals.add(visual);
      } else if (state.visuals.has(target)) visuals.add(target);
    }
    // DOM order matters for cumulative arcs, including reorders and removals.
    for (const visual of state.visuals) if (visuals.has(visual)) visual.update?.();
    state.dirty = new Set();
    state.all = false;
  } finally {
    if (!state.disposed) state.observer.observe(state.scope, OBSERVE);
  }
}

export function requestLayout(element = globalThis.document) {
  const scope = scopeFor(element);
  if (!scope) return;
  const state = ensureState(scope);
  if (!state) return;
  if (element?.matches?.(VISUALS) && !state.visuals.has(element)) state.scan = true;
  state.invalidate(element || scope);
}

/** Synchronous escape hatch for CSSOM and selector dependencies outside a layout. */
export function refreshLayout(root = globalThis.document) {
  const scope = scopeFor(root);
  if (!scope) return;
  const state = ensureState(scope);
  if (!state) return;
  pruneDisconnected(state.registry);
  for (const current of state.registry.states) {
    if (current !== state && (!current.scope.host || !composedContains(root, current.scope.host))) continue;
    current.scan = true;
    current.all = true;
    current.view.cancelAnimationFrame(current.frame);
    current.frame = 0;
    current.flush();
  }
}
