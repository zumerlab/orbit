import { OrbitProgress } from './js/orbit-progress.js'
import { OrbitArc } from './js/orbit-arc.js'
import { Orbit } from './js/orbit-resize.js'
import { requestLayout } from './js/orbit-layout.js'
import { registerProperties } from './js/orbit-properties.js'

export { OrbitProgress, OrbitArc, Orbit }

export function registerOrbit() {
  if (typeof customElements === 'undefined' || typeof document === 'undefined') return
  // @property in a stylesheet inside a shadow root registers nothing: do it here.
  registerProperties(window)
  if (!customElements.get('o-progress')) customElements.define('o-progress', OrbitProgress)
  if (!customElements.get('o-arc')) customElements.define('o-arc', OrbitArc)
  requestLayout(document)
  window.Orbit = Orbit
}

registerOrbit()
