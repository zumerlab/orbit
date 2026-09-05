import { OrbitProgress } from './js/orbit-progress.js'
import { OrbitArc } from './js/orbit-arc.js'
import { Orbit } from './js/orbit-resize.js'
import { requestLayout } from './js/orbit-layout.js'

export { OrbitProgress, OrbitArc, Orbit }

export function registerOrbit() {
  if (typeof customElements === 'undefined' || typeof document === 'undefined') return
  if (!customElements.get('o-progress')) customElements.define('o-progress', OrbitProgress)
  if (!customElements.get('o-arc')) customElements.define('o-arc', OrbitArc)
  requestLayout(document)
  window.Orbit = Orbit
}

registerOrbit()
