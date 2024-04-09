## _settings



## Orbit initial css variable declaration

When start a new Orbit project following css variables are declared:

```css
:root {
  --o-max-orbits: 12;
  --o-begin-at: 0deg;
  --o-range: 360deg;
  --o-ellipse-x: 1;
  --o-ellipse-y: 1;
}
```

**Important:** Orbit can have multiples instances in same project. If your want different initial setup for some instances css variables can be redeclare at first `.orbital-zone`

```css
.instance-1 {
  --o-max-orbits: 6;
  --o-begin-at: 90deg;
  --o-range: 360deg;
  --o-ellipse-x: 1;
  --o-ellipse-y: 1;
}

.instance-2 {
  --o-max-orbits: 10;
  --o-begin-at: 0deg;
  --o-range: 1800deg;
  --o-ellipse-x: 0.8;
  --o-ellipse-y: 1;
}
```

```html
<div class="orbital-zone instance-1">
</div>

<div class="orbital-zone instance-2">
</div>
```



## _orbital-zone

 
## .orbital-zone

Orbital zone is a functional class that groups `.orbit` classes. It serves as a container with a length defined once by `--o-length` when the Orbit app is initialized. When the Orbital zone is nested within a `.satellite`, its length will depend on the `.satellite`'s `.orbit` diameter.

**Important:** The `orbital-zone` class can only be nested into a `.satellite`.

### Usage

```html
<div class="orbital-zone">
  <div class="orbit"></div>
  <div class="orbit">
    <div class="satellite">
      <div class="orbital-zone"> <!-- Nested -->
        <div class="orbit"></div>
      </div>
    </div>
  </div>
</div>
```



## _orbit-class

 
## .orbit or .orbit-*

This class renders a circumsference around a .orbital-zone center and allows other elements to be 
distributed along width. By default there are 12 orbits. The number of orbits can be change on --o-max-orbits,
or in scss source $max-orbits var.

**Important:** .orbit or .orbit-* is a direct child element of .orbital-zone.

### Usage: 

```html
<div class="orbital-zone">
  <div class="orbit"></div>
  <div class="orbit"></div>
</div>
```

### Examples:

- This renders three orbits equally distributed 
  ```html
  <div class="orbit"></div>
  <div class="orbit"></div>
  <div class="orbit"></div>
  ```

- This renders three orbits with custom distribution
  ```html
  <div class="orbit-2"></div>
  <div class="orbit-9"></div>
  <div class="orbit-12"></div>
  ```

- This renders nested orbits around a satellite
  ```html
  <div class="orbital-zone">
    <div class="orbit">
      <div class="satellite">
        <div class="orbital-zone">
          <div class="orbit"></div>
          <div class="orbit"></div>
        </div>
      </div>
    </div>
  </div>
  ```
  
### Customization:

It has some special attributes and css variables to customize it or its children elements:
  
  - Class `.gap-*` applied on `.orbit` or `.orbit-*` set a `o-sector` gap space. Default '0'
  - Class utility `.range-*` applied on `.orbit` or `.orbit-*`: Default '360deg'
  - Class utility `.begint-at-*` applied on `.orbit` or `.orbit-*`: Default '0deg'
  - Class utility `.inner`: To place `o-sector` at a "low-orbit". Default midle-orbit
  - Class utility `.outer`: To place `o-sector` at a "high-orbit". Default midle-orbit

  - CSS styles. User can customize `.orbit` by adding CSS properties.

Besides css properties that user can change according his needs, there two css variables to turn `.orbit`or `.orbit-*` into 
an ellipse (`--o-ellipse-x`, and `--o-ellipse-y`). This will affect orbit and its childs, with an excepcion of `<o-sector>`
web component that will be hide when orbit is an ellipse. Values range from 0 to 1.

**Important**: Ckecking `--o-ellipse-x` and `--o-ellipse-y` doesn't work currently on Firefox and Safari.

```html
<div class="orbital-zone" style="--o-ellipse-x: 0.6">
  <div class="orbit">
    <div class="satellite">
      <div class="orbital-zone">
        <div class="orbit"></div>
        <div class="orbit"></div>
      </div>
    </div>
  </div>
</div>
```

There are some utility classes that are set on orbit element and affect its child radial layout (`.begin-at-*`, `.range-*`). 
Please see **Radial Layout section**.



## _satellite


## .satellite

Elements with `.satellite` are placed along an `.orbit` or `.orbit-*` arc serving as content place and/or to nest an `.orbital-zone`. 

### Shapes

By default a satellite provides an unstyled circle shape, but it can be easily changed according project needs.

A few set of shapes utilities are provided (`.circle`, `.box`, `.rounded-box`). Nevertheless, users can set any shapes using svg, images, etc. At this instance, Orbit is focused on setting a radial layout, not in UI styles.

### Customization

It has some special classes and css variables to customize it:

  - Class utility `.range-*`: Default '360deg'
  - Class utility `.begint-at-*`: Default '0deg'
  - Class utility `.size-*x`: To increase size according number of orbits. Default 1.
  - Class utility `.size-*fr`: To decrease size according a fracction of orbit width. Default 1.
  - Class utility `.inner`: To place `.satellite` at a "low-orbit". Default midle-orbit
  - Class utility `.outer`: To place `.satellite` at a "high-orbit". Default midle-orbit

  - CSS styles. User can customize `.satellite` by adding CSS properties to it. 

### Usage

- This renders six satellites with different properties
```html
<div class="orbit">
  <div class="satellite"></div>
  <div class="satellite inner"></div>
  <div class="satellite outer"></div>
  <div class="satellite rounded-box"></div>
  <div class="satellite size-2x"></div>
  <div class="satellite size-6fr"></div>
</div>
```

- This renders two satellites. One of which nest `.orbital-zone` with some orbits
```html
<div class="orbit">
  <div class="satellite"></div>
  <div class="satellite">
    <div class="orbital-zone">
      <div class="orbit"></div>
      <div class="orbit"></div>
      <div class="orbit"></div>
    </div>
  </div>
</div>
```

**Important:**

- `.satellite` can only be placed into a parent `.orbit` or `.orbit-*`
- There is no limit for nesting orbita-zone in satellites.




## _vector

 
## .vector

This class renders a perpendicular segment along an orbit. 
  
### Customization

It has some special classes and css variables to customize it:

  - Class utility `.range-*`: Default '360deg'
  - Class utility `.begint-at-*`: Default '0deg'
  - Class utility `.size-*x`: To increase size according number of orbits. Default 1.
  - Class utility `.size-*fr`: To decrease size according a fracction of orbit width. Default 1.
  - Class utility `.inner`: To place `.vector` at a "low-orbit". Default midle-orbit
  - Class utility `.outer`: To place `.vector` at a "high-orbit". Default midle-orbit

  - CSS styles. User can customize `.vector` by adding CSS properties to it. 

### Usage 

```html
<div class="orbit">
  <div class="vector"><div>
  <div class="vector x5"><div> <!-- 50% of orbit radius -->
  <div class="vector x01"><div> <!-- 1% of orbit radius -->
  <div class="vector"><div>
</div>
```

**Important:** `.vector` can only be placed into a parent `.orbit` or `.orbit-*`



## _sector


## <o-sector>

See o-sector docs in web-component file.



## _progress


## <o-progress>

See o-progress docs in web-component file.



## _radial-layout

 
## Orbit Radial Layout

Orbit radial layout is the core of Orbit library, offering a flexible, clean and simple way to design radial apps using just CSS.

### Overview

`.orbit` and `.orbit-*` have `--orbit-nth` to individualize their position according to the maximum number of orbits (e.g., `orbit-4` has `--orbit-nth: 4`). Similarly, other elements such as `satellites`, `vectors`, and `sectors` use `--o-position` to be individualized.

`.orbit` and `.orbit-*` hold a unique `--o-angle` calculated by counting their children. This allows for some calculations to distribute such elements along an orbit.

### Mechanism

The mechanism is straightforward:

- `--orbit-nth` gives a radius that informs where each `orbit` is placed, according to both the `.orbital-zone` length and the maximum number of orbits. For example, with an `.orbital-zone` length of 500px and a maximum of 12 orbits, `orbit-4` will have 166.66 pixels of radius.

- According to child number in an orbit, `--o-angle` is calculated (if one orbit has 3 satellites, `--o-angle` is 120deg). Finally, `--o-angle` is multiplied by `--o-positions`. For example, satellite one will have 120deg, satellite two 240deg, and satellite three 360deg, and each satellite will be placed along its orbit at 166.66px.

### Modifiers

There are some modifiers to adjust orbit child distribution:

- `--o-range`: This variable allows the user to set an arbitrary arc length. Values can range from 0 to 360deg. For convenience, there are utility classes `range-*` (.range-0 to .range-360).

- `--o-begin-at`: This variable allows the user to set an arbitrary starting point. Values can range from 0 to 360deg. For convenience, there are utility classes `begin-at-*` (.begin-at-0 to .begin-at-360).

### Usage and Examples

```html
<!-- Example usage of Orbit Radial Layout -->
<div class="orbital-zone">
    <div class="orbit-3"></div>
    <div class="orbit-4">
        <div class="satellite"></div>
        <div class="satellite"></div>
        <div class="satellite"></div>
    </div>
</div>
```

```html
<!-- Example usage of Orbit Radial Layout with custom range -->
<div class="orbit range-270">
  <o-sector>
  <o-sector>
  <o-sector>
</div>
```

```html
<!-- Example usage of Orbit Radial Layout with custom starting point -->
<div class="orbit-3 begin-at-90">
  <div class="vector"></div>
  <div class="vector"></div>
  <div class="vector"></div>
  <div class="vector"></div>
  <div class="vector"></div>
</div>
```

#### To-do

- Check `--orbit-nth` and `--o-position`
- Check behaviour when nested mix elements inside an orbit
- Add @container check


## _utilities


## Orbit utilities 

There is a small set of CSS utilities to use with some orbit classes and componentes:

  - **.orbital-zone aligment utilities**
    - `.center`, `center-left`, `.center-right`, `.top-left`, `.top-center`, `.top-right`, `.bottom-left`, `.bottom-center`,  `.bottom-right`
  - **.orbit or .orbit-* child elements utilities (satellite, vector, o-sector, o-progress)**
    - `.begin-at-*`: To set a starting angle point. From 0 - 360deg. Default 0deg.
    - `.range-*`: To set a limit to distribute elements. From 0 - 360deg. Default 360deg.
    - `.angle-*`: To set an angle poijt to place elements. From 0 - 360deg. (not applies to o-progress)
  - **Satellite, vector, o-sector, o-progress utilites**
    - `.size-*x`: To increase size according number of orbits. Default 1.
    - `.size-*fr`: To decrease size according a fracction of orbit width. Default 1.
    - `.inner`: To place element at a "low-orbit". Default midle-orbit
    - `.outer`: To place element at a "high-orbit". Default midle-orbit
  - **satellite utilities**
    - `.circle` to render a circle shape. Default
    - `.rounded-box` to render a rounded box shape.
    - `.box` to render a box shape.
  - **o-sector utilities**
    - `.gap-*` applied on `.orbit` or `.orbit-*` or in `<o-sector>`: to set a gap space. Default '0'
  


