
<p align="center">
  <a href="http://zumerlab.github.io/orbit-docs">
    <img src="https://raw.githubusercontent.com/zumerlab/orbit-docs/main/public/favicon.svg" width="200">
  </a>
</p>

<p align="center">
  <b>The CSS radial UI composer.</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zumer/orbit"><img src="https://img.shields.io/github/package-json/v/zumerlab/orbit"></a>

</p>

<p align="center">
  Get involved and leave a star. <a href="https://github.com/zumerlab/orbit/stargazers"> <img src="https://img.shields.io/github/stars/zumerlab/orbit.svg?label=%E2%98%85%20Stars&logo=-&style=social"></a>
  
</p>

## Orbit in short

**Orbit** is a CSS framework designed to create radial UI designs effortlessly. It provides intuitive CSS classes and standard web components for building radial menus, dashboards, creative portfolios, or a cutting-edge applications.

### Status

We’re in the early stages of development, things are still evolving. You’re welcome to explore and experiment, but keep in mind that names, features, and functionalities may change as we refine our project. We appreciate your understanding and flexibility during this exciting phase!

### Installation & quick start

This guide will help you quickly get started and install everything you need.

#### Step 1: Include Orbit stylesheet

To start using Orbit, include its CSS in your HTML file. You have two options:

1. **Download or Import the CSS file**:
   - **Download**: Download the CSS file from [here](https://unpkg.com/@zumer/orbit@latest/dist/orbit.css) and link it in your HTML file:
     ```html
     <head>
       <link rel="stylesheet" href="path/to/orbit.css">
     </head>
     ```
   - **Import**: Add the following to your stylesheet:
     ```css
     @import url('path/to/orbit.css');
     ```

2. **Include via CDN**:
   - Add this to your HTML file:
     ```html
     <head>
       <link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@latest/dist/orbit.css">
     </head>
     ```

#### Step 2: Include Orbit JavaScript (Recommended)

If you plan to use additional features like radial progress bars, curved text, and slices, include Orbit's JavaScript. You can do this in two ways:

1. **Download the JavaScript file**:
   - Download from [here](https://unpkg.com/@zumer/orbit@latest/dist/orbit.js).
   - Link it in your HTML file:
     ```html
     <head>
       <script src="path/to/orbit.js" defer></script>
     </head>
     ```

2. **Include via CDN**:
   - Add this to your HTML file:
     ```html
     <head>
       <script src="https://unpkg.com/@zumer/orbit@latest/dist/orbit.js" defer></script>
     </head>
     ```

#### Step 3: Set up Orbit layout

Now, create a container with the `gravity-spot` class, and within it, add a radial layout using the `orbit` class. Inside the `orbit`, add radial elements, such us: `satellite` class or `o-text` web component . Here’s a minimal working example:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/path/to/orbit.css" />
    <script src="/path/to/orbit.js" defer></script>
    <title>Orbit Quick Start</title>
  </head>
  <body>
    <div class="bigbang">
      <div class="gravity-spot">
        <div class="orbit">
          <div class="satellite">1</div>
          <div class="satellite">2</div>
          <div class="satellite">3</div>
        </div>
        <div class="orbit">
          <o-text>Curved text</o-text>
        </div>
      </div>
    </div>
  </body>
</html>
```

#### Step 4: Install via Package Manager (Optional)

You can also install Orbit using npm or yarn for easier management in your project:

```sh
npm install @zumer/orbit
```

### Next steps

Check our detailed docs [here.](https://zumerlab.github.io/orbit-docs)
