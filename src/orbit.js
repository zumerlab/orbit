import { OrbitProgress } from './js/orbit-progress.js'
import { OrbitSector } from './js/orbit-sector.js'
import { OrbitLabel } from './js/orbit-label.js'
import { Orbit } from './js/orbit-resize.js'

customElements.define('o-progress', OrbitProgress)
customElements.define('o-sector', OrbitSector)
customElements.define('o-label', OrbitLabel)

window.Orbit = Orbit