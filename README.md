
<p align="center">
  <a href="http://zumerlab.github.io/orbit-docs">
    <img src="https://raw.githubusercontent.com/zumerlab/orbit-docs/main/public/images/orbithero.gif" width="100%">
  </a>
</p>
<p align="center">
  <a href="#installation"><b>⚙️ Install</b></a> •
  <a href="#features"><b>🤖 Features</b></a> •
  <a href="#examples"><b>🎮 Examples</b></a> •
  <a href="https://zumerlab.github.io/orbit-docs" target="_blank"><b>📚 Docs</b></a> •
  <a href="https://github.com/zumerlab/orbit/discussions" target="_blank"><b>💬 Github Discussions</b></a> •
  <a href="https://t.me/ZumlyCommunity" target="_blank"><b>🧑‍💻 Telegram Group</b></a>
</p>
<p align="center">
  <b>Use Orbit to create amazing radial UIs using CSS only!</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zumer/orbit"><img src="https://img.shields.io/github/package-json/v/zumerlab/orbit"></a>
</p>

<p align="center">
  <a href="#stay-in-orbit"><b>Get involved</b></a>, leave a star <a href="https://github.com/zumerlab/orbit/stargazers"> <img src="https://img.shields.io/github/stars/zumerlab/orbit.svg?label=%E2%98%85%20Stars&logo=-&style=social"></a>
</p>


## 🖖 Orbit in a nutshell

**Orbit** is the first general-purpose CSS framework designed specifically for radial user interfaces. We've used the latest CSS features to make building radial layouts a breeze. It provides intuitive CSS classes and Custom Elements for building radial menus, dashboards, creative portfolios, or a cutting-edge applications.

## Why Orbit?

Because creating radial UIs generally involves resorting to JS or other languages to calculate angles, radius, distances, etc. **Orbit** helps and saves you a lot of time by allowing you to build these UIs with just CSS.

## Status
> We’re in the early stages of development, things are still evolving. You’re welcome to explore and experiment, but keep in mind that names, features, and functionalities may change as we refine our project. We appreciate your understanding and flexibility during this exciting phase!

## What is radial UI?

Radial UI refers to a design paradigm where elements are organized and laid out in a circular or radial pattern, rather than the traditional grid-based or linear layouts. This approach can create visually appealing and intuitive interfaces, especially for applications that involve:

- Circular data visualization (e.g., pie charts, multi-level pie charts, gauges, watch faces)
- Navigation menus or controls (e.g., radial or pie menus, circular scrolling)
- Dashboards (e.g., car dashboards, infotainment, smart-home dashboards)
- Landing pages (e.g., Orbit website landing page)

**Characteristics of Radial UI:**

- Circular layout: Elements are arranged in a circular or curved pattern.
- Center-focused: The center of the circle often serves as a focal point.
- Symmetry: Radial UIs often exhibit symmetry, creating a sense of balance.
- Angular relationships: Elements are positioned at specific angles relative to each other.

**Benefits of Radial UI:**

- Aesthetics: Radial designs can be visually stunning and engaging.
- Intuitive navigation: Circular layouts can simplify navigation and reduce cognitive load.
- Space efficiency: Radial UIs can make efficient use of screen real estate.

## Features

With Orbit, you can:

- ⁠Build any kind of radial UI using our predefined CSS classes that do the heavy lifting.
- ⁠Easily compose simple or complex radial designs by combining Orbit elements.
- ⁠Use Orbit alongside other traditional CSS frameworks.
- ⁠Get started quickly with our detailed documentation, examples, and guides that walk you through using Orbit's features effectively.

## 🚀 Try Orbit now!

To quickly get a taste of Orbit, you can try it directly in a [Orbit Codepen template](https://codepen.io/pen?template=KKjaoRj).

## Installation

Orbit comes with just two files: `orbit.css` (or `orbit.min.css`), and `orbit.js` (or `orbit.min.js`).

### Getting the Orbit files:

You have three ways to get **Orbit** files: 

#### 1. Download the Orbit files

- Get the **Orbit CSS file**: [orbit.css](https://unpkg.com/@zumer/orbit@latest/dist/orbit.css) or [orbit.min.css (minified)](https://unpkg.com/@zumer/orbit@latest/dist/orbit.min.css) 

- Get the **Orbit JS file**: [orbit.js](https://unpkg.com/@zumer/orbit@latest/dist/orbit.js) or [orbit.min.js (minified)](https://unpkg.com/@zumer/orbit@latest/dist/orbit.min.js) 


#### 2. Use Orbit via CDN (content delivery network)

- For latest version of **Orbit CSS file**: 

  Uncompressed version: [https://unpkg.com/@zumer/orbit@latest/dist/orbit.css](https://unpkg.com/@zumer/orbit@latest/dist/orbit.css)

  Minified version: [https://unpkg.com/@zumer/orbit@latest/dist/orbit.min.css](https://unpkg.com/@zumer/orbit@latest/dist/orbit.min.css)

- For latest version of **Orbit JS file**: 

  Uncompressed version: [https://unpkg.com/@zumer/orbit@latest/dist/orbit.js](https://unpkg.com/@zumer/orbit@latest/dist/orbit.js)

  Minified version: [https://unpkg.com/@zumer/orbit@latest/dist/orbit.min.js](https://unpkg.com/@zumer/orbit@latest/dist/orbit.min.js)


#### 3. Install Orbit via a Package Manager

You can also install Orbit using **npm** or **yarn**:

  ```sh
  npm install @zumer/orbit
  ```

  Or 

  ```sh
  yarn add @zumer/orbit
  ```

### Setting up Orbit in your project:

After install Orbit, follow this simple steps to get Orbit working.

#### Link Orbit files or CDN in your HTML file:

If you have downloaded them just use `<link> tag ` for the CSS file, and `<script> tag` for the JS file within the `<head>` section:

In case you have downloaded the files:

```html
<head>
  <link rel="stylesheet" href="path/to/orbit.css">
  <script src="path/to/orbit.js"></script>
</head>
```

In case you are using CDN:

```html
<head>
  <link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@latest/dist/orbit.css">
  <script src="https://unpkg.com/@zumer/orbit@latest/dist/orbit.js"></script>
</head>
```

> **Tip for CSS file**: You can use `@import` CSS rule in your `<style> tag` to import the **CSS file**:
> 
> Downloaded file:
> ```css
> @import url('path/to/orbit.css');
> ```
> Or via CDN:
>```css
> @import url('https://unpkg.com/@zumer/orbit@latest/dist/orbit.css');
> ```

## 🏁 Quick start

### Basic Orbit layout

Just add `.bigbang` CSS class in a HTML element like `<div>`. Then use `.gravity-spot` class, and within it, add another element with `.orbit` class. Finally, inside `.orbit` element, add radial elements, such us: `.satellite`, `.vector`, `.side`, or `<o-text>`, `<o-arc>`, `<o-progress>` web components . Here’s a minimal working example:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@latest/dist/orbit.css" />
    <script src="https://unpkg.com/@zumer/orbit@latest/dist/orbit.js" defer></script>
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

## Radial elements

### Bigbang

The foundation of every Orbit project, serving as a container for your application.

### Gravity-spot

The parent container for organizing Orbit elements within a radial layout.

### Orbit

Defines a circular path around a .gravity-spot, with variations from .orbit-0 to .orbit-24. Within .orbit element, various Orbit elements such as `satellites`, `o-arcs`, `o-progress`, `vectors`, `sides`, and `o-texts` can be positioned.

### Satellite
 
 Places elements along an .orbit or .orbit-* path, serving as content containers or nesting points for other orbits.

### Vector

Renders perpendicular lines across orbits, perfect for creating connector lines or minute marks.

### Side

Generates a regular polygon figure when used with other sides.

### O-Text

A web-component for rendering curved text.

### o-arc

A web-component for rendering radial slices, arcs, or pies.

### O-Progress

A web-component for rendering a radial progress bar.


## Examples

### A dashboard

<p align="center">
  <a href="https://zumerlab.github.io/orbit-docs/examples/#a-dashboard" target="_blank">
    <img src="https://raw.githubusercontent.com/zumerlab/orbit-docs/main/public/images/demo1.png" width="60%">
  </a>
</p>


### An orbital map

<p align="center">
  <a href="https://zumerlab.github.io/orbit-docs/examples/#an-abstract-orbital-map" target="_blank">
    <img src="https://raw.githubusercontent.com/zumerlab/orbit-docs/main/public/images/demo2.png" width="60%">
  </a>
</p>

### A watch

<p align="center">
  <a href="https://zumerlab.github.io/orbit-docs/examples/#a-watch" target="_blank">
    <img src="https://raw.githubusercontent.com/zumerlab/orbit-docs/main/public/images/demo3.png" width="60%">
  </a>
</p>

### The solar system

<p align="center">
  <a href="https://zumerlab.github.io/orbit-docs/examples/#the-solar-system" target="_blank">
    <img src="https://raw.githubusercontent.com/zumerlab/orbit-docs/main/public/images/demo4.png" width="60%">
  </a>
</p>


> **Show & Tell**:
>
> Join to [Discussion section](https://github.com/zumerlab/orbit/discussions/15) and show off what have you done with Orbit.


## 🥋 Mastering Orbit

Read the Orbit docs [here.](https://zumerlab.github.io/orbit-docs)

## Stay in orbit

There are many ways to **contribute** to **Orbit** development:

- [**Contribution guidelines**](https://github.com/zumerlab/orbit/blob/main/CONTRIBUTING.md): This guide outlines how you can contribute to Orbit, help us test and improve it, and share your experiences with the community.
- [**GitHub discussions**](https://github.com/zumerlab/orbit/discussions): Engage with other contributors, ask questions, and share your experiences.
- [**Telegram group**](https://t.me/ZumlyCommunity): Join our Telegram group for real-time discussions and updates.



## License 

[MIT](https://github.com/zumerlab/orbit/blob/main/LICENSE)



