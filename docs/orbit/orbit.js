/*
* orbit
* v.1.6.0
* Author Juan Martin Muda - Zumerlab
* License MIT
*/
(() => {
  // src/js/orbit-layout.js
  var STATE = Symbol.for("zumer.orbit.layout.state.v1");
  var REGISTRY = Symbol.for("zumer.orbit.layout.registry.v1");
  var PROBE = Symbol.for("zumer.orbit.layout.probe.v1");
  var VISUALS = "o-arc, o-progress";
  var OBSERVE = { subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true };
  function orbitNumber(element) {
    var _a;
    for (const token of element.classList || []) {
      if (/^orbit-\d+$/.test(token)) return Number(token.slice(6));
    }
    return ((_a = element.classList) == null ? void 0 : _a.contains("orbit")) ? null : void 0;
  }
  var WARNED = Symbol.for("zumer.orbit.warned.v1");
  function warnOnce(element, key, message) {
    const seen = element[WARNED] || (element[WARNED] = /* @__PURE__ */ new Set());
    if (seen.has(key)) return;
    seen.add(key);
    console.warn(`[orbit] ${message}`);
  }
  function composedClosest(element, selector) {
    var _a, _b;
    for (let current = element; current; current = current.parentElement || ((_a = current.getRootNode) == null ? void 0 : _a.call(current).host)) {
      if ((_b = current.matches) == null ? void 0 : _b.call(current, selector)) return current;
    }
    return null;
  }
  var KINDS = ".satellite, .vector, .side, o-arc, o-progress";
  function describe(element) {
    const classes = [...element.classList].slice(0, 3).map((name) => "." + name).join("");
    return `<${element.localName}${classes ? " " + classes : ""}>`;
  }
  function diagnose(ring) {
    const spot = ring.parentElement;
    const universe = composedClosest(spot.parentElement, ".bigbang, .satellite");
    if (!universe) {
      warnOnce(spot, "universe", 'A .gravity-spot is not inside a .bigbang, so it measures the viewport. Wrap it: <div class="bigbang"><div class="gravity-spot">\u2026</div></div>.');
    } else if (universe.getClientRects().length && (!universe.clientWidth || !universe.clientHeight)) {
      warnOnce(universe, "empty", `${describe(universe)} has no size (${universe.clientWidth}\xD7${universe.clientHeight}px), so its system is invisible. Give it a width, or place it in a parent with a width.`);
    }
    const visual = ring.querySelector(":scope > o-arc, :scope > o-progress");
    if (visual) {
      const style = ring.ownerDocument.defaultView.getComputedStyle(ring);
      const x = style.getPropertyValue("--o-ellipse-x").trim(), y = style.getPropertyValue("--o-ellipse-y").trim();
      if (x && Number(x) !== 1 || y && Number(y) !== 1) {
        warnOnce(ring, "ellipse-visual", `${describe(visual)} is on ${describe(ring)}, which is stretched into an ellipse (--o-ellipse-x: ${x || 1}, --o-ellipse-y: ${y || 1}). Arcs and progress are drawn on circles only, so it is hidden. Put it on a round ring.`);
      }
    }
    if (!composedClosest(ring, ".dev-orbit")) return;
    for (const child of ring.children) {
      if (orbitNumber(child) !== void 0) {
        warnOnce(child, "nested-ring", `${describe(child)} is inside another ring. Rings must be direct children of .gravity-spot; to nest a system, put a .gravity-spot directly inside a .satellite.`);
      } else if (!child.matches(KINDS)) {
        warnOnce(child, "ring-child", `${describe(child)} is not placed by its ring. A ring holds only .satellite, .vector, .side, <o-arc> and <o-progress>; wrap content as <div class="satellite"><div class="capsule">\u2026</div></div>.`);
      } else if (child.classList.contains("satellite")) {
        for (const inner of child.children) {
          if (!inner.matches(".capsule, .gravity-spot, .bigbang")) {
            warnOnce(inner, "satellite-child", `${describe(inner)} sits directly in a .satellite. Put content in a .capsule so it stays upright and centered.`);
          }
        }
      }
    }
  }
  function setLayoutProperty(element, name, value) {
    const text = String(value);
    if (element.style.getPropertyValue(name) !== text) element.style.setProperty(name, text);
  }
  function cssNumber(element, value, fallback = 0, type = "number") {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    if (type === "number" && /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(raw)) return Number(raw);
    const angle = raw.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(deg|rad|grad|turn)?$/);
    if (type === "angle" && angle) {
      return Number(angle[1]) * ({ deg: 1, rad: 180 / Math.PI, grad: 0.9, turn: 360 }[angle[2]] || 1);
    }
    const doc = element.ownerDocument;
    if (!(doc == null ? void 0 : doc.documentElement)) return fallback;
    let probe = doc[PROBE];
    if (!probe) {
      probe = doc.createElement("span");
      probe.setAttribute("data-orbit-measure", "");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "all:initial!important;position:fixed!important;visibility:hidden!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important;";
      doc.documentElement.appendChild(probe);
      Object.defineProperty(doc, PROBE, { value: probe, configurable: true });
    }
    const property = type === "angle" ? "rotate" : "scale";
    probe.style.removeProperty(property);
    probe.style.setProperty(property, raw, "important");
    if (!probe.style.getPropertyValue(property)) return fallback;
    const computed = doc.defaultView.getComputedStyle(probe).getPropertyValue(property);
    const resolved = parseFloat(computed);
    return Number.isFinite(resolved) ? resolved : fallback;
  }
  function group(element) {
    if (element.localName === "o-arc") return "arc";
    for (const name of ["satellite", "vector", "side"]) if (element.classList.contains(name)) return name;
    return null;
  }
  function layoutRing(ring) {
    const counts = { arc: 0, satellite: 0, vector: 0, side: 0 };
    for (const child of ring.children) {
      const kind = group(child);
      if (kind) setLayoutProperty(child, "--o-layout-index", counts[kind]++ - (kind === "side" ? 1 : 0));
      else if (child.localName === "o-progress") setLayoutProperty(child, "--o-layout-index", 0);
    }
    const count = Math.max(counts.arc, counts.satellite, counts.vector, 1);
    const points = counts.satellite || counts.vector;
    const divisor = counts.side ? String(counts.side) : points ? `max(1, ${count} - var(--o-fit-range, 0))` : String(count);
    setLayoutProperty(ring, "--o-layout-angle", `calc(var(--o-range, 360deg) / ${divisor})`);
  }
  function isScope(root) {
    return (root == null ? void 0 : root.nodeType) === 9 || (root == null ? void 0 : root.nodeType) === 11 && !!root.host;
  }
  function scopeFor(element) {
    var _a;
    if (isScope(element)) return element;
    const root = (_a = element == null ? void 0 : element.getRootNode) == null ? void 0 : _a.call(element);
    return isScope(root) ? root : null;
  }
  function composedContains(ancestor, node) {
    var _a, _b;
    for (let current = node; current; current = (_a = current.getRootNode) == null ? void 0 : _a.call(current).host) {
      if (ancestor === current || ((_b = ancestor.contains) == null ? void 0 : _b.call(ancestor, current))) return true;
    }
    return false;
  }
  function registryFor(doc) {
    if (!doc[REGISTRY]) Object.defineProperty(doc, REGISTRY, {
      value: { states: /* @__PURE__ */ new Set() },
      configurable: true
    });
    return doc[REGISTRY];
  }
  function cancel(state) {
    if (state.frame < 0) state.view.clearTimeout(-state.frame);
    else if (state.frame) state.view.cancelAnimationFrame(state.frame);
    state.frame = 0;
  }
  function settle(state) {
    for (const resolve of state.waiters.splice(0)) resolve();
  }
  function dispose(state) {
    if (state.disposed) return;
    state.disposed = true;
    cancel(state);
    settle(state);
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
    if (node.nodeType !== 1 || node.hasAttribute("data-orbit-measure")) return false;
    if (orbitNumber(node) !== void 0 || node.matches(".gravity-spot, o-arc, o-progress")) return true;
    return !!node.querySelector(".gravity-spot, .orbit, [data-orbit-ring], o-arc, o-progress");
  }
  function hasStylesheet(node) {
    return node.nodeType === 1 && (node.matches('style, link[rel~="stylesheet"]') || !!node.querySelector('style, link[rel~="stylesheet"]'));
  }
  function needsDiscovery(record, state) {
    if (record.type === "childList") {
      return [...record.addedNodes, ...record.removedNodes].some(hasLayoutStructure);
    }
    if (record.attributeName !== "class") return false;
    const element = record.target;
    return state.rings.has(element) || element.classList.contains("gravity-spot") || orbitNumber(element) !== void 0 || (record.oldValue || "").split(/\s+/).some((token) => token === "gravity-spot" || token === "orbit" || /^orbit-\d+$/.test(token));
  }
  function createState(scope) {
    const doc = scope.nodeType === 9 ? scope : scope.ownerDocument;
    const view = doc.defaultView;
    const registry = registryFor(doc);
    const state = {
      scope,
      doc,
      view,
      registry,
      rings: /* @__PURE__ */ new Set(),
      visuals: /* @__PURE__ */ new Set(),
      dirty: /* @__PURE__ */ new Set(),
      scan: true,
      all: true,
      frame: 0,
      disposed: false,
      listeners: [],
      waiters: []
    };
    const listen = (target, event, listener, options) => {
      target == null ? void 0 : target.addEventListener(event, listener, options);
      state.listeners.push(() => target == null ? void 0 : target.removeEventListener(event, listener, options));
    };
    const queue = () => {
      if (state.disposed || state.frame) return;
      const run = () => {
        state.frame = 0;
        state.flush();
      };
      state.frame = doc.visibilityState === "hidden" ? -view.setTimeout(run, 0) : view.requestAnimationFrame(run);
    };
    state.queue = queue;
    state.flush = () => flush(state);
    state.invalidate = (target = scope, includeDescendants = true) => {
      var _a, _b;
      if (includeDescendants && (target === scope || target === doc.documentElement || target === doc.head)) state.all = true;
      else {
        for (const ring of state.rings) if (ring === target || ring.contains(target) || includeDescendants && ((_a = target.contains) == null ? void 0 : _a.call(target, ring))) state.dirty.add(ring);
        for (const visual of state.visuals) if (visual === target || visual.contains(target) || includeDescendants && ((_b = target.contains) == null ? void 0 : _b.call(target, visual))) state.dirty.add(visual);
      }
      if (state.all || state.dirty.size || state.scan) queue();
    };
    state.observer = new view.MutationObserver((records) => {
      var _a, _b;
      if (records.some((record) => record.type === "childList")) pruneDisconnected(registry);
      if (state.disposed) return;
      for (const record of records) {
        const target = record.target.nodeType === 3 ? record.target.parentElement : record.target;
        if (!target || ((_a = target.hasAttribute) == null ? void 0 : _a.call(target, "data-orbit-measure"))) continue;
        const structural = needsDiscovery(record, state);
        if (structural) state.scan = true;
        const stylesheetChange = record.type === "childList" && [...record.addedNodes, ...record.removedNodes].some(hasStylesheet);
        if (stylesheetChange || ((_b = target.closest) == null ? void 0 : _b.call(target, "head, style")) || target.localName === "link") {
          state.all = true;
          invalidateDescendants(state);
        } else if (record.type === "attributes") invalidateDescendants(state, target);
        state.invalidate(target, record.type === "attributes" || structural);
      }
    });
    state.observer.observe(scope, OBSERVE);
    state.resize = new view.ResizeObserver((entries) => {
      for (const entry of entries) state.dirty.add(entry.target);
      queue();
    });
    const invalidateAll = () => {
      state.all = true;
      invalidateDescendants(state);
      queue();
    };
    listen(doc, "visibilitychange", () => {
      if (doc.visibilityState === "hidden" && state.frame > 0) {
        cancel(state);
        queue();
      }
    });
    if (scope === doc) {
      listen(view, "resize", invalidateAll);
      listen(doc.fonts, "loadingdone", invalidateAll);
    }
    listen(scope, "load", (event) => {
      if (event.target.localName === "link") invalidateAll();
    }, true);
    for (const event of ["pointerover", "pointerout", "focusin", "focusout"]) {
      listen(scope, event, (e) => {
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
    if (!(doc == null ? void 0 : doc.defaultView) || !doc.documentElement || scope.host && !scope.host.isConnected) return null;
    if (scope[STATE] && scope[STATE].doc !== doc) dispose(scope[STATE]);
    if (scope.host) {
      const parent = scopeFor(scope.host);
      if (parent) ensureState(parent);
    }
    return scope[STATE] || createState(scope);
  }
  function discover(state) {
    const nextRings = /* @__PURE__ */ new Set();
    const automaticCounts = /* @__PURE__ */ new Map();
    for (const ring of state.scope.querySelectorAll(".gravity-spot > *")) {
      const number = orbitNumber(ring);
      if (number === void 0) continue;
      let automatic = automaticCounts.get(ring.parentElement) || 0;
      if (ring.classList.contains("orbit")) automaticCounts.set(ring.parentElement, ++automatic);
      const resolved = number === null ? automatic : number;
      ring.setAttribute("data-orbit-ring", "");
      setLayoutProperty(ring, "--o-layout-number", resolved === 0 ? 1e-5 : resolved);
      nextRings.add(ring);
      state.dirty.add(ring);
      if (!state.rings.has(ring)) state.resize.observe(ring);
    }
    for (const old of state.rings) if (!nextRings.has(old)) {
      state.resize.unobserve(old);
      old.removeAttribute("data-orbit-ring");
      for (const name of ["--o-layout-number", "--o-layout-angle"]) old.style.removeProperty(name);
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
    if (state.scope.host && !state.scope.host.isConnected) {
      dispose(state);
      return;
    }
    state.observer.disconnect();
    const drawn = [];
    try {
      if (state.scan) discover(state);
      const dirty = state.all ? /* @__PURE__ */ new Set([...state.rings, ...state.visuals]) : state.dirty;
      const visuals = /* @__PURE__ */ new Set();
      for (const target of dirty) {
        if (!target.isConnected) continue;
        if (state.rings.has(target)) {
          layoutRing(target);
          diagnose(target);
          for (const visual of target.querySelectorAll(VISUALS)) visuals.add(visual);
        } else if (state.visuals.has(target)) visuals.add(target);
      }
      for (const visual of state.visuals) if (visuals.has(visual) && visual.update) {
        visual.update();
        drawn.push(visual);
      }
      state.dirty = /* @__PURE__ */ new Set();
      state.all = false;
    } finally {
      if (!state.disposed) state.observer.observe(state.scope, OBSERVE);
    }
    for (const visual of drawn) visual.dispatchEvent(new state.view.Event("o-rendered", { bubbles: true, composed: true }));
    if (!state.frame) settle(state);
  }
  function requestLayout(element = globalThis.document) {
    var _a;
    const scope = scopeFor(element);
    if (!scope) return;
    const state = ensureState(scope);
    if (!state) return;
    if (((_a = element == null ? void 0 : element.matches) == null ? void 0 : _a.call(element, VISUALS)) && !state.visuals.has(element)) state.scan = true;
    state.invalidate(element || scope);
  }
  function refreshLayout(root = globalThis.document) {
    const scope = scopeFor(root);
    if (!scope) return;
    const state = ensureState(scope);
    if (!state) return;
    pruneDisconnected(state.registry);
    for (const current of state.registry.states) {
      if (current !== state && (!current.scope.host || !composedContains(root, current.scope.host))) continue;
      current.scan = true;
      current.all = true;
      cancel(current);
      current.flush();
    }
  }
  function layoutReady(root = globalThis.document) {
    const scope = scopeFor(root);
    const state = scope && ensureState(scope);
    if (!state) return Promise.resolve();
    pruneDisconnected(state.registry);
    const pending = [...state.registry.states].filter((current) => current === state || current.scope.host && composedContains(root, current.scope.host));
    return Promise.all(pending.map((current) => new Promise((resolve) => {
      current.waiters.push(resolve);
      current.queue();
    }))).then(() => {
    });
  }

  // src/js/orbit-base.js
  var OrbitBase = class extends (globalThis.HTMLElement || class {
  }) {
    constructor() {
      super();
    }
    connectedCallback() {
      for (const name of ["value", "max"]) {
        if (Object.prototype.hasOwnProperty.call(this, name)) {
          const pending = this[name];
          delete this[name];
          this[name] = pending;
        }
      }
      requestLayout(this);
    }
    /** value and max mirror their attributes, so property bindings redraw too. */
    get value() {
      const raw = this.getAttribute("value");
      return raw === null || raw.trim() === "" ? null : Number(raw);
    }
    set value(next) {
      if (next === null || next === void 0 || next === "") this.removeAttribute("value");
      else this.setAttribute("value", String(next));
    }
    get max() {
      const raw = this.getAttribute("max");
      return raw === null ? 100 : Number(raw);
    }
    set max(next) {
      if (next === null || next === void 0 || next === "") this.removeAttribute("max");
      else this.setAttribute("max", String(next));
    }
    disconnectedCallback() {
      if (this._textFrame) this.ownerDocument.defaultView.cancelAnimationFrame(this._textFrame);
      this._textFrame = 0;
    }
    readNumber(style, name, fallback = 0) {
      return cssNumber(this, style.getPropertyValue(name), fallback);
    }
    readAngle(style, name, fallback = 0) {
      return cssNumber(this, style.getPropertyValue(name), fallback, "angle");
    }
    /** The value attribute as a number. Invalid values draw nothing, and say why. */
    readValue() {
      const raw = this.getAttribute("value");
      if (raw === null || raw.trim() === "") return 0;
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        warnOnce(this, "value:" + raw, `<${this.localName} value="${raw}"> is not a number, so nothing is drawn.`);
        return 0;
      }
      return value;
    }
    /** The max attribute (default 100). It must be a positive number. */
    readMax() {
      const raw = this.getAttribute("max");
      if (raw === null) return 100;
      const max = Number(raw);
      if (!(max > 0)) {
        warnOnce(this, "max:" + raw, `<${this.localName} max="${raw}"> must be a positive number, so nothing is drawn.`);
        return 0;
      }
      return max;
    }
    getCommonAttributes(element) {
      var _a;
      const style = element.ownerDocument.defaultView.getComputedStyle(element);
      const measuredRadius = parseFloat(style.getPropertyValue("r"));
      const orbitRadius = Math.max(0, Number.isFinite(measuredRadius) ? measuredRadius : (((_a = element.parentElement) == null ? void 0 : _a.clientWidth) || 0) / 2);
      const orbitNumber2 = Math.max(1e-5, this.readNumber(style, "--o-orbit-number", 1));
      const size = Math.max(0, this.readNumber(style, "--o-size-ratio", 1));
      const strokeWidth = Math.max(0, this.readNumber(style, "--o-stroke-width", 1));
      const shape = element.getAttribute("shape") || "none";
      const arcHeight = Math.max(0, orbitRadius / orbitNumber2 * size - strokeWidth + 0.3);
      const arcHeightPercentage = orbitRadius > 0 ? Math.min(49.999, arcHeight * 25 / orbitRadius) : 0;
      let innerOuter = 0;
      if (element.classList.contains("outer-orbit")) {
        innerOuter = arcHeightPercentage;
      } else if (element.classList.contains("quarter-outer-orbit")) {
        innerOuter = arcHeightPercentage * -0.5;
      } else if (element.classList.contains("inner-orbit")) {
        innerOuter = arcHeightPercentage * -1;
      } else if (element.classList.contains("quarter-inner-orbit")) {
        innerOuter = arcHeightPercentage * 0.5;
      }
      const realRadius = 50 + innerOuter;
      return {
        orbitRadius,
        arcHeight,
        realRadius,
        arcAngle: 0,
        // set by each component
        shape,
        arcHeightPercentage,
        orbitNumber: orbitNumber2,
        size,
        strokeWidth,
        style
      };
    }
    getProgressAngle(maxAngle, value, maxValue = 100) {
      if (!Number.isFinite(value) || !Number.isFinite(maxValue) || maxValue <= 0) return 0;
      return Math.min(1, Math.max(0, value / maxValue)) * Math.max(0, Math.min(360, maxAngle));
    }
    arcPoint(radius, angle, radiusAdjustment = 0, angleOffsetDegrees = 0) {
      const adjustedRadius = radius + radiusAdjustment;
      const adjustedAngle = angle + angleOffsetDegrees * Math.PI / 180;
      return {
        x: 50 + adjustedRadius * Math.cos(adjustedAngle),
        y: 50 + adjustedRadius * Math.sin(adjustedAngle)
      };
    }
    calculateCommonArcParameters(arcAngle, radius, arcHeightPercentage, orbitNumber2, shape, strokeWidth, arcHeight, gap = 0) {
      const offset = Math.PI / 2;
      const fangle = Math.max(0, Math.min(360, arcAngle)) * Math.PI / 180;
      const bigRadius = radius + arcHeightPercentage;
      const smallRadius = Math.max(1e-3, radius - arcHeightPercentage);
      const bigGap = Math.min(fangle * 0.49, (gap + strokeWidth * 1.25) / orbitNumber2 / bigRadius);
      const smallGap = Math.min(fangle * 0.49, (gap + strokeWidth * 1.25) / orbitNumber2 / smallRadius);
      const upperAngleStart = bigGap - offset;
      const upperAngleEnd = fangle - bigGap - offset;
      const innerAngleStart = smallGap - offset;
      const innerAngleEnd = fangle - smallGap - offset;
      const upperArcStart = this.arcPoint(bigRadius, upperAngleStart);
      const upperArcEnd = this.arcPoint(bigRadius, upperAngleEnd);
      const innerArcStart = this.arcPoint(smallRadius, innerAngleStart);
      const innerArcEnd = this.arcPoint(smallRadius, innerAngleEnd);
      return {
        upperArcStart,
        upperArcEnd,
        innerArcStart,
        innerArcEnd,
        bigRadius,
        smallRadius,
        radius,
        upperAngleStart,
        upperAngleEnd,
        innerAngleStart,
        innerAngleEnd
      };
    }
    generatePathData(shape, params) {
      switch (shape) {
        case "rounded":
          return this.generateRoundedPath(params);
        case "circle":
        case "circle-a":
        case "bullet":
          return this.generateCirclePath(params, shape);
        case "circle-b":
          return this.generateCircleBPath(params);
        case "arrow":
          return this.generateArrowPath(params);
        case "backslash":
        case "slash":
          return this.generateSlashPath(params, shape);
        case "zigzag":
          return this.generateZigzagPath(params);
        default:
          return this.generateDefaultPath(params);
      }
    }
    /** "x,y" of a point at radius and angle (radians), in viewBox units. */
    pt(radius, angle) {
      const point = this.arcPoint(radius, angle);
      return `${point.x},${point.y}`;
    }
    /**
     * SVG arc commands from the current point (at `from`) to `to`, along one
     * circle. Every arc in Orbit goes through here. Splitting into pieces of at
     * most 90° means no large-arc flag to get wrong and no arc whose endpoints
     * coincide, so a full 360° circle is just another arc.
     */
    arcTo(radius, from, to) {
      const steps = Math.max(1, Math.ceil(Math.abs(to - from) / (Math.PI / 2) - 1e-9));
      const sweep = to >= from ? 1 : 0;
      let d = "";
      for (let i = 1; i <= steps; i++) {
        d += ` A ${radius},${radius} 0 0 ${sweep} ${this.pt(radius, from + (to - from) * i / steps)}`;
      }
      return d;
    }
    /** An open arc along one radius: strokes, curved text and touch areas. */
    linePath(radius, from, to) {
      return `M ${this.pt(radius, from)}${this.arcTo(radius, from, to)}`;
    }
    /**
     * Shape endings are sized from the band itself (h = half its thickness, in
     * viewBox units), so they look the same on every ring and at every size.
     * Angles are in radians, as in calculateCommonArcParameters().
     */
    ending(params, factor) {
      const { bigRadius, smallRadius } = params;
      const h = (bigRadius - smallRadius) / 2;
      const middle = (bigRadius + smallRadius) / 2;
      const span = Math.min(params.upperAngleEnd - params.upperAngleStart, params.innerAngleEnd - params.innerAngleStart);
      const length = Math.max(0, Math.min(h * factor, span * smallRadius * 0.49));
      return { h, middle, length, angle: length / middle };
    }
    generateDefaultPath(params) {
      const { bigRadius: R, smallRadius: r, upperAngleStart: uS, upperAngleEnd: uE, innerAngleStart: iS, innerAngleEnd: iE } = params;
      return `M ${this.pt(R, uS)}${this.arcTo(R, uS, uE)} L ${this.pt(r, iE)}${this.arcTo(r, iE, iS)} Z`;
    }
    generateRoundedPath(params) {
      const { bigRadius: R, smallRadius: r, upperAngleStart: uS, upperAngleEnd: uE, innerAngleStart: iS, innerAngleEnd: iE } = params;
      const { length: c } = this.ending(params, 0.5);
      const corner = (radius, angle) => ` A ${c},${c} 0 0 1 ${this.pt(radius, angle)}`;
      let d = `M ${this.pt(R, uS + c / R)}${this.arcTo(R, uS + c / R, uE - c / R)}`;
      d += `${corner(R - c, uE)} L ${this.pt(r + c, iE)}${corner(r, iE - c / r)}`;
      d += this.arcTo(r, iE - c / r, iS + c / r);
      d += `${corner(r + c, iS)} L ${this.pt(R - c, uS)}${corner(R, uS + c / R)} Z`;
      return d;
    }
    generateCirclePath(params, shape) {
      const { bigRadius: R, smallRadius: r, upperAngleStart: uS, upperAngleEnd: uE, innerAngleStart: iS, innerAngleEnd: iE } = params;
      const startSweep = shape === "bullet" ? 0 : 1;
      let d = `M ${this.pt(R, uS)}${this.arcTo(R, uS, uE)} A 1,1 0 0 1 ${this.pt(r, iE)}`;
      d += `${this.arcTo(r, iE, iS)} A 1,1 0 0 ${startSweep} ${this.pt(R, uS)} Z`;
      return d;
    }
    generateCircleBPath(params) {
      const { bigRadius: R, smallRadius: r } = params;
      const { h, angle } = this.ending(params, 1);
      const a0 = params.upperAngleStart + angle;
      const a1 = params.upperAngleEnd - angle;
      let d = `M ${this.pt(R, a0)}${this.arcTo(R, a0, a1)} A ${h},${h} 0 0 1 ${this.pt(r, a1)}`;
      d += `${this.arcTo(r, a1, a0)} A ${h},${h} 0 0 1 ${this.pt(R, a0)} Z`;
      return d;
    }
    generateArrowPath(params) {
      const { bigRadius: R, smallRadius: r } = params;
      const { middle, angle } = this.ending(params, 1.6);
      const a0 = params.upperAngleStart;
      const a1 = params.upperAngleEnd;
      let d = `M ${this.pt(R, a0)}${this.arcTo(R, a0, a1 - angle)}`;
      d += ` L ${this.pt(middle, a1)} L ${this.pt(r, a1 - angle)}`;
      d += `${this.arcTo(r, a1 - angle, a0)} L ${this.pt(middle, a0 + angle)} Z`;
      return d;
    }
    generateSlashPath(params, shape) {
      const { bigRadius: R, smallRadius: r } = params;
      const { angle } = this.ending(params, 1);
      const a0 = params.upperAngleStart;
      const a1 = params.upperAngleEnd;
      const [outer0, outer1, inner0, inner1] = shape === "backslash" ? [a0, a1 - angle, a0 + angle, a1] : [a0 + angle, a1, a0, a1 - angle];
      return `M ${this.pt(R, outer0)}${this.arcTo(R, outer0, outer1)} L ${this.pt(r, inner1)}${this.arcTo(r, inner1, inner0)} Z`;
    }
    generateZigzagPath(params) {
      const { bigRadius: R, smallRadius: r } = params;
      const { middle, angle } = this.ending(params, 1.6);
      const a0 = params.upperAngleStart;
      const a1 = params.upperAngleEnd;
      let d = `M ${this.pt(R, a0 + angle)}${this.arcTo(R, a0 + angle, a1)}`;
      d += ` L ${this.pt(middle, a1 - angle)} L ${this.pt(r, a1)}`;
      d += `${this.arcTo(r, a1, a0 + angle)} L ${this.pt(middle, a0)} Z`;
      return d;
    }
    /**
     * The touch area of an interactive arc or progress: an invisible stroke
     * along the middle of the band, from `from` to `to` degrees (0 = start of
     * the element). It is as wide as the band plus `hit-width` px on each side,
     * and catches the pointer whatever the fill, so transparent bands work.
     */
    updateHitArea(hit, attrs, from, to) {
      const extra = Math.max(0, Number(this.getAttribute("hit-width")) || 0);
      this.fitCanvas(attrs, this.hasAttribute("interactive") ? extra : 0);
      if (!this.hasAttribute("interactive") || !(to > from) || !(attrs.orbitRadius > 0)) {
        hit.removeAttribute("d");
        return;
      }
      const radians = (degrees) => (degrees - 90) * Math.PI / 180;
      hit.setAttribute("d", this.linePath(attrs.realRadius, radians(from), radians(Math.min(to, from + 360))));
      hit.style.strokeWidth = `${attrs.arcHeight + attrs.strokeWidth + 2 * extra}px`;
    }
    /**
     * Grow the SVG canvas past the ring's box so it covers the whole band, its
     * stroke and touch area. Some engines (WebKit) neither paint reliably nor
     * hit-test SVG content that overflows its box.
     */
    fitCanvas(attrs, extra) {
      const svg = this.shadowRoot.querySelector("svg");
      const scale = attrs.orbitRadius / 50;
      if (!svg || !(scale > 0)) return;
      const outer = (attrs.realRadius + attrs.arcHeightPercentage) * scale + attrs.strokeWidth + extra;
      const pad = Math.max(0, Math.ceil(outer - attrs.orbitRadius));
      const units = pad / scale;
      svg.setAttribute("viewBox", `${-units} ${-units} ${100 + 2 * units} ${100 + 2 * units}`);
      svg.style.inset = `${-pad}px`;
    }
  };

  // src/js/orbit-progress.js
  var OrbitProgress = class extends OrbitBase {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
      <style>
        :host {
          --o-fill: var(--o-gray-light);
          --o-stroke: var(--o-fill);
          --o-stroke-width: 1;
          --o-back-fill: transparent;
          --o-back-stroke: none;
          --o-back-stroke-width: 1;
        }
        svg {
          position: absolute;
          inset: 0;
          width: auto;
          height: auto;
          overflow: visible;
          pointer-events: none;
        }
        /* Display element by default: never steals clicks (see orbit-arc).
           Interaction is opt-in via the "interactive" attribute. */
        svg * {
          pointer-events: none;
        }
        :host([interactive]) svg * {
          pointer-events: visiblePainted;
        }
        /* The touch area covers the whole track, whatever its colors. */
        .hit {
          fill: none;
          stroke: transparent;
        }
        :host([interactive]) .hit {
          pointer-events: stroke;
        }
        :host([interactive]) {
          cursor: pointer;
        }
        .progress-bar {
          fill: var(--o-fill);
          stroke: var(--o-stroke);
          stroke-width: var(--o-stroke-width);
          transition: fill 0.25s, stroke 0.25s;
          stroke-linejoin: round;
        }
        .progress-bg {
          fill: var(--o-back-fill);
          stroke: var(--o-back-stroke);
          stroke-width: var(--o-back-stroke-width);
        }
        /* variant="stroke": the thin, legible gauge.
           The default band is a FILLED donut wedge, so everyone building a
           thin gauge tripped on --o-fill/--o-back-fill. With this variant the
           paths are open arcs and the data color lives where you expect it:
           --o-stroke for the bar, --o-back-stroke for the track. */
        /* The stroke variant draws a 2px bar over a gray 1px track unless you
           set your own values on the element. */
        :host([variant="stroke"]) {
          --o-stroke-width: 2;
          --o-back-stroke: var(--o-gray-light);
        }
        :host([variant="stroke"]) .progress-bar {
          fill: none;
          stroke: var(--o-stroke);
          stroke-width: var(--o-stroke-width, 2);
          stroke-linecap: round;
        }
        :host([variant="stroke"]) .progress-bg {
          fill: none;
          stroke: var(--o-back-stroke, var(--o-gray-light));
          stroke-width: var(--o-back-stroke-width, 1);
          stroke-linecap: round;
        }
      </style>
      <svg viewBox="0 0 100 100">
        <path class="hit" vector-effect="non-scaling-stroke"></path>
        <path class="progress-bg" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
        <path class="progress-bar" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
      </svg>
    `;
    }
    update() {
      const attrs = this.getAttributes();
      const isStroke = this.getAttribute("variant") === "stroke";
      const dBg = isStroke ? this.calculateStrokeArc(attrs, true) : this.calculateArcParameters(attrs, true);
      const dBar = isStroke ? this.calculateStrokeArc(attrs, false) : this.calculateArcParameters(attrs, false);
      this.shadowRoot.querySelector(".progress-bg").setAttribute("d", dBg);
      this.shadowRoot.querySelector(".progress-bar").setAttribute("d", dBar);
      this.updateHitArea(this.shadowRoot.querySelector(".hit"), attrs, 0, attrs.range);
    }
    /**
     * variant="stroke": open arc along the orbit radius (no closed band),
     * stroked by CSS. Same progress math as the band variant.
     */
    calculateStrokeArc(attrs, full) {
      const { realRadius } = attrs;
      const arcAngle = Math.max(0, Math.min(this.getProgressAngle(attrs, full), 360));
      if (!(arcAngle > 0) || !(attrs.orbitRadius > 0)) return "";
      const start = -Math.PI / 2;
      return this.linePath(realRadius, start, start + arcAngle * Math.PI / 180);
    }
    getAttributes() {
      const common = super.getCommonAttributes(this);
      const range = Math.max(0, Math.min(360, this.readAngle(common.style, "--o-range", 360)));
      const rawValue = common.style.getPropertyValue("--o-progress").trim();
      const progress = rawValue ? this.readNumber(common.style, "--o-progress", 0) : this.readValue();
      const maxValue = this.readMax();
      return {
        ...common,
        range,
        progress,
        maxValue
      };
    }
    getProgressAngle(attrs, full) {
      const { range, progress, maxValue } = attrs;
      return full ? range : super.getProgressAngle(range, progress, maxValue);
    }
    calculateArcParameters(attrs, full) {
      const { shape, realRadius, arcHeightPercentage, orbitNumber: orbitNumber2, strokeWidth, arcHeight } = attrs;
      const arcAngle = this.getProgressAngle(attrs, full);
      if (!(arcAngle > 0) || !(attrs.orbitRadius > 0)) return "";
      const params = super.calculateCommonArcParameters(
        arcAngle,
        realRadius,
        arcHeightPercentage,
        orbitNumber2,
        shape,
        strokeWidth,
        arcHeight
      );
      return super.generatePathData(shape, params);
    }
  };

  // src/js/orbit-arc.js
  var template = typeof document === "undefined" ? null : document.createElement("template");
  if (template) template.innerHTML = `
  <style>
    :host {
      --o-fill: var(--o-gray-light);
      --o-stroke: var(--o-fill);
      --o-stroke-width: 1;
      --o-color: currentcolor;
    }
    svg {
      position: absolute;
      inset: 0;
      width: auto;
      height: auto;
      overflow: visible;
      pointer-events: none;
    }
    /* Arcs are display elements by default: they must NOT steal clicks from
       satellites/controls nearby (a painted arc used to capture clicks even
       at opacity 0, and pointer-events:none on the host could not pierce the
       shadow). Interaction is opt-in via the "interactive" attribute. */
    svg * {
      pointer-events: none;
    }
    :host([interactive]) svg * {
      pointer-events: visiblePainted;
    }
    /* The touch area catches the pointer even where the band is transparent. */
    #orbitHit {
      fill: none;
      stroke: transparent;
    }
    :host([interactive]) #orbitHit {
      pointer-events: stroke;
    }
    :host([interactive]) {
      cursor: pointer;
    }
    #orbitShape {
      fill: var(--o-fill);
      stroke: var(--o-stroke);
      stroke-width: var(--o-stroke-width);
      transition: fill 0.25s, stroke 0.25s;
    }
    text {
      fill: var(--o-color);
    }
    /* Guides for text: never painted and never under the pointer. */
    #orbitPath, #measure {
      fill: none;
      stroke: none;
      pointer-events: none;
    }
  </style>
  <svg viewBox="0 0 100 100">
    <path id="orbitHit" vector-effect="non-scaling-stroke"></path>
    <path id="orbitShape" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
    <path id="orbitPath" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"></path>
    <text>
      <textPath href="#orbitPath" alignment-baseline="middle"></textPath>
    </text>
    <text id="measure" visibility="hidden" aria-hidden="true"></text>
  </svg>
`;
  var OrbitArc = class extends OrbitBase {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    update() {
      const attrs = this.getAttributes();
      const { fitRange, stacked } = attrs;
      if (stacked) {
        const anchor = attrs.auto && this.hasAttribute("text-anchor") ? { middle: -0.5, end: -1 }[attrs.textAnchor] || 0 : 0;
        setLayoutProperty(this, "--o-arc-start", `${attrs.stackOffset + anchor * attrs.arcAngle}deg`);
        setLayoutProperty(this, "--o_stack", attrs.stackOffset + attrs.arcAngle);
      } else {
        this.style.removeProperty("--o-arc-start");
        this.style.removeProperty("--o_stack");
      }
      const orbitPath = this.shadowRoot.querySelector("#orbitPath");
      const orbitShape = this.shadowRoot.querySelector("#orbitShape");
      const textPath = this.shadowRoot.querySelector("textPath");
      orbitShape.setAttribute("d", this.calculateArcParameters(attrs).dShape);
      orbitPath.setAttribute("d", this.calculateTextArcParameters(attrs).dPath);
      this.updateHitArea(this.shadowRoot.querySelector("#orbitHit"), attrs, 0, attrs.arcAngle);
      const textAnchor = attrs.textAnchor;
      if (textAnchor === "start") {
        textPath.setAttribute("startOffset", "0%");
        textPath.setAttribute("text-anchor", "start");
      } else if (textAnchor === "middle") {
        textPath.setAttribute("startOffset", "50%");
        textPath.setAttribute("text-anchor", "middle");
      } else if (textAnchor === "end") {
        textPath.setAttribute("startOffset", "100%");
        textPath.setAttribute("text-anchor", "end");
      }
      if (fitRange) {
        textPath.parentElement.setAttribute("textLength", orbitPath.getTotalLength());
      } else {
        textPath.parentElement.removeAttribute("textLength");
      }
      textPath.parentElement.style.fontSize = attrs.svgFontSize;
      textPath.textContent = this.textContent;
      if (!attrs.auto) this.warnIfTextOverflows(orbitPath, textPath, fitRange);
    }
    /**
     * Curved text has an explicit angular budget: glyphs past the end of the
     * arc path are clipped SILENTLY by SVG. Measure and warn so nobody loses
     * time to invisible truncation (~20 chars in 96° at default sizes).
     * fit-range squeezes the text to the path via textLength, so it never clips.
     */
    warnIfTextOverflows(orbitPath, textPath, fitRange) {
      const raw = (this.textContent || "").trim();
      if (!raw || fitRange || !this.isConnected) return;
      if (this._textFrame) this.ownerDocument.defaultView.cancelAnimationFrame(this._textFrame);
      this._textFrame = this.ownerDocument.defaultView.requestAnimationFrame(() => {
        this._textFrame = 0;
        if (!this.isConnected) return;
        try {
          const pathLen = orbitPath.getTotalLength();
          const textLen = textPath.parentElement.getComputedTextLength();
          if (pathLen > 0 && textLen > pathLen && this._truncWarned !== raw) {
            this._truncWarned = raw;
            console.warn(
              `[orbit] <o-arc> text "${raw.length > 34 ? raw.slice(0, 34) + "\u2026" : raw}" overflows its arc (${Math.round(textLen)} > ${Math.round(pathLen)} units) and will clip. Shorten the text, widen --o-range, add range="auto" to fit the arc to the text, or fit-range to squeeze it.`
            );
          }
        } catch (e) {
        }
      });
    }
    getAttributes() {
      const common = super.getCommonAttributes(this);
      const { style } = common;
      const range = Math.max(0, Math.min(360, this.readAngle(style, "--o-range", 360)));
      const flip = this.hasAttribute("flip") || this.classList.contains("flip");
      const fitRange = this.hasAttribute("fit-range") || this.classList.contains("fit-range");
      const length = common.orbitRadius * 24 / common.orbitNumber || 100;
      const textAnchor = this.getAttribute("text-anchor") || "middle";
      const fontSize = style.fontSize || "16px";
      const gap = Math.max(0, this.readNumber(style, "--o-gap", 1));
      const svgFontSize = `calc(${fontSize} * (100 / (${length}) * (12 / var(--o-orbit-number)))`;
      const auto = this.getAttribute("range") === "auto";
      const stacked = auto || this.hasAttribute("value");
      let arcAngle;
      if (auto) arcAngle = this.measureTextAngle(svgFontSize, common.realRadius, gap);
      else if (this.hasAttribute("value")) arcAngle = super.getProgressAngle(range, this.readValue(), this.readMax());
      else arcAngle = Math.max(0, Math.min(360, this.readAngle(style, "--o-angle", 0)));
      this._autoAngle = auto ? arcAngle : 0;
      let stackOffset = 0;
      if (stacked) {
        for (let prev = this.previousElementSibling; prev; prev = prev.previousElementSibling) {
          if (prev.localName !== "o-arc") continue;
          const previousStyle = this.ownerDocument.defaultView.getComputedStyle(prev);
          if (prev.getAttribute("range") === "auto") stackOffset += prev._autoAngle || 0;
          else if (prev.hasAttribute("value")) {
            const prevMax = prev.hasAttribute("max") ? Number(prev.getAttribute("max")) : 100;
            const prevRange = cssNumber(prev, previousStyle.getPropertyValue("--o-range"), range, "angle");
            stackOffset += super.getProgressAngle(prevRange, Number(prev.getAttribute("value")), prevMax);
          } else stackOffset += cssNumber(prev, previousStyle.getPropertyValue("--o-angle"), 0, "angle");
        }
      }
      return { ...common, gap, arcAngle, stackOffset, flip, fitRange, length, fontSize, svgFontSize, textAnchor, auto, stacked };
    }
    /** range="auto": the angle that fits this arc's text, with half an em of room at each end. */
    measureTextAngle(svgFontSize, radius, gap) {
      const text = (this.textContent || "").trim();
      if (!text || !(radius > 0)) return 0;
      const measure = this.shadowRoot.querySelector("#measure");
      measure.style.fontSize = svgFontSize;
      measure.textContent = text;
      let length = 0;
      try {
        length = measure.getComputedTextLength() + parseFloat(this.ownerDocument.defaultView.getComputedStyle(measure).fontSize);
      } catch (e) {
      }
      if (!(length > 0)) return 0;
      return Math.min(360, length / radius * 180 / Math.PI + gap);
    }
    calculateArcParameters(attrs) {
      const { arcAngle, realRadius, arcHeightPercentage, orbitNumber: orbitNumber2, shape, strokeWidth, arcHeight, gap } = attrs;
      if (!(arcAngle > 0) || !(attrs.orbitRadius > 0)) return { dShape: "" };
      const params = super.calculateCommonArcParameters(
        arcAngle,
        realRadius,
        arcHeightPercentage,
        orbitNumber2,
        shape,
        strokeWidth,
        arcHeight,
        gap
      );
      const dShape = super.generatePathData(shape, params);
      return { dShape };
    }
    calculateTextArcParameters(attrs) {
      const { arcAngle, realRadius, gap, flip } = attrs;
      if (!(arcAngle > 0)) return { dPath: "" };
      const adjustedGap = Math.min(gap * 0.5, arcAngle * 0.49);
      const start = (adjustedGap - 90) * Math.PI / 180;
      const end = (arcAngle - adjustedGap - 90) * Math.PI / 180;
      return { dPath: flip ? this.linePath(realRadius, end, start) : this.linePath(realRadius, start, end) };
    }
    resolveAngle(cssExpression) {
      return cssNumber(this, cssExpression, 0, "angle");
    }
    /** @deprecated Use resolveAngle(). */
    calcularExpresionCSS(cssExpression) {
      return this.resolveAngle(cssExpression);
    }
  };

  // src/js/orbit-resize.js
  var resizing = /* @__PURE__ */ new WeakMap();
  var FIXED = /^[+-]?(?:\d+\.?\d*|\.\d+)px$/;
  var Orbit = {
    refresh: refreshLayout,
    /** A promise that resolves when pending layouts are drawn. */
    ready: layoutReady,
    /**
     * Scale systems that use a fixed px --o-force with their container's width
     * (500px wide = ratio 1). Systems on the default --o-force already follow
     * their .bigbang, so they are left alone.
     */
    resize(parentElementSelector) {
      var _a, _b;
      const parent = typeof parentElementSelector === "string" ? (_a = globalThis.document) == null ? void 0 : _a.querySelector(parentElementSelector) : parentElementSelector;
      if (!(parent == null ? void 0 : parent.ownerDocument)) {
        console.error("Orbit.resize: element not found:", parentElementSelector);
        return () => {
        };
      }
      (_b = resizing.get(parent)) == null ? void 0 : _b();
      const view = parent.ownerDocument.defaultView;
      const applyRatio = (width) => {
        if (!(width > 0)) return;
        let fixed = 0;
        for (const element of parent.querySelectorAll(".gravity-spot")) {
          if (!FIXED.test(view.getComputedStyle(element).getPropertyValue("--o-force").trim())) continue;
          fixed++;
          const ratio = String(width / 500);
          if (element.style.getPropertyValue("--o-force-ratio") !== ratio) element.style.setProperty("--o-force-ratio", ratio);
        }
        if (!fixed) {
          warnOnce(parent, "resize", "Orbit.resize() has nothing to do here: every .bigbang already scales with its container. It only scales systems that set a fixed px --o-force.");
        }
        refreshLayout(parent);
      };
      const observer = new view.ResizeObserver((entries) => {
        for (const entry of entries) applyRatio(entry.contentRect.width);
      });
      observer.observe(parent);
      applyRatio(parent.clientWidth || parent.getBoundingClientRect().width);
      const stop = () => {
        observer.disconnect();
        if (resizing.get(parent) === stop) resizing.delete(parent);
      };
      resizing.set(parent, stop);
      return stop;
    }
  };

  // src/orbit.js
  function registerOrbit() {
    if (typeof customElements === "undefined" || typeof document === "undefined") return;
    if (!customElements.get("o-progress")) customElements.define("o-progress", OrbitProgress);
    if (!customElements.get("o-arc")) customElements.define("o-arc", OrbitArc);
    requestLayout(document);
    window.Orbit = Orbit;
  }
  registerOrbit();
})();
