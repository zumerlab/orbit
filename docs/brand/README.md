# Orbit · identidad radial

## Referencia y dirección

Referencia principal: el logo del [sitio oficial de Zumerlab](https://zumerlab.com/), consultado el 26 de octubre de 2026, y su fuente local `zumerlab.github.io/docs/logo.svg`. Usa dos arcos concéntricos, trazo uniforme, extremos rectos y un núcleo sólido en cian `#0abdf6`. Los SVG históricos de Descargas usan un aro y un círculo desplazado.

Orbit conserva el vocabulario de arcos concéntricos y el cian de familia. El núcleo sale del centro y ocupa el hueco superior izquierdo del aro exterior: pasa a ser un satélite. El arco interior cambia de orientación y deja el centro vacío. El espacio negativo dibuja una O y expresa composición radial, sin elipses, perspectiva planetaria, brillos ni degradados.

Contrato visual: una tinta; viewBox cuadrado 104 × 104; trazo de 8 unidades; círculo de 13 unidades de diámetro; márgenes incorporados; geometría idéntica en todas las variantes. A 16 px el trazo mide 1.23 px. No deformar la proporción ni añadir detalles a tamaños pequeños.

## Archivos y uso

- `orbit-mark.svg`: símbolo estático oscuro para fondos claros.
- `orbit-mark-light.svg`: símbolo estático claro para fondos oscuros.
- `orbit-mark-animated.svg`: símbolo cian con CSS interno, válido como imagen externa o SVG inline.
- `favicon.svg`: símbolo estático con adaptación a la preferencia de tema.
- Los archivos raíz `orbit-logo-negro.svg` y `orbit-logo-blanco.svg` conservan sus nombres para los consumidores existentes, incluido el README.

Header: 32–40 px. Hero: 104–160 px. Favicon: versión estática a 16–32 px. El nombre Orbit se compone con la tipografía del sitio, separado del símbolo.

```html
<img src="brand/orbit-mark-animated.svg" width="36" height="36" alt="Orbit">
<link rel="icon" type="image/svg+xml" href="brand/favicon.svg">
```

Si el nombre Orbit ya aparece junto a la imagen, usar `alt=""` para evitar repetirlo. En SVG inline, `currentColor` hereda el color del contenedor si se elimina el atributo `color` del elemento raíz. En `<img>`, el color pertenece al archivo SVG; el CSS del documento no entra en él.

## Movimiento e integración

Una sola oscilación de 4.8 segundos: el satélite gira 14° alrededor del centro y el arco interior contragira 10°. Ambos vuelven exactamente al dibujo original y se detienen; no hay movimiento continuo durante la lectura. `prefers-reduced-motion: reduce` elimina la animación desde el primer fotograma. Sin JavaScript ni SMIL.

Integrado en la cabecera de demos, la cabecera del playground, el hero del ejemplo landing y los favicons de demos que usaban `data:,`. Los selectores de animación están encapsulados dentro del SVG y usan el prefijo `orbit-brand-`.

La API, los exports, el registro de custom elements, las clases geométricas, las variables `--o-*` y los archivos del motor no necesitan cambios. Los assets de marca son del sitio y no se agregan al paquete npm.

Los archivos `/mnt/data/orbit.js` y `/mnt/data/orbit.css` no estaban disponibles en esta sesión. Se revisaron `src/orbit.js`, `src/js/orbit-resize.js`, `src/orbit.scss` y las compilaciones locales `dist/orbit.js` y `dist/orbit.css`. No se afirma equivalencia con los adjuntos ausentes.
