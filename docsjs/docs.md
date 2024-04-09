## orbit-progress

 
## o-progress

`<o-progress>` is a standard web-component for rendering a radial progress bar. 
It has a progress bar and a range bar.

It has some special attributes and css variables to customize it:
  - Attribute `value`: To set a number that represents the progress bar value.
  - Attribute `max`: To set the max allowed `value`.
  - Attribute `bar-color`: To set a color for progress bar. Default `orange`
  - Attribute `bg-color`: To set a color for range bar. Default `transparent`

  - Class `.rounded`: to set ending caps. Default 'butt'
  - Class utility `.range-*`: Default '360deg'
  - Class utility `.begint-at-*`: Default '0deg'
  - Class utility `.inner`: To place `o-progress` at a "low-orbit". Default midle-orbit
  - Class utility `.outer`: To place `o-progress` at a "high-orbit". Default midle-orbit

  - CSS styles. User can customize `o-progress` by adding CSS properties to `o-progress path` 
  
**Important:** `<o-progress>` can only be used into `.orbit` or `.orbit-*`

### Usage

```html
<div class="orbit"> 
  <o-progress value="75" max="100" class="rounded" />
</div>
```


## orbit-sector

 
## o-sector

`<o-sector>` is a standard web-component for rendering a radial slices or pies . 

It has some special attributes and css variables to customize it:
  - Attribute `sector-color`: To set a color for sector. Default `orange`

  - Class `.gap-*` applied on `.orbit` or `.orbit-*` or in `<o-sector>`: to set gap space. Default '0'
  - Class utility `.range-*` applied on `.orbit` or `.orbit-*`: Default '360deg'
  - Class utility `.begint-at-*` applied on `.orbit` or `.orbit-*`: Default '0deg'
  - Class utility `.inner`: To place `o-sector` at a "low-orbit". Default midle-orbit
  - Class utility `.outer`: To place `o-sector` at a "high-orbit". Default midle-orbit

  - CSS styles. User can customize `o-sector` by adding CSS properties to `o-sector path`
  
**Important:** 

  - `<o-sector>` can only be used into `.orbit` or `.orbit-*`.
  - `<o-sector>` doesn't support ellipse shape. See `.orbit` section for more information.

### Usage

```html
<div class="orbit range-180"> 
  <o-sector />
  <o-sector class="gap-5" />
  <o-sector class="gap-10" />
  <o-sector class="gap-5" />
</div>
```


