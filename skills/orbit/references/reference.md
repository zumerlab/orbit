# Orbit 2 reference

Less common classes and properties, by element. Everything here is Orbit 2.x. The full pages, with live examples, are under https://zumerlab.com/orbit/reference/.

## Contents

- [Bigbang](#bigbang)
- [Gravity spot](#gravity-spot)
- [Rings](#rings)
- [Satellites](#satellites)
- [Capsules](#capsules)
- [Vectors](#vectors)
- [Sides](#sides)
- [Arcs](#arcs)
- [Curved text](#curved-text)
- [Progress](#progress)
- [Themes and colors](#themes-and-colors)

## Bigbang

| Class or property | Default | What it does |
| --- | --- | --- |
| `.bigbang` | | The universe. Holds one or more `.gravity-spot`. A size container, so it is the containing block of `position: fixed` descendants. |
| `width` / `height` / `aspect-ratio` | `100%` / `auto` / `1` | Its size. Your own values win (the defaults have zero specificity). Capped by a parent with a definite height, and by the viewport height directly in `<body>`. |
| `.at-top-left`, `.at-top`, `.at-top-right`, `.at-center-left`, `.at-center-right`, `.at-bottom-left`, `.at-bottom`, `.at-bottom-right` | `.at-center` | Puts the center of the system on that edge or corner of the box. |
| `.dev-orbit` | | Draws the lanes, outlines misplaced elements, explains them in the console. Changes the look, never the positions. |

A half gauge: a 2:1 bigbang with `.at-bottom`, and `--o-force: 100cqw` on the gravity spot so the reach is the width instead of the shorter side.

## Gravity spot

Set these on the `.gravity-spot` for the whole system, or on a ring or element for that part. Every `.gravity-spot` resets them to the defaults, so a nested system inherits nothing.

| Class or property | Default | What it does |
| --- | --- | --- |
| `--o-force` | `100cqmin` | Reach: the diameter of `orbit-12`. A length fixes the size; `100cqw` reaches the width; `calc(100cqmin * .8)` leaves a margin. |
| `--o-size-ratio` | `1` | Thickness of the elements, in lanes. |
| `--o-range` | `360deg` | How much of the circle the rings use. |
| `--o-from` | `0deg` | Where the range starts, clockwise from the top. |
| `--o-gap` | `1` | Space at each end of sibling arcs. |
| `--o-max` | `100` | Scale for arcs and progress that have no `max` attribute. |
| `--o-ellipse-x` / `--o-ellipse-y` | `1` | Stretch the rings into ellipses. Values below 1 stretch along that axis. Satellites and vectors follow; arcs, progress and sides do not. |
| `.core-1` … `.core-12` | | An empty core N lanes wide; rings sit closer together and `orbit-12` still touches the edge. |
| `.at-top-left` … `.at-bottom-right` | | Moves the rings toward that edge or corner, so they touch the center instead of surrounding it. |
| `.depth` | | Stacks the rings as 3D layers. See https://zumerlab.com/orbit/craft/depth.html |

## Rings

| Class or property | What it does |
| --- | --- |
| `.orbit-0` … `.orbit-24` | A ring on lane N. The diameter of `orbit-N` is N/12 of the reach. 0 is the center; 13 and up stick out. |
| `.orbit` | A ring on the next lane, counted in document order among unnumbered rings. Prefer explicit numbers. |
| `.range-0` … `.range-360`, `.from-0` … `.from-360` | Whole-degree classes for `--o-range` and `--o-from`. |
| `.fit-range` | First and last element on the two ends of a partial range. |
| `.ccw` | Counterclockwise. |
| `.shrink-5` … `.shrink-100` (steps of 5) | Moves the ring toward the previous lane by that percentage of a lane. The elements keep their size. |
| `.gooey-fx`, `.gooey-fx-medium`, `.gooey-fx-max` | Blends touching elements into a blob with an SVG filter. Not supported in Safari. |

## Satellites

A satellite is a circle one lane across, with no border or background until styled.

| Class or property | Default | What it does |
| --- | --- | --- |
| `--o-size-ratio` | `1` | Diameter, in lanes. |
| `.shrink-5` … `.shrink-100` | | Smaller: `shrink-N` is 1 − N/100 lanes. |
| `.grow-1x` … `.grow-12x` | | Bigger: `grow-Nx` is 2N lanes. Decimals work: `grow-1.5x` is 3 lanes, `grow-0.5x` is 1.5 lanes. |
| `.box`, `.rounded-box`, `.circle` | round | Shape. |
| `.inner-orbit`, `.outer-orbit`, `.quarter-inner-orbit`, `.quarter-outer-orbit` | | Moves it in or out from its lane. |
| `--o-alignment` | `0px` | Any offset from the lane, as a length; positive is inward. |
| `.angle-0` … `.angle-360` | | An exact angle, clockwise from the top. Ignores the ring's `--o-from`. |
| `.spin-lock` | | Turns with its angle, so the top of its content points at the center. |
| `.at-center` | | In `orbit-0`: the satellite sits at the center of the system. |
| `.at-value` | | Sits on the value of the `<o-progress>` in its ring. Ignores `ccw`. |
| `.at-top-left` … `.at-bottom-right` | | Where the capsule sits inside the satellite. |
| `--o-dir-x` / `--o-dir-y` | read only | Direction from the center to the satellite, from -1 to 1; `y` grows down. Inherited by its content. |
| `.outward`, `.outward-y` | | On a capsule or an element inside one: a label just outside the satellite, along its direction, or only above or below. |
| `--o-outward-gap` | `4px` | Space between the satellite and an `.outward` label. |

## Capsules

A capsule is as wide as its satellite and as tall as its content, so text wraps at the satellite's width. Give it a `width` for a wider label. It also works inside a `.side`, where it lies along the side.

| Class | Goes on | What it does |
| --- | --- | --- |
| `.flip` | capsule | Upside down. In a `.spin-lock` satellite, points outward. |
| `.turn-left` / `.turn-right` | capsule | A quarter turn. |
| `.horizontal` | capsule in a side | Stays level instead of following the side. |

## Vectors

A vector is a ray across its ring: one lane long, 1px thick, in the text color. It is centered on its lane, so a vector 2N lanes long on `orbit-N` starts at the center (a needle or clock hand).

| Class or property | Default | What it does |
| --- | --- | --- |
| `--o-size-ratio` | `1` | Length, in lanes. `.grow-*` and `.shrink-*` work as on satellites. |
| `height`, `background` | `1px`, `currentcolor` | Thickness and color. `border-radius` for round ends. |
| `.inner-orbit`, `.outer-orbit`, `.quarter-*-orbit` | | Ends or starts on its lane. |
| `.angle-0` … `.angle-360` | | Points at an exact angle. |

To move a needle, turn its ring with the CSS `rotate` property.

## Sides

A `.side` is a straight line between neighbors on a ring. N sides on a ring close a regular polygon. 1px thick in the text color; `height` and `background` style it. No size classes.

- `.outer-orbit` on every side: the polygon wraps around the ring instead of sitting inside it.
- Sides follow `--o-range`, `--o-from` and `.ccw`; `.angle-N` places one side.
- A side can hold a `.capsule` for a label along its edge.

## Arcs

| Attribute | Default | What it does |
| --- | --- | --- |
| `value` | | Share of the ring's range, out of `max`. Without it, arcs split the range equally. `value="0"` draws nothing and takes no room. |
| `max` | `100` | The value that fills the range. Without it, `--o-max` of the ring or system. |
| `start` | | Where the arc begins, on the same scale as `value`. A placed arc takes no slot. On a full ring it wraps around. |
| `range` | | `auto` makes the arc as long as its text. |
| `shape` | `none` | `circle` (or `circle-a`), `circle-b`, `bullet`, `arrow`, `slash`, `backslash`, `rounded`, `zigzag`. |
| `text-anchor` | `middle` | `start`, `middle` or `end`. On a `range="auto"` arc, where the arc sits around its angle. |
| `flip` | | Runs the text the other way. `flip="auto"` (or class `flip-auto`) only while the arc's middle is on the lower half. |
| `fit-range` | | Stretches or squeezes the text to the whole arc. Also a class. |
| `interactive` | | Makes the whole band clickable, even where transparent. |
| `hit-width` | `0` | Extra touch area in px on each side of an `interactive` band. |

| Property or class | Default | What it does |
| --- | --- | --- |
| `--o-fill` | `var(--o-gray-light)` | Band color. `transparent` for text only. |
| `--o-stroke` | `var(--o-fill)` | Outline color. |
| `--o-stroke-width` | `1` | Outline width, in px. |
| `color` or `--o-color` | `currentcolor` | Text color. |
| `--o-gap`, `.gap-0` … `.gap-30` | `1` | Space at each end. A ring of 3 to 6 thick segments usually wants 24 to 60 to read as separate pieces. |
| `.ripple` | | Waves grow out of the band. `--o-ripple-color`, `--o-ripple-duration` (`1.6s`), `--o-ripple-scale` (`1.14`). |
| `--o-size-ratio`, `.grow-*`, `.shrink-*` | `1` | Thickness, in lanes. |
| `.inner-orbit`, `.outer-orbit`, `.quarter-*-orbit` | | Moves the band in or out from its lane. |
| `.angle-0` … `.angle-360` | | Starts the arc at that angle. |

## Curved text

Text inside an `<o-arc>` is drawn along it. Style it like any text. The font size is in px and is the same on every ring; it does not scale with the layout, so check that it fits at the smallest size.

```html
<div class="bigbang">
  <div class="gravity-spot">
    <div class="orbit-11">
      <o-arc range="auto" text-anchor="middle">Curved title</o-arc>           <!-- centered at the top -->
    </div>
    <div class="orbit-11 from-180">
      <o-arc range="auto" text-anchor="middle" flip>Reads upright below</o-arc> <!-- centered at the bottom -->
    </div>
  </div>
</div>
```

```css
o-arc { --o-fill: transparent; --o-stroke: none; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
```

- Text runs clockwise, so on the lower half it reads upside down unless the arc has `flip`. Use `flip="auto"` when arcs come from data or the ring's `--o-from` changes. `flip="auto"` does not see a `rotate` or `transform` on an ancestor.
- A `range="auto"` arc starts at its angle; `text-anchor="middle"` centers it there and `text-anchor="end"` ends it there. Set that angle with `from-N` on the ring or `start` on the arc. With an `.angle-N` class on the arc itself the arc starts at that angle whatever the anchor.
- Consecutive `range="auto"` arcs follow each other: a curved menu.
- Labels over segments: two rings with the same range and start, one with N empty arcs, one with N text arcs. Each label lands over its segment.
- Text longer than its arc is clipped and reported in the console.

## Progress

| Attribute | Default | What it does |
| --- | --- | --- |
| `value` | `0` | Progress, out of `max`. |
| `max` | `100` | The value that fills the ring's range. Without it, `--o-max`. |
| `shape` | `none` | Same endings as arcs. Not applied with `variant="stroke"`. |
| `variant` | | `stroke` draws thin lines with round caps instead of bands. |
| `interactive`, `hit-width` | | As on arcs; the whole track is clickable. |

| Property or class | Default | What it does |
| --- | --- | --- |
| `--o-progress` | | The value, set from CSS. Wins over `value`. |
| `--o-value-angle` | read only | Written on the ring: the angle of the value from the start of the range. |
| `--o-fill` | `var(--o-gray-light)` | Bar color. Not used by `variant="stroke"`. |
| `--o-stroke` | `var(--o-fill)` | Bar outline, or the line color with `stroke`. |
| `--o-stroke-width` | `1` (`2` with `stroke`) | Outline or line width, in px. |
| `--o-back-fill` | `transparent` | Track color. Not used by `variant="stroke"`. |
| `--o-back-stroke` | `none` (gray with `stroke`) | Track outline, or the track line color. |
| `--o-back-stroke-width` | `1` | Track outline or line width, in px. |
| `.angle-0` … `.angle-360` | | Starts the bar at that angle instead of the ring's `--o-from`. |

Progress always fills clockwise. A slider: `<o-progress interactive hit-width="14" tabindex="0" role="slider" …>` plus a `.satellite.at-value` handle in the same ring; you write the pointer and keyboard handlers.

## Themes and colors

The default theme, `theme-cyan` and the reset count only their own class for specificity, so one class of yours wins without `!important`. The palette (ten hues, seven shades each, as custom properties) is at https://zumerlab.com/orbit/craft/colors.html and the themes at https://zumerlab.com/orbit/craft/themes.html.
