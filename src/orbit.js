import { OrbitProgress } from './js/orbit-progress.js'
import { OrbitSlice } from './js/orbit-slice.js'
import { OrbitText } from './js/orbit-text.js'
import { Orbit } from './js/orbit-resize.js'

customElements.define('o-progress', OrbitProgress)
customElements.define('o-arc', OrbitSlice)
customElements.define('o-text', OrbitText)

window.Orbit = Orbit