import { cssNumber, requestLayout } from './orbit-layout.js';

export class OrbitBase extends (globalThis.HTMLElement || class {}) {
  constructor() {
    super();
  }

  connectedCallback() {
    requestLayout(this);
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
      arcAngle: 0, // Se sobrescribe en cada componente
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

  getControlPoint(x, y, x1, y1, direction = "clockwise") {
    const xm = (x + x1) / 2;
    const ym = (y + y1) / 2;
    const dx = x1 - x;
    const dy = y1 - y;

    if (direction === "clockwise") {
      return {
        xc: xm + dy * 0.4,
        yc: ym - dx * 0.4
      };
    }
    
    return {
      xc: xm - dy * 0.4,
      yc: ym + dx * 0.4
    };
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
    const fangle = Math.max(0, Math.min(359.999999, arcAngle)) * Math.PI / 180;
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

    // SVG large-arc flags, derived from the angle each arc ACTUALLY spans.
    // The endpoints are pulled inward by the stroke gap, which is a constant
    // arc-LENGTH and therefore subtends a larger angle at the smaller radius
    // (smallGap > bigGap). So the outer and inner arcs span slightly different
    // angles and, straddling 180°, can need DIFFERENT flags. A single shared
    // flag leaves a thin window where one of the two arcs renders its reflex
    // side — visible e.g. animating a 270° gauge through ~67%. Compute one flag
    // per arc from its own swept angle.
    const upperSweep = upperAngleEnd - upperAngleStart; // fangle - 2*bigGap
    const innerSweep = innerAngleEnd - innerAngleStart; // fangle - 2*smallGap
    const largeArcFlagUpper = upperSweep > Math.PI ? 1 : 0;
    const largeArcFlagInner = innerSweep > Math.PI ? 1 : 0;

    return {
      upperArcStart,
      upperArcEnd,
      innerArcStart,
      innerArcEnd,
      largeArcFlag: largeArcFlagUpper, // back-compat alias; prefer the two below
      largeArcFlagUpper,
      largeArcFlagInner,
      bigRadius,
      smallRadius,
      radius,
      upperAngleStart,
      upperAngleEnd,
      innerAngleStart,
      innerAngleEnd
    };
  }

  generatePathData(shape, params, arcHeight, orbitNumber) {
    let d = '';
    
    switch (shape) {
      case "rounded":
        d = this.generateRoundedPath(params, arcHeight, orbitNumber);
        break;
      case "circle":
      case "circle-a":
      case "bullet":
        d = this.generateCirclePath(params, shape);
        break;
      case "circle-b":
        d = this.generateCircleBPath(params, arcHeight, orbitNumber);
        break;
      case "arrow":
        d = this.generateArrowPath(params, orbitNumber);
        break;
      case "backslash":
      case "slash":
        d = this.generateSlashPath(params, shape, orbitNumber);
        break;
      case "zigzag":
        d = this.generateZigzagPath(params, arcHeight, orbitNumber);
        break;
      default:
        d = this.generateDefaultPath(params);
    }
    
    return d;
  }

  generateRoundedPath(params, arcHeight, orbitNumber) {
    const { bigRadius, smallRadius } = params;
    const available = Math.min(params.upperAngleEnd - params.upperAngleStart, params.innerAngleEnd - params.innerAngleStart);
    const curve = Math.min(arcHeight < 5 ? 2.5 : arcHeight < 10 ? 5 : 10, available * 180 / Math.PI * orbitNumber * .49);

    // The rounded caps inset the arc endpoints by an extra curve/orbitNumber
    // degrees per side, so the drawn arc spans less than the bare gap arc. The
    // shared large-arc flags don't account for that, leaving a window around
    // 180° where the cap-inset span is <180° but the flag says "long way",
    // rendering the reflex arc (visible ~v=69 on a 270° gauge). Derive the
    // flags from the actual cap-inset endpoints instead.
    const capRad = (curve / orbitNumber) * Math.PI / 180;
    const flagU = (params.upperAngleEnd - params.upperAngleStart) - 2 * capRad > Math.PI ? 1 : 0;
    const flagI = (params.innerAngleEnd - params.innerAngleStart) - 2 * capRad > Math.PI ? 1 : 0;

    const newUpperStart = this.arcPoint(bigRadius, params.upperAngleStart, 0, curve / orbitNumber);
    const newUpperEnd = this.arcPoint(bigRadius, params.upperAngleEnd, 0, -curve / orbitNumber);
    const newInnerStart = this.arcPoint(smallRadius, params.innerAngleStart, 0, curve / orbitNumber);
    const newInnerEnd = this.arcPoint(smallRadius, params.innerAngleEnd, 0, -curve / orbitNumber);

    const upperPointStart = this.arcPoint(bigRadius, params.upperAngleStart, -(curve / 2) / orbitNumber, 0);
    const upperPointEnd = this.arcPoint(bigRadius, params.upperAngleEnd, -(curve / 2) / orbitNumber, 0);
    const innerPointStart = this.arcPoint(smallRadius, params.innerAngleStart, (curve / 2) / orbitNumber, 0);
    const innerPointEnd = this.arcPoint(smallRadius, params.innerAngleEnd, (curve / 2) / orbitNumber, 0);

    const Q = this.getControlPoint(newUpperEnd.x, newUpperEnd.y, upperPointEnd.x, upperPointEnd.y);
    const Q1 = this.getControlPoint(innerPointEnd.x, innerPointEnd.y, newInnerEnd.x, newInnerEnd.y);
    const Q2 = this.getControlPoint(newInnerStart.x, newInnerStart.y, innerPointStart.x, innerPointStart.y);
    const Q3 = this.getControlPoint(upperPointStart.x, upperPointStart.y, newUpperStart.x, newUpperStart.y);

    let d = `M ${newUpperStart.x},${newUpperStart.y} A ${bigRadius},${bigRadius} 0 ${flagU} 1 ${newUpperEnd.x},${newUpperEnd.y}`;
    d += `Q ${Q.xc},${Q.yc} ${upperPointEnd.x},${upperPointEnd.y} L ${innerPointEnd.x},${innerPointEnd.y}`;
    d += `Q ${Q1.xc},${Q1.yc} ${newInnerEnd.x},${newInnerEnd.y}`;
    d += `A ${smallRadius},${smallRadius} 0 ${flagI} 0 ${newInnerStart.x},${newInnerStart.y}`;
    d += `Q ${Q2.xc},${Q2.yc} ${innerPointStart.x},${innerPointStart.y} L ${upperPointStart.x},${upperPointStart.y}`;
    d += ` Q ${Q3.xc},${Q3.yc} ${newUpperStart.x},${newUpperStart.y}`;
    d += ` Z`;
    
    return d;
  }

  // Dentro de la clase OrbitCommon en orbit-common.js

generateCirclePath(params, shape) {
  const { upperArcStart, upperArcEnd, innerArcStart, innerArcEnd, bigRadius, smallRadius, largeArcFlagUpper, largeArcFlagInner } = params;

  let d = `M ${upperArcStart.x},${upperArcStart.y} A ${bigRadius},${bigRadius} 0 ${largeArcFlagUpper} 1 ${upperArcEnd.x},${upperArcEnd.y}`;
  d += ` A 1,1 0 0 1 ${innerArcEnd.x},${innerArcEnd.y} `;
  d += ` A ${smallRadius},${smallRadius} 0 ${largeArcFlagInner} 0 ${innerArcStart.x},${innerArcStart.y}`;
  d += ` A 1,1 0 0 ${shape === "circle" || shape === "circle-a" ? 1 : 0} ${upperArcStart.x},${upperArcStart.y} `;
  d += ` Z`;
  
  return d;
}

generateCircleBPath(params, arcHeight, orbitNumber) {
  const { upperAngleStart, upperAngleEnd, innerAngleStart, innerAngleEnd, bigRadius, smallRadius } = params;
  const available = Math.min(upperAngleEnd - upperAngleStart, innerAngleEnd - innerAngleStart);
  const segment = Math.min(arcHeight * 1.36, available * 180 / Math.PI * orbitNumber * .49);

  // Like rounded, circle-b insets its arc endpoints (by segment/orbitNumber
  // degrees per side), so its large-arc flags must come from those endpoints.
  const capRad = (segment / orbitNumber) * Math.PI / 180;
  const flagU = (upperAngleEnd - upperAngleStart) - 2 * capRad > Math.PI ? 1 : 0;
  const flagI = (innerAngleEnd - innerAngleStart) - 2 * capRad > Math.PI ? 1 : 0;

  const newUpperStart = this.arcPoint(bigRadius, upperAngleStart, 0, segment / orbitNumber);
  const newUpperEnd = this.arcPoint(bigRadius, upperAngleEnd, 0, -segment / orbitNumber);
  const newInnerStart = this.arcPoint(smallRadius, innerAngleStart, 0, segment / orbitNumber);
  const newInnerEnd = this.arcPoint(smallRadius, innerAngleEnd, 0, -segment / orbitNumber);

  let d = `M ${newUpperStart.x},${newUpperStart.y} A ${bigRadius},${bigRadius} 0 ${flagU} 1 ${newUpperEnd.x},${newUpperEnd.y}`;
  d += ` A 1,1 0 0 1 ${newInnerEnd.x},${newInnerEnd.y} `;
  d += ` A ${smallRadius},${smallRadius} 0 ${flagI} 0 ${newInnerStart.x},${newInnerStart.y}`;
  d += ` A 1,1 0 0 1 ${newUpperStart.x},${newUpperStart.y} `;
  d += ` Z`;
  
  return d;
}

generateArrowPath(params, orbitNumber) {
  const { upperArcStart, upperArcEnd, innerArcStart, innerArcEnd, bigRadius, smallRadius, largeArcFlagUpper, largeArcFlagInner, radius } = params;

  const middleEnd = this.arcPoint(radius, params.upperAngleEnd, 0, 24 / orbitNumber / 2);
  const middleStart = this.arcPoint(radius, params.upperAngleStart, 0, 24 / orbitNumber / 2);

  let d = `M ${upperArcStart.x},${upperArcStart.y} A ${bigRadius},${bigRadius} 0 ${largeArcFlagUpper} 1 ${upperArcEnd.x},${upperArcEnd.y}`;
  d += `L ${middleEnd.x} ${middleEnd.y}`;
  d += `L ${innerArcEnd.x} ${innerArcEnd.y}`;
  d += `A ${smallRadius},${smallRadius} 0 ${largeArcFlagInner} 0 ${innerArcStart.x}, ${innerArcStart.y}`;
  d += `L ${middleStart.x} ${middleStart.y}`;
  d += `Z`;
  
  return d;
}

generateSlashPath(params, shape, orbitNumber) {
  const { upperAngleStart, upperAngleEnd, innerAngleStart, innerAngleEnd, bigRadius, smallRadius, largeArcFlagUpper, largeArcFlagInner } = params;

  const newUpperStart = this.arcPoint(bigRadius, upperAngleStart, 0, shape === "backslash" ? 0 : 24 / orbitNumber / 2);
  const newUpperEnd = this.arcPoint(bigRadius, upperAngleEnd, 0, shape === "backslash" ? 0 : 24 / orbitNumber / 2);
  const newInnerStart = this.arcPoint(smallRadius, innerAngleStart, 0, shape === "backslash" ? 24 / orbitNumber / 2 : 0);
  const newInnerEnd = this.arcPoint(smallRadius, innerAngleEnd, 0, shape === "backslash" ? 24 / orbitNumber / 2 : 0);

  let d = `M ${newUpperStart.x},${newUpperStart.y} A ${bigRadius},${bigRadius} 0 ${largeArcFlagUpper} 1 ${newUpperEnd.x},${newUpperEnd.y}`;
  d += `L ${newInnerEnd.x} ${newInnerEnd.y}`;
  d += `A ${smallRadius},${smallRadius} 0 ${largeArcFlagInner} 0 ${newInnerStart.x}, ${newInnerStart.y}`;
  d += `Z`;
  
  return d;
}

generateZigzagPath(params, arcHeight, orbitNumber) {
  const { upperArcStart, upperArcEnd, innerArcStart, innerArcEnd, bigRadius, smallRadius, largeArcFlagUpper, largeArcFlagInner, radius } = params;
  
  const h2 = arcHeight / orbitNumber / 2;
  const s2 = this.arcPoint(radius, params.upperAngleStart, -h2, 3);
  const s3 = this.arcPoint(radius, params.upperAngleStart, 0, 0);
  const s4 = this.arcPoint(radius, params.upperAngleStart, h2, 3);
  const e2 = this.arcPoint(radius, params.innerAngleEnd, h2, 3);
  const e3 = this.arcPoint(radius, params.innerAngleEnd, 0, 0);
  const e4 = this.arcPoint(radius, params.innerAngleEnd, -h2, 3);

  let d = `M ${upperArcStart.x},${upperArcStart.y} A ${bigRadius},${bigRadius} 0 ${largeArcFlagUpper} 1 ${upperArcEnd.x},${upperArcEnd.y}`;
  d += `L ${e2.x} ${e2.y}`;
  d += `L ${e3.x} ${e3.y}`;
  d += `L ${e4.x} ${e4.y}`;
  d += `L ${innerArcEnd.x} ${innerArcEnd.y}`;
  d += `A ${smallRadius},${smallRadius} 0 ${largeArcFlagInner} 0 ${innerArcStart.x}, ${innerArcStart.y}`;
  d += `L ${s2.x} ${s2.y}`;
  d += `L ${s3.x} ${s3.y}`;
  d += `L ${s4.x} ${s4.y}`;
  d += `Z`;
  
  return d;
}

generateDefaultPath(params) {
  const { upperArcStart, upperArcEnd, innerArcStart, innerArcEnd, bigRadius, smallRadius, largeArcFlagUpper, largeArcFlagInner } = params;

  let d = `M ${upperArcStart.x},${upperArcStart.y} A ${bigRadius},${bigRadius} 0 ${largeArcFlagUpper} 1 ${upperArcEnd.x},${upperArcEnd.y}`;
  d += `L ${innerArcEnd.x} ${innerArcEnd.y}`;
  d += `A ${smallRadius},${smallRadius} 0 ${largeArcFlagInner} 0 ${innerArcStart.x}, ${innerArcStart.y}`;
  d += `Z`;
  
  return d;
}
}
