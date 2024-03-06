# °〇 Orbit

Orbit is a CSS radial library to create complex circular UI designs. Whether you're building circular menus, data visualization components, or circular interfaces, Orbit aims to simplify the process with intuitive CSS classes.

## Status

Orbit is currently in its MVP stage, but we're actively developing a new version to enhance the developer experience. The key focus is on incorporating cutting-edge and experimental CSS features while minimizing reliance on additional programming languages. This approach ensures that Orbit is not only maintainable and flexible but also compatible with your preferred programming tools, libraries, and frameworks, making the development experience more enjoyable.

## Join the dscussion

Your input and contributions are essential in creating a robust and user-friendly radial library. Join the discussion on [here](https://github.com/zumerlab/zumer-css/discussions) page and be a part of the Orbit community today!

## Installation

### Download or Include via CDN:
Download the library files from our repository or include them directly from a CDN in your HTML file:

```html
<link rel="stylesheet" href="path/to/orbit.css">
```

### Install via Package Manager:
If you are using a package manager like npm or yarn, install the library by running:

```bash
npm install @zumerlab/orbit
```

or

```bash
yarn add  @zumerlab/orbit
```

## Basic Usage

### Include Styles:
Link the library styles in the `<head>` section of your HTML file.

```html
<head>
  <link rel="stylesheet" href="path/to/orbit.css">
</head>
```
or 

```html
<style>
  @import url('path/to/orbit.css');
</style>
```

### Apply Orbit Classes:
Utilize predefined classes in your HTML elements to benefit from Orbit features. Folllowing code set a container and inside it a radial layout with three circles.

```html
<div class="container">
  <div class="orbit">
    <div class="orbiter"></div>
    <div class="orbiter"></div>
    <div class="orbiter"></div>
  </div>
</div>
```
Congratulations! You've successfully integrated and started using Orbit. Follow next steps for more advanced options and customization possibilities. If you encounter any issues, feel free to reach out to our support community for assistance.

Happy coding!

## Guide
Basic documentation to understand and start with °〇 Orbit.

### `pod`

The `pod` serves as the root element to scaffold Zumer. It encapsulates the entire Zumer framework and defines the boundaries for its usage. Multiple `pod` elements can coexist on the same page, allowing for modular and flexible implementation.

At the `pod` level, major CSS variables are defined, providing a centralized and customizable approach to styling and theming Zumer components. These variables can be easily modified within each `pod` instance, ensuorbit consistency and flexibility across different sections of your application.

### `orbit-*` (probably orbit)

The `orbit-*` classes act as guides for positioning other elements within the Zumer radial grid. Think of them as rows in the grid structure. They play an important role in organizing and aligning elements within the circular layout of Zumer.

Currently, there are six predefined orbit levels available (`orbit-1`, `orbit-2`, `orbit-3`...). Each orbit level is separated by a distance of 50px, creating a visually pleasing spacing between elements. However, you have the flexibility to adjust the distance as needed by utilizing CSS variables.

By leveraging the `orbit-*` classes, you can easily position and arrange elements within the Zumer radial grid, achieving harmonious and visually appealing circular designs.

It is possible to use multiple same level `orbit-*` to stack differente elements.

### `core`

The `core` class functions similarly to a regular orbit but is placed at the center of the container. It is particularly useful for positioning radial elements such as watch or gauge needles.

### `sector`

If orbits resemble rows, the `sector` class can be thought of as columns in the Zumer radial grid. An `sector` is a radial segment that serves as the background support for radial designs, but also may work standalone as buttons for instance. It offers customizable options, allowing you to fine-tune its appearance to suit your specific needs.

With the `sector` class, you can customize properties such as width, gap, offset, sector length, border curvature, and more. This level of control enables you to create visually stunning and unique radial layouts.

By experimenting with different configurations, you can achieve a wide range of design aesthetics, whether you prefer a sleek and minimalistic look or a more intricate and expressive pattern.

```html
    <div class="pod">
      <div class="orbit-1 orbiters-3">
        <div class="sector"></div>
        <div class="sector"></div>
        <div class="sector"></div>
      </div>
    </div>
```

In this example, three sectors are placed in a orbit. To draw three sectors that cover the entire orbit, you need to include the `orbiters-3` class in the orbit element. Additionally, you can utilize other parent options to customize the start angle and sector length.

- Use the `offset-*` class to specify the starting angle of the sectors within the orbit.
- Employ the `limit-*` class to define the length of the orbit sector covered by the sectors.

### `orbiter` (probably orbiter)

The `orbiter` class is used to position and contain content within the Zumer radial grid. It offers various customization options, including different sizes (`xxs`, `xs`, `s`, `m`, `l`, `xl`, `xxl`), shapes (`line`, `circle`, `box`, `rounded`, `blob`), orbital position (`stationary`), and relative orbit positions (`middle`, `upper`, `lower`).

One of the notable features of Zumer is the ability to nest `orbiter` elements, allowing for complex and layered radial designs.

```html
<div class="orbit-2 orbiters-2">
  <div class="orbiter box xl">
    <div class="orbit-3 orbiters-3">
      <div class="orbiter rounded xxs"></div>
      <div class="orbiter box xxs"></div>
      <div class="orbiter xxs"></div>
    </div>
  </div>
  <div class="orbiter l"></div>
</div>
```

### `label`

The `label` component is used to place labels on orbiters within the Zumer radial grid. It can be customized with the same shapes as orbiters and includes a connector line for visual clarity.

```html
  <div class="orbiter">
     <div class="label pos-45">
      <span class="text">Hi there!</span>
    </div>
  </div>
```

### `progress` (CSS Only)

The `progress` component works with orbits and is particularly useful for creating circular progress bars or knobs. It is implemented using CSS and gradient properties, allowing for easy customization and styling.

```html
  <div class="orbit-1">
    <div class="progress" style="--progress: 75">
    </div>
  </div>
```

### `svg progress` (SVG)

The `svg progress` component also works with orbits and serves the purpose of creating circular progress bars or knobs. It is implemented using SVG.

```html
   <div class="orbit-3 ">
      <svg class="svg-pod">
        <circle class="svg-progress" style="--val: 59;" /> 
      </svg>
    </div>
```

### `svg svg-markers` (SVG)

The `svg svg-markers` component, designed for orbits, allows for the creation of svg-markers within circular progress bars or knobs. It is implemented using SVG, providing a versatile way to indicate specific points or milestones within the circular progress.

```html
   <div class="orbit">
      <svg class="svg-pod">
          <circle class="svg-markers"></circle> 
        </svg>
    </div>
```
## Examples

Radial menu

Color selector

Analog watch

Simon game

Car dashboard





