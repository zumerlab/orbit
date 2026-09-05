# Orbit

**Orbit** builds radial UIs — gauges, donuts, knobs, pie menus, dashboards — with **CSS geometry and a small JavaScript runtime**. CSS controls presentation; JavaScript keeps ring indices, spacing and SVG paths in sync as the interface changes. Use it with plain HTML or frameworks such as React, Vue and Svelte.

<p align="center">
  <a href="https://zumerlab.github.io/orbit-docs" target="_blank"><strong>🚀 Live showcase &amp; docs</strong></a>

</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zumer/orbit"><img src="https://img.shields.io/npm/v/@zumer/orbit" alt="npm"></a>
  <a href="https://github.com/zumerlab/orbit/stargazers"><img src="https://img.shields.io/github/stars/zumerlab/orbit" alt="Stars"></a>
</p>

---

## Why Orbit?

Orbit provides reusable radial layout primitives, CSS custom properties and Web Components for arcs and progress rings. Load the stylesheet and script, then compose an interface with HTML classes. The runtime updates added, removed and reordered elements, ancestor style changes and container resizes.

> **Want ready-made components?** [**orbit-kit**](https://zumerlab.com/orbit-kit) wraps the common Orbit patterns into one-line custom elements — gauges, charts, activity rings, knobs, pie menus, cockpit instruments, analog clocks, compasses and radars.

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

The npm import resolves to an ES module. Importing it during server rendering is safe; registration and layout observation start when the module runs in a browser. Render the markup on the server and include the JavaScript in your client entrypoint to activate it.

The module also exports `Orbit`, `OrbitArc`, `OrbitProgress` and `registerOrbit`:

```js
import { Orbit } from '@zumer/orbit'

// Run after the container mounts. Dispose the observer when it unmounts.
const stopResizing = Orbit.resize('#instrument-panel')
// Later: stopResizing()

// After changing stylesheet rules through CSSOM, refresh the affected subtree.
Orbit.refresh(document.querySelector('#instrument-panel'))
```

`Orbit.resize` accepts a selector or an element. `Orbit.refresh(root)` accepts a document, element or shadow root, defaults to the document and updates layout synchronously. DOM, attribute and resize changes within a layout or its ancestors are observed automatically and batched for the next animation frame; use `refresh` when immediate results are needed. Repeated calls to `registerOrbit()` are safe. The classic CDN script exposes the same `Orbit` API as `window.Orbit`.

Arcs and progress elements also register layouts inside open or closed shadow roots. Include the Orbit stylesheet inside each shadow root; host and ancestor style changes then refresh its SVGs. For a shadow tree containing only CSS elements, call `Orbit.refresh(shadowRoot)` to register it explicitly. Removing a shadow host releases its observers; reconnecting its components restores them.

Changes made through CSSOM, or selectors driven by external siblings and control states (such as `:checked`), may affect a chart without mutating the layout or an ancestor. Call `Orbit.refresh(chart)` after those changes. Orbit does not infer arbitrary CSS dependencies across unrelated elements.

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
| `.orbit` / `.orbit-N` | Automatically numbered rings, or an explicit nonnegative integer ring level (1 = innermost) |
| `.satellite` | Item placed on a ring (dot, label, icon) |
| `<o-arc>` | Arc segment (donut slice, gauge needle, menu sector); `value` 0–100, `shape` e.g. `arrow`, `circle-a` |
| `<o-progress>` | Simple progress ring |
| `.vector` | Tick/marker on a ring |
| `.side` | Stretch content along arc |
| `.capsule` | Wrapper for content inside satellite; required when satellite holds more than plain text |

**Structure rules:**

- `.bigbang` → direct children: `.gravity-spot` only
- `.gravity-spot` → direct children: `.orbit`, `.orbit-N`, or `.gravity-spot` only
- `.satellite` → direct children: `.capsule` or `.gravity-spot` (for nesting) only
- `.orbit` / `.orbit-N` → do not nest other orbits; orbits live inside gravity-spot
- `o-arc` and `o-progress` → only work in circular orbits; they are hidden in elliptical shapes

**Useful classes:** `range-180`, `range-270`, `range-360` (arc span); `from-180` (start angle); `fit-range` (distribute items); `shrink-50`, `gap-4` (spacing); `at-center` (place satellite in middle).

The runtime supports ring levels and child counts beyond the static CSS fallback's 24 levels and 60 children per type. Without JavaScript, that fallback can position simple CSS elements in browsers supporting `:has()` and `:nth-child(... of ...)`; `<o-arc>` and `<o-progress>` require JavaScript. Ring classes are matched as complete tokens, so application classes such as `orbit-card` do not become rings.

Use public custom properties such as `--o-range`, `--o-from`, `--o-orbit-number` and `--o-orbit-child-number` for overrides. The runtime owns `data-orbit-ring`, `--o-layout-*` and `--o-arc-start`; leave these internal values to Orbit.

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

Orbit provides **opt-in CSS visual warnings** to catch invalid structure. Inside a `dev-orbit` container, invalid children show a dotted border, dimmed content and a ⚠️ icon. These diagnostics require `:has()` and respect reduced-motion preferences.

Add **`class="dev-orbit"`** to your root container to enable **developer mode**: dashed red borders on `gravity-spot`, `orbit`, and `satellite` to visualize the layout structure. Useful for debugging.

```html
<div class="bigbang dev-orbit">
  <div class="gravity-spot">
    ...
  </div>
</div>
```

CSS trigonometric functions (`cos`, `sin`) are required for geometry; unsupported browsers show an upgrade message. Missing `:has()` support does not block the JavaScript layout runtime. See [CSS visual aids](https://zumerlab.github.io/orbit-docs/tools/support) in the full docs.

## Building and testing

```sh
npm ci
npx playwright install chromium
npm test
npm run build
```

`npm test` compiles the package, tests its published file list and server imports, then runs browser and shadow-root regressions in Chromium. Set `BROWSERS=chromium,firefox,webkit` to run all three engines after installing them with Playwright; CI runs this matrix. Use `npm run test:package`, `npm run test:browser` or `npm run test:shadow` for an individual suite. The shadow suite builds in memory so it can also check source changes independently of `dist`.

`npm run build` compiles CSS, classic browser scripts and the ES module, then creates an npm tarball. It does not commit, tag, push or publish; release operations are separate.

---

## Examples

Run the core playground against your local checkout:

```sh
npm run demo
```

Open **http://127.0.0.1:5174**. The command compiles the current source and serves the interactive playground and existing examples using that local build. Use `PORT=5175 npm run demo` to choose another port; stop the server with Ctrl+C.

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

## Using Orbit with AI / LLMs

Orbit's radial model is unlike the box-flow layouts most models were trained on,
so an assistant generating Orbit markup from scratch will struggle. Give it the
reference first — these files are written for that purpose:

- **[llms.txt](https://zumerlab.github.io/orbit-docs/llms.txt)** — concise overview, structure rules, quick recipes.
- **[llms-full.txt](https://zumerlab.github.io/orbit-docs/llms-full.txt)** — complete reference: every class, custom property, web component, and copy-paste pattern.

Paste the relevant one into your prompt (or your tool's context/rules) before
asking the model to build a radial UI.

## Resources

- [orbit-kit](https://zumerlab.com/orbit-kit) — ready-made radial components built on Orbit  
- [Full documentation](https://zumerlab.github.io/orbit-docs) — elements, tools, advanced examples  
- [Contributing](CONTRIBUTING.md)  
- [GitHub Discussions](https://github.com/zumerlab/orbit/discussions)  
- [Telegram](https://t.me/ZumlyCommunity)  

---

## License

[MIT](LICENSE)
