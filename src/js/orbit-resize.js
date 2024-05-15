/*! 
## Orbit.resize

Resize is currently the only method of Orbit. 

### Install

```html
<body>
    <div class="orbit-zone">
    <!-- Orbit app -->
    </div>
    <script scr="orbit-resize.js">

    </script>
</body>

```

### Usage

```html
<div class="wrapper">
    <div class="orbit-zone">
    <!-- Orbit app -->
    </div>
</div>
```


```js
<script scr="orbit-resize.js">
    Orbit.resize('.wrapper')
</script>

```


*/
let Orbit = {}

Orbit = {
    resize: (parentElementSelector) => {
        const parentElement = document.querySelector(parentElementSelector);
    
        if (!parentElement) {
        console.error(`No se encontró ningún elemento con el selector ${parentElementSelector}`);
        return;
        }
        const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width } = entry.contentRect;
            console.log(width)
            const childElement = parentElement.querySelector('.orbit-zone');
            if (childElement) {
            childElement.style.setProperty('--o-lenght', `${width}px`);
            } else {
            console.error('No se encontró ningún elemento hijo con la clase .child-element');
            }
        }
        });
    
        // Start observing the parent element
        resizeObserver.observe(parentElement);
    }
}

export {Orbit}
