# Orbit CSS Framework — Code Generation Skill

Use this skill when generating HTML/CSS that uses the Orbit framework for radial/circular UIs.

---

## Installation (always include in generated HTML)

```html
<link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@latest/dist/orbit.css">
<script src="https://unpkg.com/@zumer/orbit@latest/dist/orbit.js"></script>
```

npm alternative:
```js
import '@zumer/orbit/style'
import '@zumer/orbit'
```

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
Root container. `display: flex; align-items: center; justify-content: center; width: 100%; height: 100%`. When direct child of `<body>`: auto `height: 100vh`. Give it explicit dimensions when embedded: `style="width: 300px; aspect-ratio: 1;"`.

### .gravity-spot
Center point / origin. `width: 0; position: relative`. Holds all CSS custom property defaults. All orbit calculations reference this element.

### .orbit-N (N = 0 to 24)
Ring at radius level N. `.orbit-0` = center point (use for center content). `.orbit-1` = smallest, `.orbit-12` = largest standard ring. `.orbit-13` to `.orbit-24` = extended range. `position: absolute; border-radius: 50%; pointer-events: none`.

### .orbit (without number)
Auto-numbered by DOM order among siblings. First `.orbit` = orbit-1, etc.

### .satellite
Item placed on a ring. Positioned via CSS `cos()`/`sin()` transforms. Auto-distributed evenly. `position: absolute; border-radius: 50%; pointer-events: all`. Default: transparent background, 1px solid currentColor border.

### .capsule
Content wrapper. Counter-rotates so text stays upright. `display: flex; position: absolute; align-items: center; justify-content: center`. ALL visible content goes here.

### .vector
Tick mark / radial line. Goes directly in `.orbit-N`. Auto-rotated to point outward. Height: 1px default.

### .side
Chord element between two points on a ring. Goes directly in `.orbit-N`. Width auto-calculated.

---

## CSS CUSTOM PROPERTIES

Set on `.gravity-spot` or `.orbit-N` to override.

### Layout properties

| Property | Default | Description |
|---|---|---|
| `--o-force` | `500px` | Base system size (must be px) |
| `--o-force-ratio` | `1` | Responsive multiplier (set by `Orbit.resize()`) |
| `--o-from` | `0deg` | Start angle. 0 = top/12 o'clock |
| `--o-range` | `360deg` | Arc span. 180 = semicircle, 270 = 3/4 |
| `--o-direction` | `1` | 1 = clockwise, -1 = CCW |
| `--o-fit-range` | `0` | 1 = distribute items without overlap at boundaries |
| `--o-ellipse-x` | `1` | Horizontal compression (>1 compresses) |
| `--o-ellipse-y` | `1` | Vertical compression (>1 compresses) |
| `--o-initial-orbit` | `0` | Orbit numbering offset |
| `--o-size-ratio` | `1` | Element size multiplier |
| `--o-orbit-ratio` | `0` | Ring spacing reduction (0=normal, 1=same size) |
| `--o-gap` | `1` | Gap between arc segments |
| `--o-aligment` | `0px` | Radial offset (positive=inward) |

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

**Attributes:** `value` (0-100), `shape` (none|rounded|circle|circle-a|circle-b|bullet|arrow|slash|backslash|zigzag), `flip`, `fit-range`, `text-anchor` (start|middle|end)

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

**Attributes:** `value` (0-100), `max` (default 100), `shape` (same as o-arc)

**Update dynamically:** `element.setAttribute('value', 75)`

**Background track:** Use `--o-back-fill` and `--o-back-stroke` for the track behind the progress bar.

---

## COLOR SYSTEM

Base: `--o-red`, `--o-orange`, `--o-yellow`, `--o-green`, `--o-cyan`, `--o-blue`, `--o-indigo`, `--o-purple`, `--o-pink`, `--o-gray`

Variants per color: `-white` (95%), `-lighter` (75%), `-light` (30% white), `-dark` (20% black), `-darker` (40%), `-black` (78%)

Example: `var(--o-cyan-light)`, `var(--o-red-darker)`

Dynamic: set `--o-color: #ff6600` then use `var(--o-color-light)`, etc.

## THEMES

- Default (no class): transparent orbits, currentColor borders
- `.theme-cyan` on `.bigbang`: cyan styling
- `.dev-orbit` on `.bigbang`: red dashed borders (debugging)

## RESPONSIVE

```js
Orbit.resize('.container') // Recalculates --o-force-ratio on resize
```

Or set `--o-force` to a smaller value directly.

---

## COPY-PASTE RECIPES

### Progress ring with center label
```html
<div class="bigbang" style="width: 200px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-4">
      <o-progress value="72" style="--o-fill:#818cf8; --o-stroke-width:6; --o-back-stroke:rgba(100,100,100,.3); --o-back-stroke-width:6;"></o-progress>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-size:24px; font-weight:800;">72%</div></div>
    </div>
  </div>
</div>
```

### Donut chart
```html
<div class="bigbang" style="width: 250px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-3">
      <o-arc value="50" style="--o-fill:#f97316"></o-arc>
      <o-arc value="30" style="--o-fill:#eab308"></o-arc>
      <o-arc value="20" style="--o-fill:#22c55e"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800;">$2.4k</div></div>
    </div>
  </div>
</div>
```

### Radial menu (equal segments)
```html
<div class="bigbang" style="width: 300px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-5 fit-range range-270 from-225">
      <o-arc class="gap-6" style="--o-fill:#3b82f6; cursor:pointer;">Home</o-arc>
      <o-arc class="gap-6" style="--o-fill:#10b981; cursor:pointer;">Edit</o-arc>
      <o-arc class="gap-6" style="--o-fill:#f59e0b; cursor:pointer;">Save</o-arc>
      <o-arc class="gap-6" style="--o-fill:#ef4444; cursor:pointer;">Delete</o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800;">MENU</div></div>
    </div>
  </div>
</div>
```

### Speedometer with needle + tick marks
```html
<div class="bigbang" style="width: 300px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-6 range-270 from-225 fit-range">
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
      <div class="vector" style="background:#666;height:4px"></div>
    </div>
    <div class="orbit-5 range-270 from-225">
      <o-arc class="gap-4" style="--o-fill:#22c55e"></o-arc>
      <o-arc class="gap-4" style="--o-fill:#eab308"></o-arc>
      <o-arc class="gap-4" style="--o-fill:#ef4444"></o-arc>
    </div>
    <div class="orbit-4 range-270 from-225">
      <o-arc value="58" shape="arrow" style="--o-fill:white"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-size:22px;font-weight:800;">125 km/h</div></div>
    </div>
  </div>
</div>
```

### Semicircle gauge
```html
<div class="bigbang" style="width: 200px; aspect-ratio: 2/1;">
  <div class="gravity-spot">
    <div class="orbit-4 range-180 from-180">
      <o-arc value="75" shape="arrow" style="--o-fill:#22c55e"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800;">75%</div></div>
    </div>
  </div>
</div>
```

### Multi-ring constellation
```html
<div class="bigbang" style="width: 300px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-2">
      <div class="satellite"><div class="capsule">A</div></div>
      <div class="satellite"><div class="capsule">B</div></div>
      <div class="satellite"><div class="capsule">C</div></div>
    </div>
    <div class="orbit-4">
      <div class="satellite"><div class="capsule">D</div></div>
      <div class="satellite"><div class="capsule">E</div></div>
      <div class="satellite"><div class="capsule">F</div></div>
      <div class="satellite"><div class="capsule">G</div></div>
      <div class="satellite"><div class="capsule">H</div></div>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:800;">Center</div></div>
    </div>
  </div>
</div>
```

### Nested orbits (planet + moon)
```html
<div class="bigbang" style="width: 340px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="width:40px;height:40px;border-radius:50%;background:gold;"></div></div>
    </div>
    <div class="orbit-4">
      <div class="satellite" style="border:none;">
        <div class="capsule">
          <div class="bigbang">
            <div class="gravity-spot" style="--o-force:72px;">
              <div class="orbit-0"><div class="satellite at-center"><div class="capsule" style="width:16px;height:16px;border-radius:50%;background:dodgerblue;"></div></div></div>
              <div class="orbit-2"><div class="satellite"><div class="capsule" style="width:6px;height:6px;border-radius:50%;background:silver;"></div></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Knob control
```html
<div class="bigbang" style="width: 180px; aspect-ratio: 1;">
  <div class="gravity-spot">
    <div class="orbit-4">
      <o-arc id="knob" value="65" shape="circle-a" style="--o-stroke:#27272a;--o-stroke-width:14;--o-fill:#a1a1aa"></o-arc>
    </div>
    <div class="orbit-0">
      <div class="satellite at-center"><div class="capsule" style="font-weight:700;">65%</div></div>
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
5. NEVER nest `.orbit-N` inside `.orbit-N` — use `.capsule > .bigbang > .gravity-spot` for sub-orbits
6. `--o-force` MUST be a px value, never percentage
7. `from-0` = top (12 o'clock), not right (3 o'clock)
8. `<o-arc>` and `<o-progress>` DO NOT work in elliptical layouts (ellipse-x or ellipse-y != 1)
9. DO NOT invent classes — only use documented classes (NO `.orbit-ring`, `.orbit-item`, `.orbit-center`, etc.)
10. DO NOT use `transform` on `.satellite` — it overrides the positioning calculation
11. DO NOT set `--o-orbit-number`, `--o-angle`, or `--o-radius` manually — they are auto-calculated
12. Always include both CSS and JS files — JS registers the web components

## QUICK REFERENCE

```
Structure:     .bigbang > .gravity-spot > .orbit-N > .satellite > .capsule
Center:        .orbit-0 > .satellite.at-center > .capsule
Arc segments:  .orbit-N > <o-arc value="40" style="--o-fill:red">
Progress ring: .orbit-N > <o-progress value="72">
Tick marks:    .orbit-N > .vector
Semicircle:    .orbit-N.range-180.from-180
3/4 circle:    .orbit-N.range-270.from-225
Even spacing:  .orbit-N.fit-range
CCW:           .orbit-N.ccw
Nested:        .capsule > .bigbang > .gravity-spot (set smaller --o-force)
Responsive:    Orbit.resize('.parent')
Debug:         .bigbang.dev-orbit
```
