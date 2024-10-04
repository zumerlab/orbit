import { OrbitProgress } from './js/orbit-progress.js'
import { OrbitArc } from './js/orbit-arc.js'
import { OrbitText } from './js/orbit-text.js'
import { Orbit } from './js/orbit-resize.js'

customElements.define('o-progress', OrbitProgress)
customElements.define('o-arc', OrbitArc)
customElements.define('o-text', OrbitText)

window.Orbit = Orbit
