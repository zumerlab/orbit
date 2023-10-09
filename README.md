<img  src="https://avatars.githubusercontent.com/u/103702169" width=120 />

# Zumer - CSS radial library

Zumer is a CSS radial library that empowers developers to easily create complex and captivating circular UI designs. Whether you're building circular menus, data visualization components, or unique circular interfaces, Zumer simplifies the process with its intuitive classes and lightweight structure.

Designed to be used standalone or seamlessly integrated with other CSS frameworks, Zumer unlocks a world of possibilities for creating stunning circular user interfaces.

Elevate your projects and unleash your creativity with Zumer, your go-to CSS radial library. Experience the power of circular designs today!

## Features

- **Effortless Circular Designs**: Easily create compelling circular designs for UI components.
- **Seamless Integration**: Use Zumer standalone or integrate it with other CSS frameworks.
- **Intuitive Classes**: Implement circular UI elements with intuitive and easy-to-use classes.
- **Lightweight and Performant**: Enjoy optimized performance with Zumer's lightweight structure.
- **Responsive and Customizable**: Adapt circular designs to various screen sizes and customize them to match your project's aesthetics.

## Status

## Beta Stage

Zumer CSS is currently in a closed Beta stage. We greatly value your ideas, discussions, and feedback as we continue to refine and expand the library.

## Join the Discussion

To actively participate in shaping the future of Zumer CSS, we encourage you to join the discussions [here](https://github.com/zumerlab/zumer-css/discussions). Share your thoughts, ask questions, and collaborate with the community to make Zumer even better.

Your input and contributions are essential in creating a robust and user-friendly radial library. Let's work together to develop stunning and innovative circular designs with Zumer CSS.

Join the discussion on  [here](https://github.com/zumerlab/zumer-css/discussions) page and be a part of the Zumer CSS community today!

## Quick start

1. Clone the repository.
2. Go to `examples` folder and open index.html with a browser. That's all. Server is not required because this examples are very simple and static.
3. For development, we recommend using Visual Studio Code with the Live Sass Compile and Live Server extensions. This setup will provide a seamless experience until we have [devbox available as standalone tool](https://github.com/zumerlab/devbox).

## Barebone template

Folllowing code set a container and inside it a radial layout with three circles.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="../assets/css/index.css" type="text/css" defer/>
    <title>Zumer CSS Rocks!</title>
  </head>
  <body>
    <div class="pod">
      <div class="orbit-2 orbiters-3">
        <div class="orbiter"></div>
        <div class="orbiter"></div>
        <div class="orbiter"></div>
      </div>
    </div>
  </body>
</html>
```

## Guide

Basic documentation to understand and start with Zumer CSS.

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

### `svg markers` (SVG)

The `svg markers` component, designed for orbits, allows for the creation of markers within circular progress bars or knobs. It is implemented using SVG, providing a versatile way to indicate specific points or milestones within the circular progress.

```html
   <div class="orbit-3 ">
      <svg class="svg-pod">
          <circle class="markers" /> 
        </svg>
    </div>
```

### `modal` (Coming Soon)

The `modal` component, coming soon to Zumer, will provide a convenient way to display modal windows within the radial UI.

### `popover` (Coming Soon)

The `popover` component, also coming soon, will offer a user-friendly and customizable way to present popovers within the radial UI.
