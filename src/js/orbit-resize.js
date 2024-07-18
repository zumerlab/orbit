/*! 
## Orbit.resize()

Resize is currently the only JS method of Orbit. 

### Usage

```html
<body>
    <div class="container">
        <div class="orbit-zone">
            <!-- Orbit app -->
        </div>
    </div>
    <script scr="orbit-resize.js">
        Orbit.resize('container');
    </script>
</body>
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
            const childElement = parentElement.querySelector('.orbit-zone');
            if (childElement) {
            childElement.style.setProperty('--o-length', `${width}px`);
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
