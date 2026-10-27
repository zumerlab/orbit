import { cssNumber, requestLayout, warnOnce } from './orbit-layout.js';

export class OrbitBase extends (globalThis.HTMLElement || class {}) {
  constructor() {
    super();
  }

  connectedCallback() {
    // A framework may set .value or .max before the element is defined; apply
    // those now so they reach the attribute.
    for (const name of ['value', 'max']) {
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
    const raw = this.getAttribute('value');
    return raw === null || raw.trim() === '' ? null : Number(raw);
  }

  set value(next) {
    if (next === null || next === undefined || next === '') this.removeAttribute('value');
    else this.setAttribute('value', String(next));
  }

  get max() {
    const raw = this.getAttribute('max');
    return raw === null ? 100 : Number(raw);
  }

  set max(next) {
    if (next === null || next === undefined || next === '') this.removeAttribute('max');
    else this.setAttribute('max', String(next));
  }

  disconnectedCallback() {
    if (this._textFrame) this.ownerDocument.defaultView.cancelAnimationFrame(this._textFrame);
    this._textFrame = 0;
  }

  readNumber(style, name, fallback = 0) {
    return cssNumber(this, style.getPropertyValue(name), fallback);
  }

  readAngle(style, name, fallback = 0) {
    return cssNumber(this, style.getPropertyValue(name), fallback, 'angle');
  }

  /** The value attribute as a number. Invalid values draw nothing, and say why. */
  readValue() {
    const raw = this.getAttribute('value');
    if (raw === null || raw.trim() === '') return 0;
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      warnOnce(this, 'value:' + raw, `<${this.localName} value="${raw}"> is not a number, so nothing is drawn.`);
      return 0;
    }
    return value;
  }

  /** The max attribute (default 100). It must be a positive number. */
  readMax() {
    const raw = this.getAttribute('max');
    if (raw === null) return 100;
    const max = Number(raw);
    if (!(max > 0)) {
      warnOnce(this, 'max:' + raw, `<${this.localName} max="${raw}"> must be a positive number, so nothing is drawn.`);
      return 0;
    }
    return max;
  }

  getCommonAttributes(element) {
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    const measuredRadius = parseFloat(style.getPropertyValue('r'));
    const orbitRadius = Math.max(0, Number.isFinite(measuredRadius) ? measuredRadius : (element.parentElement?.clientWidth || 0) / 2);
    const orbitNumber = Math.max(.00001, this.readNumber(style, '--o-orbit-number', 1));
    const size = Math.max(0, this.readNumber(style, '--o-size-ratio', 1));
    const strokeWidth = Math.max(0, this.readNumber(style, '--o-stroke-width', 1));
    const shape = element.getAttribute('shape') || 'none';
    
    const arcHeight = Math.max(0, orbitRadius / orbitNumber * size - strokeWidth + 0.3);
    const arcHeightPercentage = orbitRadius > 0 ? Math.min(49.999, arcHeight * 25 / orbitRadius) : 0;
    
    let innerOuter = 0;
    if (element.classList.contains('outer-orbit')) {
      innerOuter = arcHeightPercentage;
    } else if (element.classList.contains('quarter-outer-orbit')) {
      innerOuter = arcHeightPercentage * -0.5;
    } else if (element.classList.contains('inner-orbit')) {
      innerOuter = arcHeightPercentage * -1;
    } else if (element.classList.contains('quarter-inner-orbit')) {
      innerOuter = arcHeightPercentage * 0.5;
    }
    
    const realRadius = 50 + innerOuter;

    return {
      orbitRadius,
      arcHeight,
      realRadius,
      arcAngle: 0, // set by each component
      shape,
      arcHeightPercentage,
      orbitNumber,
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
    const adjustedAngle = angle + (angleOffsetDegrees * Math.PI / 180);
    return {
      x: 50 + adjustedRadius * Math.cos(adjustedAngle),
      y: 50 + adjustedRadius * Math.sin(adjustedAngle)
    };
  }

  calculateCommonArcParameters(arcAngle, radius, arcHeightPercentage, orbitNumber, shape, strokeWidth, arcHeight, gap = 0) {
    const offset = Math.PI / 2;
    const fangle = Math.max(0, Math.min(360, arcAngle)) * Math.PI / 180;
    const bigRadius = radius + arcHeightPercentage;
    const smallRadius = Math.max(.001, radius - arcHeightPercentage);
    const bigGap = Math.min(fangle * .49, (gap + strokeWidth * 1.25) / orbitNumber / bigRadius);
    const smallGap = Math.min(fangle * .49, (gap + strokeWidth * 1.25) / orbitNumber / smallRadius);
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
      case 'rounded': return this.generateRoundedPath(params);
      case 'circle':
      case 'circle-a':
      case 'bullet': return this.generateCirclePath(params, shape);
      case 'circle-b': return this.generateCircleBPath(params);
      case 'arrow': return this.generateArrowPath(params);
      case 'backslash':
      case 'slash': return this.generateSlashPath(params, shape);
      case 'zigzag': return this.generateZigzagPath(params);
      default: return this.generateDefaultPath(params);
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
    let d = '';
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
    // Never let an ending use more than half of the band's length.
    const length = Math.max(0, Math.min(h * factor, span * smallRadius * .49));
    return { h, middle, length, angle: length / middle };
  }

  generateDefaultPath(params) {
    const { bigRadius: R, smallRadius: r, upperAngleStart: uS, upperAngleEnd: uE, innerAngleStart: iS, innerAngleEnd: iE } = params;
    return `M ${this.pt(R, uS)}${this.arcTo(R, uS, uE)} L ${this.pt(r, iE)}${this.arcTo(r, iE, iS)} Z`;
  }

  generateRoundedPath(params) {
    const { bigRadius: R, smallRadius: r, upperAngleStart: uS, upperAngleEnd: uE, innerAngleStart: iS, innerAngleEnd: iE } = params;
    const { length: c } = this.ending(params, .5);
    // Clockwise outline with a corner arc of radius c at each of the four corners.
    const corner = (radius, angle) => ` A ${c},${c} 0 0 1 ${this.pt(radius, angle)}`;
    let d = `M ${this.pt(R, uS + c / R)}${this.arcTo(R, uS + c / R, uE - c / R)}`;
    d += `${corner(R - c, uE)} L ${this.pt(r + c, iE)}${corner(r, iE - c / r)}`;
    d += this.arcTo(r, iE - c / r, iS + c / r);
    d += `${corner(r + c, iS)} L ${this.pt(R - c, uS)}${corner(R, uS + c / R)} Z`;
    return d;
  }

  generateCirclePath(params, shape) {
    // Round caps past both ends; "bullet" hollows the start cap.
    const { bigRadius: R, smallRadius: r, upperAngleStart: uS, upperAngleEnd: uE, innerAngleStart: iS, innerAngleEnd: iE } = params;
    const startSweep = shape === 'bullet' ? 0 : 1;
    let d = `M ${this.pt(R, uS)}${this.arcTo(R, uS, uE)} A 1,1 0 0 1 ${this.pt(r, iE)}`;
    d += `${this.arcTo(r, iE, iS)} A 1,1 0 0 ${startSweep} ${this.pt(R, uS)} Z`;
    return d;
  }

  generateCircleBPath(params) {
    // Round caps that stay inside the band's range.
    const { bigRadius: R, smallRadius: r } = params;
    const { h, angle } = this.ending(params, 1);
    const a0 = params.upperAngleStart + angle;
    const a1 = params.upperAngleEnd - angle;
    let d = `M ${this.pt(R, a0)}${this.arcTo(R, a0, a1)} A ${h},${h} 0 0 1 ${this.pt(r, a1)}`;
    d += `${this.arcTo(r, a1, a0)} A ${h},${h} 0 0 1 ${this.pt(R, a0)} Z`;
    return d;
  }

  generateArrowPath(params) {
    // Pointed end at the value, notched start.
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
    // Parallel slanted ends: "slash" leans forward at the outer edge, "backslash" at the inner one.
    const { bigRadius: R, smallRadius: r } = params;
    const { angle } = this.ending(params, 1);
    const a0 = params.upperAngleStart;
    const a1 = params.upperAngleEnd;
    const [outer0, outer1, inner0, inner1] = shape === 'backslash'
      ? [a0, a1 - angle, a0 + angle, a1]
      : [a0 + angle, a1, a0, a1 - angle];
    return `M ${this.pt(R, outer0)}${this.arcTo(R, outer0, outer1)} L ${this.pt(r, inner1)}${this.arcTo(r, inner1, inner0)} Z`;
  }

  generateZigzagPath(params) {
    // A ribbon: pointed start, notched end.
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
    const extra = Math.max(0, Number(this.getAttribute('hit-width')) || 0);
    this.fitCanvas(attrs, this.hasAttribute('interactive') ? extra : 0);
    if (!this.hasAttribute('interactive') || !(to > from) || !(attrs.orbitRadius > 0)) {
      hit.removeAttribute('d');
      return;
    }
    const radians = degrees => (degrees - 90) * Math.PI / 180;
    hit.setAttribute('d', this.linePath(attrs.realRadius, radians(from), radians(Math.min(to, from + 360))));
    hit.style.strokeWidth = `${attrs.arcHeight + attrs.strokeWidth + 2 * extra}px`;
  }

  /**
   * Grow the SVG canvas past the ring's box so it covers the whole band, its
   * stroke and touch area. Some engines (WebKit) neither paint reliably nor
   * hit-test SVG content that overflows its box.
   */
  fitCanvas(attrs, extra) {
    const svg = this.shadowRoot.querySelector('svg');
    const scale = attrs.orbitRadius / 50;
    if (!svg || !(scale > 0)) return;
    const outer = (attrs.realRadius + attrs.arcHeightPercentage) * scale + attrs.strokeWidth + extra;
    const pad = Math.max(0, Math.ceil(outer - attrs.orbitRadius));
    const units = pad / scale;
    svg.setAttribute('viewBox', `${-units} ${-units} ${100 + 2 * units} ${100 + 2 * units}`);
    svg.style.inset = `${-pad}px`;
  }
}
