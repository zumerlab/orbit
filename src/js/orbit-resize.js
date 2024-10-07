
let Orbit = {}

Orbit = {
    resize: (parentElementSelector) => {
        const parentElement = document.querySelector(parentElementSelector);
    
        if (!parentElement) {
        console.error(`Not found: ${parentElementSelector}`);
        return;
        }
        const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width } = entry.contentRect;

            const childElements = parentElement.querySelectorAll('.gravity-spot');
            if (childElements) {
                childElements.forEach(childElement => {
                    let gravityForce = getComputedStyle(childElement).getPropertyValue('--o-force');
                    
                    let forceRatio = width / 500
                    console.log(gravityForce, forceRatio, parseFloat(gravityForce) * forceRatio)
                    childElement.style.setProperty('--o-force-ratio', `${forceRatio}`);
                });
            
            } else {
            console.error('No gravity-spot found');
            }
        }
        });
    
        // Start observing the parent element
        resizeObserver.observe(parentElement);
    }
}

export {Orbit}
