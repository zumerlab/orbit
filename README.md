# Orbit CSS Composer

**Orbit** is a CSS framework for building radial UIs — gauges, donuts, knobs, pie menus, dashboards — with **CSS only**. No layout JavaScript. Works with plain HTML and any framework (React, Vue, Svelte).

<p align="center">
  <a href="https://zumerlab.github.io/orbit-docs" target="_blank"><strong>🚀 Live showcase &amp; docs</strong></a>

</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zumer/orbit"><img src="https://img.shields.io/npm/v/@zumer/orbit" alt="npm"></a>
  <a href="https://github.com/zumerlab/orbit/stargazers"><img src="https://img.shields.io/github/stars/zumerlab/orbit" alt="Stars"></a>
</p>

---

## Why Orbit?

Radial UIs usually need JavaScript to compute angles, radii, and positions. **Orbit** handles all of that with CSS classes and a couple of Web Components. Drop in two files and start building.

## Installation

**CDN (fastest):**

```html
<link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@latest/dist/orbit.css">
<script src="https://unpkg.com/@zumer/orbit@latest/dist/orbit.js"></script>
```

**npm:**

```bash
npm install @zumer/orbit
```

```js
import '@zumer/orbit/style'
import '@zumer/orbit'
```

---

## Quick start

Minimal gauge in 10 lines:

```html
<div class="bigbang">
  <div class="gravity-spot">
    <div class="orbit-4">
      <o-progress value="72"></o-progress>
    </div>
  </div>
</div>
```

**Structure:** `bigbang` (container) → `gravity-spot` (center) → `orbit-N` (ring level) → `o-progress` or `o-arc` (the visual element).

---

## Core elements

| Element | Role |
|---------|------|
| `.bigbang` | Root container, sets viewport |
| `.gravity-spot` | Center of the radial layout; holds rings |
| `.orbit-1` … `.orbit-7` | Rings at different radii (1 = innermost) |
| `.satellite` | Item placed on a ring (dot, label, icon) |
| `<o-arc>` | Arc segment (donut slice, gauge needle, menu sector); `value` 0–100, `shape` e.g. `arrow`, `circle-a` |
| `<o-progress>` | Simple progress ring |
| `.vector` | Tick/marker on a ring |
| `.side` | Stretch content along arc |
| `.capsule` | Wrapper for content inside satellite; required when satellite holds more than plain text |

**Structure rules (avoid visual warnings):**
- `.bigbang` → direct children: `.gravity-spot` only
- `.gravity-spot` → direct children: `.orbit`, `.orbit-N`, or `.gravity-spot` only
- `.satellite` → direct children: `.capsule` or `.gravity-spot` (for nesting) only
- `.orbit` / `.orbit-N` → do not nest other orbits; orbits live inside gravity-spot
- `o-arc` and `o-progress` → only work in circular orbits; they are hidden in elliptical shapes

**Useful classes:** `range-180`, `range-270`, `range-360` (arc span); `from-180` (start angle); `fit-range` (distribute items); `shrink-50`, `gap-4` (spacing); `at-center` (place satellite in middle).

---

## Themes

Orbit includes built-in themes. Add the theme class to `.bigbang`:

| Theme | Class | Description |
|-------|-------|-------------|
| **Default** | *(none)* | Transparent borders, gray fills, satellites use `currentColor` |
| **Cyan** | `theme-cyan` | Cyan satellite borders, cyan vectors/sides, light cyan fills for `o-arc` and `o-progress` |
| **Developer** | `dev-orbit` | Dashed red borders on orbits and satellites to visualize structure while debugging |

```html
<!-- Default (no class) -->
<div class="bigbang">...</div>

<!-- Cyan theme -->
<div class="bigbang theme-cyan">...</div>

<!-- Developer mode for layout debugging -->
<div class="bigbang dev-orbit">...</div>
```

You can combine themes, e.g. `class="bigbang theme-cyan dev-orbit"`.

---

## Visual aids & development

Orbit provides **CSS visual warnings** to catch invalid structure. When rules are broken (e.g. wrong children in `gravity-spot` or `satellite`), Orbit shows a red dotted border, grays out content, and displays a ⚠️ icon.

Add **`class="dev-orbit"`** to your root container to enable **developer mode**: dashed red borders on `gravity-spot`, `orbit`, and `satellite` to visualize the layout structure. Useful for debugging.

```html
<div class="bigbang dev-orbit">
  <div class="gravity-spot">
    ...
  </div>
</div>
```

Orbit also checks browser support for `:has()` and trigonometric CSS functions (`cos`, `sin`); unsupported browsers show an upgrade message. See [CSS visual aids](https://zumerlab.github.io/orbit-docs/tools/support) in the full docs.

---

## Examples

Browse examples on the [Orbit docs site](https://zumerlab.github.io/orbit-docs):

| Example | Link |
|---------|------|
| Circular timer | [circular_time](https://zumerlab.github.io/orbit-docs/examples/circular_time/) |
| Progress bars | [progress](https://zumerlab.github.io/orbit-docs/examples/progress/) |
| Charts (donut, pie, sunburst) | [charts](https://zumerlab.github.io/orbit-docs/examples/charts/) |
| Gauges (180°, 240°, fuel) | [gauges](https://zumerlab.github.io/orbit-docs/examples/gauges/) |
| Knobs | [knobs](https://zumerlab.github.io/orbit-docs/examples/knobs/) |
| Pie menus | [piemenu](https://zumerlab.github.io/orbit-docs/examples/piemenu/) |
| Watch faces | [watches](https://zumerlab.github.io/orbit-docs/examples/watches/) |
| Chemical structures | [chemical_structures](https://zumerlab.github.io/orbit-docs/examples/chemical_structures/) |
| Calendars & time planners | [calendar](https://zumerlab.github.io/orbit-docs/examples/calendar/) |
| Mandalas | [mandalas](https://zumerlab.github.io/orbit-docs/examples/mandalas/) |
| Dashboard | [dashboard](https://zumerlab.github.io/orbit-docs/examples/dashboard/) |
| Abstract orbital map | [abstract_map](https://zumerlab.github.io/orbit-docs/examples/abstract_map/) |

---

## Use cases

- **Dashboards:** gauges, status rings, KPIs  
- **Automotive / HUD:** speedometers, tachometers, battery, temp  
- **IoT / Smart home:** thermostats, energy rings, scenes  
- **Ops / monitoring:** status rings, uptime gauges  
- **Fitness / health:** activity rings (Move, Exercise, Stand)  
- **Controls:** knobs, radial menus, compass  

---

## Resources

- [Full documentation](https://zumerlab.github.io/orbit-docs) — elements, tools, advanced examples  
- [Contributing](CONTRIBUTING.md)  
- [GitHub Discussions](https://github.com/zumerlab/orbit/discussions)  
- [Telegram](https://t.me/ZumlyCommunity)  

---

## License

[MIT](LICENSE)
