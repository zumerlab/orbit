# Contributing to Orbit

Thanks for helping. Bug reports, examples and pull requests are all welcome. Ask questions in [Discussions](https://github.com/zumerlab/orbit/discussions) or the [Telegram group](https://t.me/ZumlyCommunity), and report bugs in [Issues](https://github.com/zumerlab/orbit/issues) with the smallest HTML that shows the problem.

## Set up

```sh
npm ci
npm run docs
```

`npm run docs` compiles the source and serves the documentation site in [`docs/`](docs/), at <http://127.0.0.1:5174> with the local build. Recompile with `npm run compile` after a change and reload the page.

## Where things are

| Path | What it holds |
| --- | --- |
| `src/scss/` | Geometry and appearance. `_bigbang.scss` and `_gravity-spot.scss` define the universe model; `_orbit-class.scss` the lanes; `_satellite.scss`, `_vector.scss`, `_side.scss` the elements; `_utilities.scss` the helper classes. |
| `src/js/orbit-layout.js` | The layout runtime: finds rings, numbers their children, batches updates per frame and explains broken layouts in the console. |
| `src/js/orbit-base.js`, `orbit-arc.js`, `orbit-progress.js` | The `<o-arc>` and `<o-progress>` elements and their SVG paths. |
| `src/js/orbit-resize.js` | `Orbit.refresh()` and `Orbit.resize()`. |
| `src/types/` | TypeScript declarations, copied to `dist/`. Update them with any public API change. |
| `src/elements.mjs` | Attributes and CSS properties of the custom elements. The build turns it into `custom-elements.json` and the VS Code data file. |
| `docs/` | The documentation site (plain HTML, GitHub Pages). `docs/demos/` has the full-page examples. `npm run docs:sync` copies the build into `docs/orbit/`. |
| `test/` | Package, browser and shadow DOM tests. |

## Guidelines

- Keep the metaphor consistent: the `.bigbang` is the space, the `.gravity-spot` reaches it, rings are lanes. New features should size themselves from that, not from fixed pixels.
- Library defaults that people commonly override belong in zero-specificity `:where()` rules, or in the `.gravity-spot` defaults so they cascade.
- When a mistake is easy to make, report it once with `warnOnce()` from `orbit-layout.js`, with the fix in the message. Structural checks run only inside `.dev-orbit`.
- Write code, comments and demo text in English.
- Add a test in `test/` for every fixed bug or new behavior.

## Test

```sh
npx playwright install chromium firefox webkit
BROWSERS=chromium,firefox,webkit npm test
```

`npm test` compiles first and uses Chromium unless `BROWSERS` is set. Run `npm run test:package`, `npm run test:browser` or `npm run test:shadow` for a single suite.

## Release

`npm run compile` writes the CSS, JavaScript, types and editor data to `dist/`. `npm run build` also creates the npm tarball. Maintainers bump the version and changelog with `npm run bump`.
