<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="orbit-logo-blanco.svg">
    <img src="orbit-logo-negro.svg" alt="Orbit" width="120">
  </picture>
</p>

# Orbit

Orbit puts HTML on circles. Gauges, dials, knobs, radial menus, donut charts, watch faces, sci-fi panels: anything that grows around a center instead of down a page.

You write plain HTML with a few classes. CSS does the geometry and the look; a small runtime keeps numbering, spacing and SVG arcs right as things change. It works the same in plain HTML, React, Vue, Svelte or anything else that renders the DOM.

[Documentation and examples](https://zumerlab.com/orbit/) · [npm](https://www.npmjs.com/package/@zumer/orbit) · [Orbit 1.x docs](https://zumerlab.com/orbit-docs/)

## Install

```sh
npm install @zumer/orbit
```

```js
import '@zumer/orbit/style'
import '@zumer/orbit'
```

Or, in a plain page:

```html
<link rel="stylesheet" href="https://unpkg.com/@zumer/orbit/dist/orbit.min.css">
<script defer src="https://unpkg.com/@zumer/orbit/dist/orbit.min.js"></script>
```

## Your first universe

Save this as `index.html` and open it. It draws a progress ring with a label in the middle, and the whole thing is as big as its 240px box.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A first Orbit</title>
  <link rel="stylesheet" href="https://unpkg.com/@zumer/orbit/dist/orbit.min.css">
  <script defer src="https://unpkg.com/@zumer/orbit/dist/orbit.min.js"></script>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; }
    .gauge { width: 240px; }
    .gauge o-progress { --o-fill: #3da9fc; --o-back-fill: #1d3749; --o-stroke: none; }
    .gauge .value { font-size: 40px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="gauge bigbang">
    <div class="gravity-spot">
      <div class="orbit-10" style="--o-size-ratio: 2">
        <o-progress value="72" shape="rounded" role="progressbar"
          aria-label="Upload" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"></o-progress>
      </div>
      <div class="orbit-0" style="--o-size-ratio: 12">
        <div class="satellite at-center"><div class="capsule value">72%</div></div>
      </div>
    </div>
  </div>
</body>
</html>
```

Change `width` on `.gauge` and everything follows: the ring, its thickness, the space for the label. Change `value` and the ring redraws.

## How Orbit thinks

Orbit borrows its words from a solar system. It sounds like a gimmick for about a minute; after that it is the easiest way to remember what each piece does.

**First there is a big bang.** A `.bigbang` creates the universe: the space your layout lives in. Its box is the only size you ever set. It is square by default, as wide as its parent, and a parent with a height keeps it from growing taller.

**Then gravity.** Inside it, a `.gravity-spot` is the center of mass. Its gravity reaches as far as the shorter side of the universe; that reach is `--o-force`, and it is the diameter of the outermost orbit, `orbit-12`.

**Gravity draws orbits.** From the center to that edge there are 12 lanes. `orbit-1` is the first lane, `orbit-6` is halfway out, `orbit-12` touches the edge. `orbit-0` is the center itself, and `orbit-13` to `orbit-24` exist too, past the edge, for things that should stick out.

**Satellites travel the orbits.** A `.satellite` sits on a ring, and Orbit spreads all the satellites of a ring around it on its own. Each one carries a `.capsule`, where your content goes, kept upright however far around the ring it is.

**And there is more up there.** A `.vector` is a ray pointing out from the center: ticks, needles. A `.side` is a chord between neighbors: polygons. `<o-arc>` draws a piece of a lane, with text along it if you want. `<o-progress>` fills a lane up to a value.

```
.bigbang                          the universe: its box sets the size
└── .gravity-spot                 the center; reaches the shorter side
    ├── .orbit-N                  a lane, N twelfths of the way out
    │   ├── .satellite > .capsule ← your content
    │   ├── .vector · .side       rays and chords
    │   └── <o-arc> · <o-progress>
    └── .orbit-M …
```

That is all the structure there is. A few rules keep it working:

- Rings are direct children of a `.gravity-spot`, never of another ring.
- A ring holds only `.satellite`, `.vector`, `.side`, `<o-arc>` and `<o-progress>`.
- Content goes in a `.capsule` inside a `.satellite`. Centered content goes in `.orbit-0 > .satellite.at-center > .capsule`.

Add `dev-orbit` to the `.bigbang` while you build. It draws the lanes, outlines anything in the wrong place and explains it in the console.

### Size is a fraction of the universe

Every element on a ring is one lane thick: a twelfth of the radius. A satellite on `orbit-8` is a circle one lane across; a band of `<o-progress>` is one lane wide. To make things thicker or thinner, set `--o-size-ratio`, in lanes, on the element, on its ring, or on the whole `.gravity-spot`:

```html
<div class="orbit-8" style="--o-size-ratio: 2">
  <div class="satellite"><div class="capsule">A</div></div>
  <div class="satellite"><div class="capsule">B</div></div>
  <div class="satellite"><div class="capsule">C</div></div>
</div>
```

An element on `orbit-N` reaches half its thickness past lane N. So a band two lanes thick on `orbit-11` ends exactly at the edge of the universe.

Because everything is a fraction of one box, an Orbit layout is responsive without any code. Put it in a sidebar, a card or a full screen and it scales as one piece. If you need a fixed size instead, give the reach a length: `.gravity-spot { --o-force: 400px }`.

### Universes inside universes

A satellite is a universe too. Put a `.gravity-spot` inside one and its reach is the satellite's edge, like a moon system around a planet:

```html
<div class="orbit-9" style="--o-size-ratio: 4">
  <div class="satellite">
    <div class="gravity-spot">
      <div class="orbit-12"><o-progress value="40"></o-progress></div>
    </div>
  </div>
</div>
```

Every `.gravity-spot` starts from the defaults, so a nested system does not inherit the sizes or angles of the one around it.

### Angles

Angles start at the top and grow clockwise. `--o-range` is how much of the circle a ring uses, and `--o-from` where it starts:

```html
<div class="orbit-10" style="--o-range: 240deg; --o-from: 240deg">…</div>
```

Classes cover the common values: `range-180`, `from-270`, `ccw` to go counterclockwise, and `fit-range` to put the first and last satellite or tick on the two ends of a partial range.

| Property | Default | Set it on | What it does |
| --- | --- | --- | --- |
| `--o-force` | `100cqmin` | `.gravity-spot` | Reach: the diameter of `orbit-12`. |
| `--o-size-ratio` | `1` | system, ring or element | Thickness, in lanes. |
| `--o-range` | `360deg` | system or ring | How much of the circle the ring uses. |
| `--o-from` | `0deg` | system or ring | Where the range starts. |
| `--o-gap` | `1` | system, ring or arc | Space between sibling arcs. |
| `--o-alignment` | `0px` | element | Moves an element in (positive) or out (negative) from its lane. Also set by `.inner-orbit` and `.outer-orbit`. |

Values cascade, so set them once on the `.gravity-spot` for the whole system or on a ring for its elements.

### Which way is out

Each satellite tells its content where it sits: `--o-dir-x` and `--o-dir-y` are the direction from the center, from `-1` to `1` (`y` grows down, and both are `0` on the center satellite). It is handy for labels that should hang outward, above the satellites of the upper half and below the rest:

```css
.label {
  /* -1 in the upper half, 1 in the lower half */
  --side: clamp(-1, var(--o-dir-y) * 1000, 1);
  position: absolute; left: 50%;
  top: calc(50% + var(--side) * (50% + 4px));
  translate: -50% calc((var(--side) - 1) * 50%);
}
```

## Arcs and progress

`<o-arc>` and `<o-progress>` go straight into a ring. Both take a `value` out of `max` (100 by default) and an ending: `shape="rounded"`, `circle`, `arrow`, `slash`, `zigzag` and a few more, all scaled to the band.

Without `value`, sibling arcs split the ring between them: that is a segmented ring or a pie. With `value`, they stack one after another: that is a donut chart.

```html
<div class="orbit-10" style="--o-size-ratio: 3">
  <o-arc value="45" style="--o-fill: #3da9fc"></o-arc>
  <o-arc value="30" style="--o-fill: #ef4565"></o-arc>
  <o-arc value="25" style="--o-fill: #90b4ce"></o-arc>
</div>
```

Text inside an arc is drawn along it. With `range="auto"` the arc is as long as its text, and consecutive auto arcs follow each other, which makes curved menus easy. `text-anchor="middle"` centers an auto arc on its angle:

```html
<div class="orbit-11 from-300">
  <o-arc range="auto">Home</o-arc><o-arc range="auto">Projects</o-arc><o-arc range="auto">About</o-arc>
</div>
```

Progress rings draw filled bands. For a thin gauge line, use `variant="stroke"`: a 2px line over a gray track, colored with `--o-stroke` and `--o-back-stroke`.

Arcs and progress are decorative until you say otherwise. `interactive` makes the whole band clickable, transparent or not, and `hit-width="12"` adds 12px of touch area on each side:

```html
<div class="orbit-10" style="--o-size-ratio: 2">
  <o-arc interactive hit-width="8" style="--o-fill: transparent" aria-label="Volume"></o-arc>
</div>
```

You bring the keyboard behavior and the accessible names for any control you build. Arcs are placed with the `rotate` property, so a `transform` or `scale` of yours adds to it instead of replacing it.

## Depth

A system can stack its rings in 3D. Add `depth` to the `.gravity-spot` and each ring becomes a layer: `data-depth="1"` sends it one step back, `.layer-front` marks the one in front. Layers keep their apparent size, because the scale makes up for the perspective, and they animate when their depth changes.

```html
<div class="gravity-spot depth" style="--o-depth-grow: .42">
  <div class="orbit-4 layer-front"><o-progress value="82"></o-progress></div>
  <div class="orbit-4" data-depth="1"><o-progress value="40"></o-progress></div>
  <div class="orbit-4" data-depth="2"><o-progress value="65"></o-progress></div>
</div>
```

| Property | Default | What it does |
| --- | --- | --- |
| `--o-z` | `depth × step` | Position on the z axis in unitless pixels; negative is farther. Overrides `data-depth`. |
| `--o-depth-step` | `-110` | Distance between steps. |
| `--o-perspective` | `900` | Perspective, in unitless pixels. |
| `--o-depth-grow` | `0` | Extra size per step back: `.42` gives 1×, 1.42×, 1.84×. |
| `--o-depth-compensate` | `1` | `0` lets farther layers look smaller. |
| `--o-back-opacity` | `1` | Opacity of the layers behind the front one. |
| `--o-depth-duration` / `--o-depth-easing` | `.8s` / `cubic-bezier(.2,.8,.2,1)` | The depth transition. Off with `prefers-reduced-motion`. |

A layer can be a whole system, ring, label and face together: make it a nested `.gravity-spot` with `data-depth`. To tilt the whole object from outside (with the pointer, say), add `outer-perspective` next to `depth` and set `--o-perspective` to the perspective of the ancestor that owns it. The [depth demo](https://zumerlab.com/orbit/demos/11-depth-layers.html) shows both.

## In an app

Orbit watches the DOM for you: added, removed and reordered elements, attribute and style changes, and resized containers. Updates are batched into the next animation frame.

The package is safe to import during server rendering; import it in the browser entry too, so it can register the elements and watch the page. It exports `Orbit`, `OrbitArc`, `OrbitProgress` and `registerOrbit`; registration happens on import and calling `registerOrbit()` again is harmless.

A few things for when you need them:

```js
import { Orbit } from '@zumer/orbit'

await Orbit.ready()                 // every pending arc is drawn
gauge.addEventListener('o-rendered', () => measure(gauge))  // one arc redrew
Orbit.refresh(panel)                // update now, e.g. after editing a stylesheet through CSSOM
```

`Orbit.resize(target)` only matters for systems with a fixed px `--o-force`: it scales them with the target's width, taking 500px as 1×, and returns a function that stops it.

For shadow DOM, include the stylesheet inside each shadow root. Arcs and progress register their shadow root on their own; for a shadow tree with only CSS elements, call `Orbit.refresh(shadowRoot)` once.

Override Orbit through the documented custom properties. The runtime manages `data-orbit-ring`, `--o-layout-*` and `--o-arc-start` itself.

### TypeScript and editors

The package ships types for the API and for `document.querySelector('o-progress')`. For JSX, load the element types once, for example in a `.d.ts` file:

```ts
import type {} from '@zumer/orbit/react'
```

`@zumer/orbit/custom-elements.json` is a [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/). For attribute completion in VS Code:

```json
{ "html.customData": ["./node_modules/@zumer/orbit/dist/vscode.html-custom-data.json"] }
```

## When something looks wrong

Orbit explains common mistakes in the browser console, starting with `[orbit]`:

| You see | Because | Fix |
| --- | --- | --- |
| Nothing, and the console says *has no size* | The `.bigbang` is 0px wide or tall, usually in a parent that shrinks to fit. | Give the `.bigbang` or its parent a width. |
| A layout as big as the window | The `.gravity-spot` is not inside a `.bigbang`, so it measures the viewport. | Wrap it in a `.bigbang`. |
| An empty arc or ring | `value` is not a number, or `max` is not positive. | Fix the attribute; the console names it. |
| Content overlapping or off the ring | It sits directly in a ring instead of a `.satellite`. | Add `dev-orbit` to see where, then wrap it. |
| Curved text cut off | The text is longer than its arc. | Shorten it, widen `--o-range`, use `range="auto"`, or `fit-range`. |
| Everything thin | Elements are one lane thick. | Raise `--o-size-ratio` on the ring or the system. |
| An arc that ignores clicks | Arcs are decorative by default. | Add `interactive`, and `hit-width` for a bigger target. |

The reset and the default theme have zero specificity, so a single class of yours always wins, also inside a `.capsule`. `theme-cyan` gives a ready-made cyan look and combines with `dev-orbit`.

Orbit needs CSS `sin()`, `cos()` and container query units. Without JavaScript, a CSS fallback still places simple layouts (up to 24 rings and 60 children per type; it also needs `:has()` and `:nth-child(… of …)`); `<o-arc>` and `<o-progress>` always need the runtime.

## Coming from 1.x

Version 2 changes where size comes from. In 1.x every system was 500px across, whatever the size of its `.bigbang`, and you needed `Orbit.resize()` to make it responsive. Now `orbit-12` reaches the edge of the `.bigbang`.

- **To keep the 1.x size**, set `.gravity-spot { --o-force: 500px }`. `Orbit.resize()` still scales those systems.
- **To move to the new model**, remove `--o-force` and `Orbit.resize()` and pick rings by their share of the space. A 1.x `orbit-N` in a box `W` px wide lands near `orbit-(N × 500 / W)`, and its thickness near `--o-size-ratio: 500 / W`.
- A `.bigbang` is a size container, so it is the containing block of `position: fixed` descendants. Directly in `<body>` it is capped at the viewport height instead of forced to it.
- `.satellite` no longer resets `--o-size-ratio`, so a value on its ring reaches it. `shrink-N` on a ring only changes how close it sits to the previous lane.
- `--o-gap` cascades from the ring and the system. `--o-aligment` still works; `--o-alignment` is the right spelling.
- `fit-range` on a ring of arcs no longer overflows the range.
- Satellites have no border by default. The reset, the default theme and `theme-cyan` have zero specificity apart from their own class, so your styles apply without `!important`.
- `<o-arc>` and `<o-progress>` are placed with `rotate` instead of `transform`, and endings scale with the band. `interactive` makes the whole band clickable.
- `variant="stroke"` on `<o-progress>` draws a 2px line over a gray track by default.

The [1.x documentation](https://zumerlab.com/orbit-docs/) stays online.

## Demos

From a checkout:

```sh
npm ci
npm run docs
```

Then open <http://127.0.0.1:5174> (`PORT=5175 npm run docs` for another port). That is this repo's documentation site, from `docs/`, running on your local build. Start with [the universe model](docs/demos/00-universe.html): drag the corner of the box and watch the system follow. All the examples are in the gallery, from full pages to small pieces with their code open.

The [documentation site](https://zumerlab.com/orbit/) has many more: [gauges](https://zumerlab.com/orbit/examples/gauges/), [charts](https://zumerlab.com/orbit/examples/charts/), [radial menus](https://zumerlab.com/orbit/examples/piemenu.html), [knobs](https://zumerlab.com/orbit/examples/knobs/), [watch faces](https://zumerlab.com/orbit/examples/watches/). [Orbit Kit](https://zumerlab.com/orbit/kit/) has ready-made components built on Orbit.

## Help and contributing

Report bugs in [Issues](https://github.com/zumerlab/orbit/issues), share what you made or ask in [Discussions](https://github.com/zumerlab/orbit/discussions), or say hi in the [Telegram group](https://t.me/ZumlyCommunity). To work on Orbit itself, see [CONTRIBUTING.md](CONTRIBUTING.md).

For coding assistants, [llms.txt](https://zumerlab.com/orbit/llms.txt) is a short reference and [llms-full.txt](https://zumerlab.com/orbit/llms-full.txt) the complete one.

## Sponsor

Orbit is free and made in spare time. If it saves you time, you can [sponsor it on GitHub](https://github.com/sponsors/tinchox5).

## License

[MIT](LICENSE)
