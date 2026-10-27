/**
 * Color helpers for the kit: parsing, HSV/HSL/RGB conversions, contrast and
 * plain-English names. Pure functions, safe in Node; named CSS colors are
 * resolved through a canvas when there is a document.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (n, digits = 0) => Number(Number(n).toFixed(digits));
const hex2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');

/** { r, g, b } (0-255) → "#rrggbb". */
export const rgbToHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

/** h 0-360, s and v 0-1 → { r, g, b } 0-255. */
export function hsvToRgb({ h, s, v }) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return { r: f(5), g: f(3), b: f(1) };
}

/** { r, g, b } 0-255 → { h, s, v }, h 0-360 (0 for grays), s and v 0-1. */
export function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

/** { h, s, v } → { h, s, l }, all but h 0-1. */
export function hsvToHsl({ h, s, v }) {
  const l = v * (1 - s / 2);
  return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l };
}

/** { h, s, l } → { h, s, v }. */
export function hslToHsv({ h, s, l }) {
  const v = l + s * Math.min(l, 1 - l);
  return { h, s: v ? 2 * (1 - l / v) : 0, v };
}

let probe;
/** A named or any other CSS color, through the browser; null when there is none. */
function browserColor(text) {
  if (typeof document === 'undefined' || !document.createElement) return null;
  try {
    probe ??= document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.fillStyle = '#010203';
    probe.fillStyle = text;
    const out = probe.fillStyle;
    if (out === '#010203' && !/^#?010203$/i.test(text.trim())) return null;
    return out.startsWith('#') ? out : null;
  } catch { return null; }
}

const num = (part, scale) => {
  const text = String(part).trim();
  if (text.endsWith('%')) return Number.parseFloat(text) / 100 * scale;
  return Number.parseFloat(text);
};

/**
 * A CSS color → { r, g, b } (0-255), or null. Reads #rgb, #rrggbb (alpha is
 * ignored), rgb()/rgba(), hsl()/hsla() and, in a browser, any named color.
 */
export function parseColor(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  let m = text.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let hex = m[1];
    if (hex.length <= 4) hex = hex.slice(0, 3).split('').map((c) => c + c).join('');
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }
  m = text.match(/^(rgba?|hsla?)\(([^)]*)\)$/);
  if (m) {
    const parts = m[2].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (m[1].startsWith('rgb')) {
      const [r, g, b] = parts.slice(0, 3).map((p) => num(p, 255));
      return [r, g, b].every(Number.isFinite) ? { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) } : null;
    }
    const h = Number.parseFloat(parts[0]), s = num(parts[1], 1), l = num(parts[2], 1);
    const S = parts[1].endsWith('%') ? s : s / 100, L = parts[2].endsWith('%') ? l : l / 100;
    if (![h, S, L].every(Number.isFinite)) return null;
    return hsvToRgb(hslToHsv({ h: ((h % 360) + 360) % 360, s: clamp(S, 0, 1), l: clamp(L, 0, 1) }));
  }
  const resolved = browserColor(text);
  return resolved ? parseColor(resolved) : null;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance({ r, g, b }) {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Dark or light text, whichever reads better on `color`. */
export function contrastText(color, dark = '#0c0f13', light = '#ffffff') {
  const rgb = typeof color === 'string' ? parseColor(color) : color;
  if (!rgb) return light;
  const L = luminance(rgb);
  // Contrast against near-black (#0c0f13, L≈.005) versus white.
  return (L + 0.05) / 0.055 >= 1.05 / (L + 0.05) ? dark : light;
}

const HUES = [
  [15, 'red'], [40, 'orange'], [64, 'yellow'], [80, 'lime'], [150, 'green'], [178, 'teal'],
  [200, 'cyan'], [242, 'blue'], [270, 'indigo'], [292, 'purple'], [325, 'magenta'], [345, 'pink'], [360, 'red']
];

/** A short plain-English name: "dark blue", "light gray", "orange", "brown". */
export function colorName(color) {
  const rgb = typeof color === 'string' ? parseColor(color) : color;
  if (!rgb) return '';
  const { h, s, l } = hsvToHsl(rgbToHsv(rgb));
  if (l < 0.07) return 'black';
  if (l > 0.96) return 'white';
  if (s < 0.1 || (s < 0.2 && (l < 0.2 || l > 0.85))) return l < 0.3 ? 'dark gray' : l > 0.72 ? 'light gray' : 'gray';
  let hue = HUES.find(([end]) => h < end)?.[1] || 'red';
  if ((hue === 'orange' || hue === 'red' || hue === 'yellow') && l < 0.4 && h >= 8 && h < 50) hue = 'brown';
  else if (hue === 'red' && l > 0.7) return 'pink';
  if (hue === 'brown') return l < 0.18 ? 'dark brown' : 'brown';
  const tone = l < 0.36 ? 'dark ' : l > 0.78 ? 'light ' : s < 0.35 ? 'muted ' : (s > 0.85 && l > 0.4 && l < 0.6 ? 'vivid ' : '');
  return tone + hue;
}

/** "#1e90ff", "rgb(30, 144, 255)" or "hsl(210, 100%, 56%)". */
export function formatColor(rgb, format = 'hex') {
  if (format === 'rgb') return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
  if (format === 'hsl') {
    const { h, s, l } = hsvToHsl(rgbToHsv(rgb));
    return `hsl(${round(h) % 360}, ${round(s * 100)}%, ${round(l * 100)}%)`;
  }
  return rgbToHex(rgb);
}
