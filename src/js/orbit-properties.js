// The custom properties Orbit registers, the same five as dist/orbit-properties.css
// (built from src/scss/_properties.scss; keep both lists equal, a test checks).
// A stylesheet inside a shadow root registers nothing with @property, so the
// runtime registers them on the window as well. Whichever comes first wins,
// and both say the same.
export const ORBIT_PROPERTIES = [
  { name: '--o-dir-x', syntax: '<number>', inherits: true, initialValue: '0' },
  { name: '--o-dir-y', syntax: '<number>', inherits: true, initialValue: '0' },
  { name: '--o-value-angle', syntax: '<angle>', inherits: true, initialValue: '0deg' },
  { name: '--o-ellipse-x', syntax: '<number>', inherits: true, initialValue: '1' },
  { name: '--o-ellipse-y', syntax: '<number>', inherits: true, initialValue: '1' },
];

const REGISTERED = Symbol.for('zumer.orbit.properties.v1');

/** Register Orbit's custom properties on a window, once. */
export function registerProperties(view = globalThis) {
  const css = view?.CSS;
  if (!css?.registerProperty || view[REGISTERED]) return;
  Object.defineProperty(view, REGISTERED, { value: true, configurable: true });
  for (const property of ORBIT_PROPERTIES) {
    try {
      css.registerProperty(property);
    } catch (e) { /* already registered, by @property in the page or by an earlier bundle */ }
  }
}
