# Orbit

Orbit arranges HTML elements around a center. Use it to build radial menus, charts, gauges and other circular interfaces.

CSS controls geometry and appearance. A small JavaScript runtime updates the layout and draws arcs when elements, styles or values change. Orbit works with plain HTML, React, Vue and Svelte.

[Examples and documentation](https://zumerlab.github.io/orbit-docs/) · [npm](https://www.npmjs.com/package/@zumer/orbit)

## Install

```sh
npm install @zumer/orbit
```

Import the stylesheet and runtime in your app's client entrypoint:

```js
import '@zumer/orbit/style'
import '@zumer/orbit'
```

For a plain HTML page, load the files from a CDN as shown below.

## A progress ring

Save this as `index.html` and open it in a browser. It draws a ring at 72% that fills its 240px box.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orbit progress ring</title>
  <link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@2.0.0/dist/orbit.min.css">
  <script defer src="https://unpkg.com/@zumer/orbit@2.0.0/dist/orbit.min.js"></script>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; }
    .gauge { width: 240px; }
    .gauge o-progress { --o-fill: #3da9fc; --o-back-fill: #1d3749; --o-stroke: none; }
  </style>
</head>
<body>
  <div class="gauge bigbang">
    <div class="gravity-spot">
      <div class="orbit-10" style="--o-size-ratio: 2">
        <o-progress value="72" shape="rounded" role="progressbar"
          aria-label="Upload progress" aria-valuenow="72"
          aria-valuemin="0" aria-valuemax="100"></o-progress>
      </div>
    </div>
  </div>
</body>
</html>
```

Change the `value` attribute to update the ring. Keep any labels or ARIA values you add in sync with it:

```js
const progress = document.querySelector('o-progress')
progress.setAttribute('value', '40')
progress.setAttribute('aria-valuenow', '40')
```

The runtime redraws the ring automatically. A value of `0` leaves only the background; `100` fills the orbit's range. Change the width of `.gauge` and the ring follows it.

## The model

Orbit borrows its names from a solar system. Each name says what the element does:

| Element | In the metaphor | What it does |
| --- | --- | --- |
| `.bigbang` | The universe | Its box is the space. Square by default: it takes its parent's width, and a parent with a height caps it. |
| `.gravity-spot` | The center of mass | Where the system starts. Its `--o-force` is the **reach** of gravity: the diameter of `orbit-12`. By default it is the shorter side of the universe. |
| `.orbit-N` | A lane | The radius is split into 12 lanes. `orbit-N` runs N lanes from the center; `.orbit-0` is the center itself, and `orbit-13` to `orbit-24` lie past the edge. `.orbit` without a number takes the next lane in DOM order. |
| `.satellite` | A world on its lane | Positions an item on a ring. It is also a universe: a `.gravity-spot` inside it reaches the satellite's edge. |
| `.capsule` | What a world carries | Wraps the content of a satellite and keeps it upright. |
| `.vector` | A ray | A tick or line on a ring, pointing out from the center. |
| `.side` | A chord | A straight line between neighboring positions on a ring. |
| `<o-arc>` | An arc of the lane | Draws a segment. Without `value`, sibling arcs split the range; with `value`, they stack in HTML order. Text inside is drawn along the arc. |
| `<o-progress>` | A filled lane | Draws a progress value over a background track. |

So the size of a layout is set in one place: the box of its `.bigbang`. Everything else is a fraction of it.

- Elements on a ring are **one lane thick**: a twelfth of the radius. Set `--o-size-ratio` on the ring (or the whole `.gravity-spot`) to make them thicker or thinner; satellites, ticks and arcs all follow.
- The edge of an element on `orbit-N` sits half its thickness past lane N. To keep a ring of thickness 2 inside the universe, put it on `orbit-11`.
- To use a fixed size instead, set a length: `.gravity-spot { --o-force: 400px }`. To make the reach the width of a wide universe, use `--o-force: 100cqw`.

The [universe demo](demos/00-universe.html) shows the lanes and lets you resize the space.

### Rules of the structure

```
.bigbang
└── .gravity-spot
    ├── .orbit-N
    │   ├── .satellite > .capsule   ← your content
    │   ├── .vector · .side
    │   └── <o-arc> · <o-progress>
    └── .orbit-M …
```

- Rings are direct children of `.gravity-spot`, never of another ring.
- A ring holds only `.satellite`, `.vector`, `.side`, `<o-arc>` and `<o-progress>`.
- Content goes in a `.capsule` inside a `.satellite`. Centered content goes in `.orbit-0 > .satellite.at-center > .capsule`.
- To nest a system, put a `.gravity-spot` (or a `.bigbang > .gravity-spot`) inside a satellite. It fills that satellite.

Add `dev-orbit` to a `.bigbang` while you build. Broken structure is outlined on the page and explained in the console.

### Angles and spacing

Set `--o-range` to control the angular span and `--o-from` to rotate it; `0deg` is the top and angles grow clockwise. Classes such as `range-270`, `from-225`, `ccw` and `fit-range` set common values. `fit-range` puts the first and last satellites or ticks on the two ends of the range; arcs always fill it.

| Property | Default | Set it on | Purpose |
| --- | --- | --- | --- |
| `--o-force` | `100cqmin` | `.gravity-spot` | Reach: diameter of `orbit-12`. |
| `--o-size-ratio` | `1` | system, ring or element | Thickness, in lanes. |
| `--o-range` | `360deg` | system or ring | Angular span. |
| `--o-from` | `0deg` | system or ring | Start angle. |
| `--o-gap` | `1` | system, ring or arc | Space between sibling arcs. |
| `--o-alignment` | `0px` | element | Move an element in (positive) or out (negative) from its lane. Also set by `.inner-orbit` and `.outer-orbit`. |

Values cascade: set one on the `.gravity-spot` for the whole system, on a ring for its elements, or on a single element. Every `.gravity-spot` starts from the defaults, so nested systems do not inherit their parent's values.

Arcs and progress elements use `value` relative to `max`, which defaults to `100`. Add `interactive` when you need their SVG shapes to receive pointer events; they are decorative by default. Supply the keyboard behavior and accessible labels for any controls you build.

Progress rings draw filled bands by default. For a stroked line, use `variant="stroke"` and set `--o-stroke` and `--o-back-stroke` instead of the fill colors.

### Depth layers

Add `depth` to a `.gravity-spot` to stack its rings in 3D. Each direct child ring (or a nested `.bigbang`) is a layer: `data-depth="1"` moves it one step back, and `.layer-front` marks the active layer at depth 0. Layers keep their apparent size, because the scale compensates for the perspective, and they animate when their depth changes.

```html
<div class="gravity-spot depth" style="--o-depth-grow: .42">
  <div class="orbit-4 layer-front"><o-progress value="82"></o-progress></div>
  <div class="orbit-4" data-depth="1"><o-progress value="40"></o-progress></div>
  <div class="orbit-4" data-depth="2"><o-progress value="65"></o-progress></div>
</div>
```

| Property | Default | Purpose |
| --- | --- | --- |
| `--o-z` | `depth × step` | Position on the z axis in unitless pixels; negative values are farther away. Set it on a ring to override `data-depth`. |
| `--o-depth-step` | `-110` | Distance between depth steps. |
| `--o-perspective` | `900` | Perspective in unitless pixels. |
| `--o-depth-grow` | `0` | Extra size per step back; `.42` gives 1×, 1.42×, 1.84×. |
| `--o-depth-compensate` | `1` | Set to `0` to let farther layers look smaller. |
| `--o-back-opacity` | `1` | Opacity of layers behind the front one. |
| `--o-depth-duration` / `--o-depth-easing` | `.8s` / `cubic-bezier(.2,.8,.2,1)` | Depth transition. Disabled with `prefers-reduced-motion`. |

`data-depth` accepts 0 to 8. Rings outside `.depth` are not transformed.

## In an app

Orbit observes added, removed and reordered elements, style and attribute changes, and container resizes. Updates are grouped into the next animation frame.

Importing the package during server rendering is safe. Include it in the browser entrypoint too, so it can register the custom elements and observe the rendered layout. The module exports `Orbit`, `OrbitArc`, `OrbitProgress` and `registerOrbit`; registration happens on import, and repeated calls to `registerOrbit()` are safe.

Use `Orbit.refresh()` when you need an immediate update, or after changes Orbit cannot observe, such as editing stylesheet rules through CSSOM or changing an external control used by a CSS selector:

```js
import { Orbit } from '@zumer/orbit'

const panel = document.querySelector('#instrument-panel')
Orbit.refresh(panel)
```

`refresh()` accepts an element, document or shadow root. With no argument, it refreshes the document. The CDN script exposes the same API as `window.Orbit`.

Layouts scale with their `.bigbang` without any code. `Orbit.resize(target)` is only for systems that set a fixed px `--o-force`: it scales them with the target's width, taking 500px as 1×, and returns a function that stops observing.

For shadow DOM, include the stylesheet inside each shadow root. An `<o-arc>` or `<o-progress>` registers its layout there automatically. If the shadow tree contains only CSS elements, register it with `Orbit.refresh(shadowRoot)`. Open and closed roots are supported.

Use the documented CSS properties for overrides. The runtime manages `data-orbit-ring`, `--o-layout-*` and `--o-arc-start` internally.

### TypeScript and editors

The package ships types for the API and for `document.querySelector('o-progress')`. For JSX, load the element types once, for example in a `.d.ts` file of your app:

```ts
import type {} from '@zumer/orbit/react'
```

Then `<o-progress value={72} shape="rounded" />` and `<o-arc>` are checked like other elements.

`@zumer/orbit/custom-elements.json` is a [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/) for tools that read it. For attribute completion in VS Code, add the HTML data file to your settings:

```json
{ "html.customData": ["./node_modules/@zumer/orbit/dist/vscode.html-custom-data.json"] }
```

## When something looks wrong

Orbit explains the common problems in the browser console, prefixed with `[orbit]`:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Nothing shows up, console says *has no size* | The `.bigbang` is 0px wide or tall, usually inside a parent that shrinks to fit. | Give the `.bigbang` (or its parent) a width. |
| The layout is as big as the window | The `.gravity-spot` is not inside a `.bigbang`, so it measures the viewport. | Wrap it in a `.bigbang`. |
| An arc or ring is empty | `value` is not a number, or `max` is not positive. | Fix the attribute; the console names it. |
| Content overlaps or sits off the ring | It is a direct child of a ring instead of a `.satellite`. | Add `dev-orbit` to see where, then wrap it. |
| Curved text is cut off | The text is longer than its arc. | Shorten it, widen `--o-range`, or add `fit-range`. |
| Everything looks too thin | Elements are one lane thick. | Raise `--o-size-ratio` on the ring or system. |

Orbit needs CSS trigonometric functions (`sin` and `cos`) and container query units. Without JavaScript, a CSS fallback can position simple elements on up to 24 ring levels, with up to 60 children per type; it also requires `:has()` and `:nth-child(... of ...)`. The JavaScript runtime supports larger layouts. `<o-arc>` and `<o-progress>` always need JavaScript.

Add `theme-cyan` for the built-in cyan colors; it combines with `dev-orbit`:

```html
<div class="bigbang theme-cyan dev-orbit">...</div>
```

## Migrating from 1.x

Version 2 changes how a layout is sized. In 1.x every system was 500px across (`--o-force: 500px`) whatever the size of its `.bigbang`, and `Orbit.resize()` was needed to make it responsive. Now `orbit-12` reaches the edge of the `.bigbang`.

- **Keep the 1.x size:** set `.gravity-spot { --o-force: 500px }`. `Orbit.resize()` still scales such systems.
- **Or adopt the new model:** remove `--o-force` and `Orbit.resize()`, then choose rings by their share of the space. A 1.x ring `orbit-N` in a box `W` px wide lands near `orbit-(N × 500 / W)`, and its thickness near `--o-size-ratio: 500 / W`.
- A `.bigbang` is a size container, so it is the containing block of `position: fixed` descendants.
- A `.bigbang` directly in `<body>` is capped at the viewport height instead of forced to it, so a `width` and `aspect-ratio` of yours apply as written.
- `.satellite` no longer resets `--o-size-ratio`, so a value set on its ring reaches it. `shrink-N` on a ring now changes only ring spacing.
- `--o-gap` cascades from the ring and system. `--o-aligment` still works; prefer `--o-alignment`.
- `fit-range` on a ring of arcs no longer makes the arcs overflow the range.

## Demos

From a local checkout:

```sh
npm ci
npm run demo
```

Open <http://127.0.0.1:5174>. The demo command compiles the source and serves [`demos/`](demos/) with that local build. Start with [The universe model](demos/00-universe.html), then the patterns: progress ring, donut, radial menu, gauges, knob, nested systems, compass, radar and depth layers. Use `PORT=5175 npm run demo` to choose another port.

The [documentation site](https://zumerlab.github.io/orbit-docs/) has more [gauges](https://zumerlab.github.io/orbit-docs/examples/gauges/), [charts](https://zumerlab.github.io/orbit-docs/examples/charts/), [radial menus](https://zumerlab.github.io/orbit-docs/examples/piemenu/), [knobs](https://zumerlab.github.io/orbit-docs/examples/knobs/) and [watch faces](https://zumerlab.github.io/orbit-docs/examples/watches/). [Orbit Kit](https://zumerlab.com/orbit-kit) provides ready-made components built on Orbit.

## Work on Orbit

See [CONTRIBUTING.md](CONTRIBUTING.md) for the source layout, tests and release steps.

## Contributing and reference

Report bugs in [Issues](https://github.com/zumerlab/orbit/issues), or share examples and ask questions in [Discussions](https://github.com/zumerlab/orbit/discussions). There is also a [Telegram group](https://t.me/ZumlyCommunity).

For coding assistants, [llms.txt](https://zumerlab.github.io/orbit-docs/llms.txt) has a short reference and [llms-full.txt](https://zumerlab.github.io/orbit-docs/llms-full.txt) has the full class and property reference. Include the relevant sections when asking an assistant to generate Orbit markup.

## License

[MIT](LICENSE)
