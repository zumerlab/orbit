# Orbit CSS Framework — Code Generation Skill

Use this skill when generating HTML/CSS that uses the Orbit framework for radial/circular UIs.

---

## Installation (always include in generated HTML)

```html
<link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@2.0.0/dist/orbit.min.css">
<script defer src="https://unpkg.com/@zumer/orbit@2.0.0/dist/orbit.min.js"></script>
```

npm alternative:
```js
import '@zumer/orbit/style'
import '@zumer/orbit'
```

Pin the version. This skill describes Orbit 2 (the universe sizing model below). In Orbit 1.x every system was 500px across regardless of its container.

---

## THE SIZING MODEL (read first)

- `.bigbang` is the universe: its box is the space. Square by default (parent width; a parent with a height caps it). Size it with `width` and, if needed, `height` or `aspect-ratio`.
- `.gravity-spot` reaches the shorter side of the universe: `orbit-12` touches the edge (`--o-force: 100cqmin`).
- The radius is split into 12 lanes. `orbit-N` runs N lanes from the center; `orbit-6` is half way.
- Elements on a ring are one lane thick (a 24th of the universe width). Set `--o-size-ratio` on the ring for thicker bands: `style="--o-size-ratio: 2"`. A band of thickness T on `orbit-N` reaches `N + T/2` lanes, so keep `N + T/2 <= 12` to stay inside.
- Never compute pixel sizes for rings. Pick a lane by its share of the box.
- Fixed size instead: `.gravity-spot { --o-force: 400px }`. Reach equal to the width of a wide box: `--o-force: 100cqw`.

---

## MANDATORY HTML HIERARCHY

Every Orbit layout MUST follow this exact nesting. Skipping or misordering any level WILL break the layout.

```
.bigbang
  └── .gravity-spot
        ├── .orbit-N
        │     ├── .satellite > .capsule     ← content here
        │     ├── <o-arc>                    ← directly in orbit
        │     ├── <o-progress>               ← directly in orbit
        │     ├── .vector                    ← directly in orbit
        │     └── .side                      ← directly in orbit
        └── .orbit-M
              └── ...
```

### Rules:
- `.bigbang` → only `.gravity-spot` children
- `.gravity-spot` → only `.orbit-N`, `.orbit`, or nested `.gravity-spot`
- `.orbit-N` → only `.satellite`, `<o-arc>`, `<o-progress>`, `.vector`, `.side`
- `.satellite` → only `.capsule` or nested `.gravity-spot`
- `.capsule` → your content (text, images, icons, any HTML)
- `<o-arc>`, `<o-progress>`, `.vector`, `.side` go DIRECTLY in `.orbit-N`, NEVER inside `.satellite`
- For nested radial layouts: new `.bigbang > .gravity-spot` inside a `.capsule`
- NEVER nest `.orbit-N` inside another `.orbit-N`

### Minimal valid example:
```html
<div class="bigbang" style="width: 300px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-3">
      <div class="satellite"><div class="capsule">Item 1</div></div>
      <div class="satellite"><div class="capsule">Item 2</div></div>
      <div class="satellite"><div class="capsule">Item 3</div></div>
    </div>
  </div>
</div>
```

---

## STRUCTURAL ELEMENTS

### .bigbang
The universe. A size container: `width: 100%; aspect-ratio: 1; max-height: 100%`, centered flex. Its defaults have zero specificity, so any rule of yours wins. When a direct child of `<body>` it is capped at `100vh`. Give it a width when embedded: `style="width: 300px"`.

### .gravity-spot
Center of mass / origin. `width: 0; position: relative`. Holds the defaults of every CSS custom property, so each system (including nested ones) starts fresh. `--o-force` (reach) defaults to the shorter side of the nearest `.bigbang` or `.satellite`.

### .orbit-N (N = 0 to 24)
Ring on lane N. `.orbit-0` = center point (use for center content). `.orbit-1` = smallest, `.orbit-12` = the edge of the universe. `.orbit-13` to `.orbit-24` lie beyond the edge. `position: absolute; border-radius: 50%; pointer-events: none`.

### .orbit (without number)
Auto-numbered by DOM order among siblings. First `.orbit` = orbit-1, etc.

### .satellite
Item placed on a ring. Positioned via CSS `cos()`/`sin()` transforms. Auto-distributed evenly. `position: absolute; border-radius: 50%; pointer-events: all`. No border or background by default. One lane wide times `--o-size-ratio`. It is also a size container: a `.gravity-spot` placed directly inside it fills the satellite.

### .capsule
Content wrapper. Counter-rotates so text stays upright. `display: flex; position: absolute; align-items: center; justify-content: center`. ALL visible content goes here.

### .vector
Tick mark / radial line. Goes directly in `.orbit-N`. Auto-rotated to point outward. Height: 1px default.

### .side
Chord element between two points on a ring. Goes directly in `.orbit-N`. Width auto-calculated.

---

## CSS CUSTOM PROPERTIES

Values cascade: set on `.gravity-spot` for the whole system, on `.orbit-N` for its elements, or on one element.

### Layout properties

| Property | Default | Description |
|---|---|---|
| `--o-force` | `100cqmin` | Reach: diameter of orbit-12. Defaults to the universe's shorter side; any length overrides |
| `--o-force-ratio` | `1` | Multiplier for fixed px forces (set by `Orbit.resize()`) |
| `--o-from` | `0deg` | Start angle. 0 = top/12 o'clock |
| `--o-range` | `360deg` | Arc span. 180 = semicircle, 270 = 3/4 |
| `--o-direction` | `1` | 1 = clockwise, -1 = CCW |
| `--o-fit-range` | `0` | 1 = distribute items without overlap at boundaries |
| `--o-ellipse-x` | `1` | Horizontal compression (>1 compresses) |
| `--o-ellipse-y` | `1` | Vertical compression (>1 compresses) |
| `--o-initial-orbit` | `0` | Orbit numbering offset |
| `--o-size-ratio` | `1` | Element thickness in lanes; set it on the ring |
| `--o-orbit-ratio` | `0` | Ring spacing reduction (0=normal, 1=same size) |
| `--o-gap` | `1` | Gap between arc segments; set it on the ring |
| `--o-alignment` | `0px` | Radial offset (positive=inward). Legacy spelling `--o-aligment` also works |

### Auto-calculated (DO NOT set manually)
`--o-orbit-number`, `--o-orbit-child-number`, `--o-angle`, `--o-angle-composite`, `--o-diameter`, `--o-radius`

### Web component styling

| Property | Used by | Description |
|---|---|---|
| `--o-fill` | `<o-arc>`, `<o-progress>` | Fill color |
| `--o-stroke` | `<o-arc>`, `<o-progress>` | Stroke color |
| `--o-stroke-width` | `<o-arc>`, `<o-progress>` | Stroke width |
| `--o-back-fill` | `<o-progress>` | Background track fill |
| `--o-back-stroke` | `<o-progress>` | Background track stroke |
| `--o-back-stroke-width` | `<o-progress>` | Background track stroke width |
| `--o-color` | `<o-arc>` | Text color |

---

## UTILITY CLASSES

### Positioning (on .orbit-N or .satellite)
`.at-top-left`, `.at-top`, `.at-top-right`, `.at-center-left`, `.at-center`, `.at-center-right`, `.at-bottom-left`, `.at-bottom`, `.at-bottom-right`

### Range & angle (on .orbit-N)
- `.range-{0-360}` — sets `--o-range` (e.g., `.range-180` = semicircle)
- `.from-{0-360}` — sets `--o-from` (e.g., `.from-180` = start from bottom)
- `.angle-{0-360}` — fixed angle for one element (resets `--o-from` to 0)
- `.fit-range` — even distribution without overlap
- `.ccw` — counter-clockwise

Angle reference: `from-0` = top, `from-90` = right, `from-180` = bottom, `from-270` = left

### Initial orbit (on .gravity-spot)
`.from-1x` to `.from-12x` — increases orbit numbering offset

### Orbit shrink (on .orbit-N)
`.shrink-0` to `.shrink-100` (step 5) — reduces ring spacing

### Element size
- `.grow-0.1x` to `.grow-0.9x` — slight increase
- `.grow-1x` to `.grow-12x` — significant increase
- `.shrink-0` to `.shrink-100` (step 5) — decrease

### Gap (on `<o-arc>`)
`.gap-0` to `.gap-30`

### Radial alignment
`.inner-orbit`, `.quarter-inner-orbit`, `.quarter-outer-orbit`, `.outer-orbit`

### Capsule modifiers
`.flip`, `.turn-left`, `.turn-right`, `.horizontal` (inside `.side > .capsule`)

### Satellite modifiers
`.spin-lock` (gyro), `.circle`, `.box`, `.rounded-box`

### Effects
`.gooey-fx-light`, `.gooey-fx-medium`, `.gooey-fx-max`

---

## WEB COMPONENTS

### <o-arc> — Arc / Wedge Segment

Placement: DIRECTLY inside `.orbit-N`. Never in `.satellite`.

**Attributes:** `value` (0-100), `max`, `shape` (none|rounded|circle|circle-a|circle-b|bullet|arrow|slash|backslash|zigzag), `flip`, `fit-range`, `text-anchor` (start|middle|end), `range="auto"` (arc sized to its text; consecutive auto arcs follow each other), `interactive` (band takes the pointer, even if transparent), `hit-width` (extra px of touch area)

**Stacking (donut chart):** Multiple `<o-arc>` with `value` auto-stack end-to-end. Values should sum to ≤100.
```html
<div class="orbit-3">
  <o-arc value="50" style="--o-fill: red"></o-arc>
  <o-arc value="30" style="--o-fill: blue"></o-arc>
  <o-arc value="20" style="--o-fill: green"></o-arc>
</div>
```

**Equal segments (no value):** Arcs auto-divide the range equally.
```html
<div class="orbit-3">
  <o-arc class="gap-4" style="--o-fill: red"></o-arc>
  <o-arc class="gap-4" style="--o-fill: blue"></o-arc>
</div>
```

**Text along arc:** `<o-arc>Text here</o-arc>`

**Needle/pointer:** `<o-arc value="58" shape="arrow" style="--o-fill: white"></o-arc>`

### <o-progress> — Progress Ring

Placement: DIRECTLY inside `.orbit-N`. Never in `.satellite`.

**Attributes:** `value` (0-100), `max` (default 100), `shape` (same as o-arc), `variant="stroke"`, `interactive` (whole track takes the pointer), `hit-width`

**Update dynamically:** `element.setAttribute('value', 75)`

**Background track:** Use `--o-back-fill` and `--o-back-stroke` for the track behind the progress bar.

---

## COLOR SYSTEM

Base: `--o-red`, `--o-orange`, `--o-yellow`, `--o-green`, `--o-cyan`, `--o-blue`, `--o-indigo`, `--o-purple`, `--o-pink`, `--o-gray`

Variants per color: `-white` (95%), `-lighter` (75%), `-light` (30% white), `-dark` (20% black), `-darker` (40%), `-black` (78%)

Example: `var(--o-cyan-light)`, `var(--o-red-darker)`

Dynamic: set `--o-color: #ff6600` then use `var(--o-color-light)`, etc.

## THEMES

- Default (no class): no borders on rings or satellites; ticks and chords in currentColor; gray arcs. Zero specificity, so any style of yours wins
- `.theme-cyan` on `.bigbang`: cyan styling
- `.dev-orbit` on `.bigbang`: red dashed borders (debugging)

## RESPONSIVE

Nothing to do: a layout scales with its `.bigbang`. `Orbit.resize('.parent')` only scales systems that set a fixed px `--o-force`.

---

## COPY-PASTE RECIPES

### Progress ring with center label
```html
<div class="bigbang" style="width: 200px">
  <div class="gravity-spot">
    <div class="orbit-10" style="--o-size-ratio: 2">
      <o-progress value="72" shape="rounded" style="--o-fill:#818cf8; --o-back-fill:rgba(100,100,100,.3); --o-stroke:none"></o-progress>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-size:24px; font-weight:800; white-space:nowrap">72%</div></div>
    </div>
  </div>
</div>
```

### Donut chart
```html
<div class="bigbang" style="width: 250px">
  <div class="gravity-spot">
    <div class="orbit-9" style="--o-size-ratio: 3">
      <o-arc value="50" style="--o-fill:#f97316"></o-arc>
      <o-arc value="30" style="--o-fill:#eab308"></o-arc>
      <o-arc value="20" style="--o-fill:#22c55e"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800; white-space:nowrap">$2.4k</div></div>
    </div>
  </div>
</div>
```

### Radial menu (equal segments)
```html
<div class="bigbang" style="width: 300px">
  <div class="gravity-spot">
    <div class="orbit-8 range-270 from-225" style="--o-size-ratio: 2; --o-gap: 6">
      <o-arc interactive style="--o-fill:#3b82f6">Home</o-arc>
      <o-arc interactive style="--o-fill:#10b981">Edit</o-arc>
      <o-arc interactive style="--o-fill:#f59e0b">Save</o-arc>
      <o-arc interactive style="--o-fill:#ef4444">Delete</o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800">MENU</div></div>
    </div>
  </div>
</div>
```

### Speedometer with needle + tick marks
```html
<div class="bigbang" style="width: 300px">
  <div class="gravity-spot">
    <div class="orbit-11 range-270 from-225 fit-range" style="--o-size-ratio: 1.5">
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
    </div>
    <div class="orbit-9 range-270 from-225" style="--o-size-ratio: 2; --o-gap: 4">
      <o-arc style="--o-fill:#22c55e"></o-arc>
      <o-arc style="--o-fill:#eab308"></o-arc>
      <o-arc style="--o-fill:#ef4444"></o-arc>
    </div>
    <div class="orbit-7 range-270 from-225">
      <o-arc value="58" shape="arrow" style="--o-fill:white"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-size:22px;font-weight:800;white-space:nowrap">125 km/h</div></div>
    </div>
  </div>
</div>
```

### Half gauge
A 2:1 universe with its center at the bottom; the reach is the width.
```html
<div class="bigbang at-bottom" style="width: 200px; aspect-ratio: 2 / 1">
  <div class="gravity-spot" style="--o-force: 100cqw">
    <div class="orbit-10 range-180 from-270" style="--o-size-ratio: 2">
      <o-arc value="75" shape="arrow" style="--o-fill:#22c55e; --o-stroke:none"></o-arc>
    </div>
  </div>
</div>
```

### Multi-ring constellation
```html
<div class="bigbang" style="width: 300px">
  <div class="gravity-spot">
    <div class="orbit-5">
      <div class="satellite"><div class="capsule">A</div></div>
      <div class="satellite"><div class="capsule">B</div></div>
      <div class="satellite"><div class="capsule">C</div></div>
    </div>
    <div class="orbit-10">
      <div class="satellite"><div class="capsule">D</div></div>
      <div class="satellite"><div class="capsule">E</div></div>
      <div class="satellite"><div class="capsule">F</div></div>
      <div class="satellite"><div class="capsule">G</div></div>
      <div class="satellite"><div class="capsule">H</div></div>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800">Center</div></div>
    </div>
  </div>
</div>
```

### Nested system (planet + moon)
A `.gravity-spot` inside a satellite fills that satellite. Make the satellite big with `--o-size-ratio`.
```html
<div class="bigbang" style="width: 340px">
  <div class="gravity-spot">
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="width:40px;height:40px;border-radius:50%;background:gold"></div></div>
    </div>
    <div class="orbit-8">
      <div class="satellite" style="--o-size-ratio: 5">
        <div class="gravity-spot">
          <div class="orbit-0"><div class="satellite at-center"><div class="capsule" style="width:12px;height:12px;border-radius:50%;background:dodgerblue"></div></div></div>
          <div class="orbit-10"><div class="satellite"><div class="capsule" style="width:5px;height:5px;border-radius:50%;background:silver"></div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Knob control
```html
<div class="bigbang" style="width: 180px">
  <div class="gravity-spot">
    <div class="orbit-9" style="--o-size-ratio: 3">
      <o-arc id="knob" value="65" shape="circle-a" style="--o-stroke:#27272a;--o-stroke-width:4;--o-fill:#a1a1aa"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:700">65%</div></div>
    </div>
  </div>
</div>
```

---

## CRITICAL RULES — DO NOT VIOLATE

1. ALWAYS follow `.bigbang > .gravity-spot > .orbit-N > .satellite > .capsule`
2. ALL visible content inside `.capsule`, never directly in `.satellite`
3. Center content: `.orbit-0 > .satellite.at-center > .capsule`
4. `<o-arc>`, `<o-progress>`, `.vector`, `.side` go DIRECTLY in `.orbit-N`, never in `.satellite`
5. NEVER nest `.orbit-N` inside `.orbit-N` — put a `.gravity-spot` inside a `.satellite` for sub-orbits
6. Size the `.bigbang`, not the rings. Leave `--o-force` at its default unless a fixed size is required
7. `from-0` = top (12 o'clock), not right (3 o'clock)
8. `<o-arc>` and `<o-progress>` DO NOT work in elliptical layouts (ellipse-x or ellipse-y != 1)
9. DO NOT invent classes — only use documented classes (NO `.orbit-ring`, `.orbit-item`, `.orbit-center`, etc.)
10. DO NOT use `transform` on `.satellite` — it overrides the positioning calculation. On `<o-arc>`/`<o-progress>` use `scale`/`transform` freely: they are placed with `rotate`
11. DO NOT set `--o-orbit-number`, `--o-angle`, or `--o-radius` manually — they are auto-calculated
12. Always include both CSS and JS files — JS registers the web components
13. Thickness comes from `--o-size-ratio` on the ring, not from width/height on elements
14. A stroke wider than the band hides the fill: keep `--o-stroke-width` small or set `--o-stroke: none`
15. While building, add `dev-orbit` to the `.bigbang`; the console explains structural mistakes
16. Wait for drawing with `await Orbit.ready()`; each arc fires `o-rendered` after it redraws
17. Depth layers can be composite: a nested `.gravity-spot` with `data-depth` holding ring + label + face

## QUICK REFERENCE

```
Structure:     .bigbang > .gravity-spot > .orbit-N > .satellite > .capsule
Center:        .orbit-0 > .satellite.at-center > .capsule
Arc segments:  .orbit-N > <o-arc value="40" style="--o-fill:red">
Progress ring: .orbit-N > <o-progress value="72">
Tick marks:    .orbit-N > .vector
Half circle:   .bigbang.at-bottom (2:1) + --o-force:100cqw + .orbit-N.range-180.from-270
3/4 circle:    .orbit-N.range-270.from-225
Even spacing:  .orbit-N.fit-range
CCW:           .orbit-N.ccw
Thicker band:  .orbit-N style="--o-size-ratio: 2"
Nested:        .satellite (big --o-size-ratio) > .gravity-spot
Responsive:    automatic (size the .bigbang)
Debug:         .bigbang.dev-orbit
```
