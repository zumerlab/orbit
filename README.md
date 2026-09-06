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

Save this as `index.html` and open it in a browser. It loads Orbit from the CDN and draws a ring at 72%.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orbit progress ring</title>
  <link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@1.5.0/dist/orbit.min.css">
  <script defer src="https://unpkg.com/@zumer/orbit@1.5.0/dist/orbit.min.js"></script>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; }
    .gauge.bigbang { width: 240px; height: 240px; }
    .gauge > .gravity-spot { --o-force: 400px; }
    .gauge o-progress { --o-fill: #3da9fc; --o-back-fill: #1d3749; --o-stroke: none; }
  </style>
</head>
<body>
  <div class="gauge bigbang">
    <div class="gravity-spot">
      <div class="orbit-6">
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

The runtime redraws the ring automatically. A value of `0` leaves only the background; `100` fills the orbit's range.

## How layouts fit together

A `.bigbang` container holds a `.gravity-spot`, which defines the center. Rings inside it position the content. In the example above, `.orbit-6` sets the ring's radius and `<o-progress>` draws on it.

| Element | Purpose |
| --- | --- |
| `.bigbang` | Container that centers the layout. |
| `.gravity-spot` | Layout origin; holds rings and defines their scale with `--o-force`. |
| `.orbit` / `.orbit-N` | Ring with an automatic index or an explicit level, such as `.orbit-6`. |
| `.satellite` | Positions an item on a ring. |
| `.capsule` | Wraps content inside a satellite. |
| `.vector` | Places a tick or marker on a ring. |
| `.side` | Places content along the straight line between adjacent ring positions. |
| `<o-arc>` | Draws a segment. Sibling arcs stack in HTML order. |
| `<o-progress>` | Draws a progress value over a background arc. |

Put rings directly inside `.gravity-spot`, not inside other rings. Use `.capsule` for elements inside a satellite, or a nested `.gravity-spot` for another radial layout. `.orbit-0` places content at the center.

Set `--o-range` to control the angular span and `--o-from` to rotate it. Classes such as `range-270`, `from-180` and `fit-range` provide common settings. The [element reference](https://zumerlab.github.io/orbit-docs/elements/orbit/) covers sizing, spacing and nesting.

Arcs and progress elements use `value` relative to `max`, which defaults to `100`, and support circular rings. Add `interactive` when you need their SVG shapes to receive pointer events; they are decorative by default. Supply the keyboard behavior and accessible labels for any controls you build.

Progress rings draw filled bands by default. For a stroked line, use `variant="stroke"` and set `--o-stroke` and `--o-back-stroke` instead of the fill colors.

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

To scale a layout with its container's width, call `Orbit.resize()` after that container mounts:

```js
const stopResizing = Orbit.resize('#instrument-panel')

// Call stopResizing() when the component unmounts.
```

`resize()` accepts a selector or an element. It uses a 500px base scale and returns a function that disconnects its observer.

For shadow DOM, include the stylesheet inside each shadow root. An `<o-arc>` or `<o-progress>` registers its layout there automatically. If the shadow tree contains only CSS elements, register it with `Orbit.refresh(shadowRoot)`. Open and closed roots are supported.

Use the documented CSS properties for overrides. The runtime manages `data-orbit-ring`, `--o-layout-*` and `--o-arc-start` internally.

## Browser support and debugging

Orbit needs CSS trigonometric functions (`sin` and `cos`). Without JavaScript, a CSS fallback can position simple elements on up to 24 ring levels, with up to 60 children per type; it also requires `:has()` and `:nth-child(... of ...)`. The JavaScript runtime supports larger layouts. `<o-arc>` and `<o-progress>` always need JavaScript.

Add `dev-orbit` to a container to show ring boundaries and invalid nesting. Add `theme-cyan` for the built-in cyan colors; both classes can be combined:

```html
<div class="bigbang theme-cyan dev-orbit">...</div>
```

The [visual aids guide](https://zumerlab.github.io/orbit-docs/tools/support/) explains the structural checks.

## Examples and components

Browse [gauges](https://zumerlab.github.io/orbit-docs/examples/gauges/), [charts](https://zumerlab.github.io/orbit-docs/examples/charts/), [radial menus](https://zumerlab.github.io/orbit-docs/examples/piemenu/), [knobs](https://zumerlab.github.io/orbit-docs/examples/knobs/) and [watch faces](https://zumerlab.github.io/orbit-docs/examples/watches/).

[Orbit Kit](https://zumerlab.com/orbit-kit) provides ready-made gauges, clocks, knobs and menus built on Orbit. Use the base library when you want to compose the layout yourself.

## Work on Orbit

From a local checkout:

```sh
npm ci
npm run demo
```

Open <http://127.0.0.1:5174>. The demo command compiles the source and serves the playground with that local build. Use `PORT=5175 npm run demo` to choose another port.

To run the tests:

```sh
npx playwright install chromium firefox webkit
BROWSERS=chromium,firefox,webkit npm test
```

The tests cover package contents, server imports, browser layouts and shadow DOM. `npm test` uses Chromium by default. Run `npm run test:package`, `npm run test:browser` or `npm run test:shadow` for an individual suite.

`npm run compile` writes the CSS and JavaScript files to `dist/`. `npm run build` also creates the npm tarball.

## Contributing and reference

Report bugs in [Issues](https://github.com/zumerlab/orbit/issues), or share examples and ask questions in [Discussions](https://github.com/zumerlab/orbit/discussions). See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution details. There is also a [Telegram group](https://t.me/ZumlyCommunity).

For coding assistants, [llms.txt](https://zumerlab.github.io/orbit-docs/llms.txt) has a short reference and [llms-full.txt](https://zumerlab.github.io/orbit-docs/llms-full.txt) has the full class and property reference. Include the relevant sections when asking an assistant to generate Orbit markup.

## License

[MIT](LICENSE)
