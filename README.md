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
    <div class="z-container">
      <div class="ring-2 items-3">
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
      </div>
    </div>
  </body>
</html>
```

## Guide

Basic documentation to understand and start with Zumer CSS.

### `z-container`

The `z-container` serves as the root element to scaffold Zumer. It encapsulates the entire Zumer framework and defines the boundaries for its usage. Multiple `z-container` elements can coexist on the same page, allowing for modular and flexible implementation.

At the `z-container` level, major CSS variables are defined, providing a centralized and customizable approach to styling and theming Zumer components. These variables can be easily modified within each `z-container` instance, ensuring consistency and flexibility across different sections of your application.

### `ring-*` (probably orbit)

The `ring-*` classes act as guides for positioning other elements within the Zumer radial grid. Think of them as rows in the grid structure. They play an important role in organizing and aligning elements within the circular layout of Zumer.

Currently, there are six predefined ring levels available (`ring-1`, `ring-2`, `ring-3`...). Each ring level is separated by a distance of 50px, creating a visually pleasing spacing between elements. However, you have the flexibility to adjust the distance as needed by utilizing CSS variables.

By leveraging the `ring-*` classes, you can easily position and arrange elements within the Zumer radial grid, achieving harmonious and visually appealing circular designs.

It is possible to use multiple same level `ring-*` to stack differente elements.

### `core`

The `core` class functions similarly to a regular ring but is placed at the center of the container. It is particularly useful for positioning radial elements such as watch or gauge needles.

### `arc`

If rings resemble rows, the `arc` class can be thought of as columns in the Zumer radial grid. An `arc` is a radial segment that serves as the background support for radial designs, but also may work standalone as buttons for instance. It offers customizable options, allowing you to fine-tune its appearance to suit your specific needs.

With the `arc` class, you can customize properties such as width, gap, offset, arc length, border curvature, and more. This level of control enables you to create visually stunning and unique radial layouts.

By experimenting with different configurations, you can achieve a wide range of design aesthetics, whether you prefer a sleek and minimalistic look or a more intricate and expressive pattern.

```html
    <div class="z-container">
      <div class="ring-1 items-3">
        <div class="arc"></div>
        <div class="arc"></div>
        <div class="arc"></div>
      </div>
    </div>
```

In this example, three arcs are placed in a Ring. To draw three arcs that cover the entire ring, you need to include the `items-3` class in the ring element. Additionally, you can utilize other parent options to customize the start angle and arc length.

- Use the `offset-*` class to specify the starting angle of the arcs within the ring.
- Employ the `arc-*` class to define the length of the ring arc covered by the arcs.

### `item` (probably orbiter)

The `item` class is used to position and contain content within the Zumer radial grid. It offers various customization options, including different sizes (`xxs`, `xs`, `s`, `m`, `l`, `xl`, `xxl`), shapes (`line`, `circle`, `box`, `rounded`, `blob`), orbital position (`stationary`), and relative ring positions (`middle`, `upper`, `lower`).

One of the notable features of Zumer is the ability to nest `item` elements, allowing for complex and layered radial designs.

```html
<div class="ring-2 items-2">
  <div class="item box xl">
    <div class="ring-3 items-3">
      <div class="item rounded xxs"></div>
      <div class="item box xxs"></div>
      <div class="item xxs"></div>
    </div>
  </div>
  <div class="item l"></div>
</div>
```

### `label`

The `label` component is used to place labels on items within the Zumer radial grid. It can be customized with the same shapes as items and includes a connector line for visual clarity.

```html
  <div class="item">
     <div class="label pos-45">
      <span class="text">Hi there!</span>
    </div>
  </div>
```

### `progress` (CSS Only)

The `progress` component works with rings and is particularly useful for creating circular progress bars or knobs. It is implemented using CSS and gradient properties, allowing for easy customization and styling.

```html
  <div class="ring-1">
    <div class="z-progress" style="--progress: 75">
    </div>
  </div>
```

### `svg progress` (SVG)

The `svg progress` component also works with rings and serves the purpose of creating circular progress bars or knobs. It is implemented using SVG.

```html
   <div class="ring-3 ">
      <svg class="z-svg">
        <circle class="svg-progress" style="--val: 59;" /> 
      </svg>
    </div>
```

### `svg markers` (SVG)

The `svg markers` component, designed for rings, allows for the creation of markers within circular progress bars or knobs. It is implemented using SVG, providing a versatile way to indicate specific points or milestones within the circular progress.

```html
   <div class="ring-3 ">
      <svg class="z-svg">
          <circle class="markers" /> 
        </svg>
    </div>
```

### `modal` (Coming Soon)

The `modal` component, coming soon to Zumer, will provide a convenient way to display modal windows within the radial UI.

### `popover` (Coming Soon)

The `popover` component, also coming soon, will offer a user-friendly and customizable way to present popovers within the radial UI.
