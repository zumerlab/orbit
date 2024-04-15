
/*
* orbit
* v.0.4.0
* Author Juan Martin Muda
* License MIT
**/
(() => {
    // test/web-components/orbit-progress.js
    var OrbitProgress = class extends HTMLElement {
      connectedCallback() {
        this.update();
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes") {
              this.update();
            }
          });
        });
        observer.observe(this, { attributes: true });
      }
      update() {
        const svg = this.createSVGElement();
        const progressArc1 = this.createProgressArc(true);
        svg.appendChild(progressArc1);
        const progressArc = this.createProgressArc();
        svg.appendChild(progressArc);
        this.innerHTML = "";
        this.appendChild(svg);
      }
      createSVGElement() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("width", this.getAttribute("width") || "100%");
        svg.setAttribute("height", this.getAttribute("height") || "100%");
        return svg;
      }
      createProgressArc(full) {
        const progressArc = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const {
          strokeWidth,
          realRadius,
          ellipseX,
          ellipseY,
          progressBarColor,
          progressBgColor,
          lineCap,
          maxAngle
        } = this.getAttributes();
        const angle = this.getProgressAngle(maxAngle, full);
        const { d } = this.calculateArcParameters(
          angle,
          realRadius,
          ellipseX,
          ellipseY
        );
        progressArc.setAttribute("d", d);
        progressArc.setAttribute(
          "stroke",
          full ? progressBgColor : progressBarColor
        );
        progressArc.setAttribute("stroke-width", strokeWidth);
        progressArc.setAttribute("fill", "transparent");
        progressArc.setAttribute("stroke-linecap", lineCap);
        progressArc.setAttribute("vector-effect", "non-scaling-stroke");
        return progressArc;
      }
      getAttributes() {
        const orbitRadius = parseFloat(
          getComputedStyle(this).getPropertyValue("r") || 0
        );
        const range = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-range") || 360
        );
        const lineCap = getComputedStyle(this).getPropertyValue("--o-linecap") || "butt";
        const ellipseX = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-ellipse-x") || 1
        );
        const ellipseY = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-ellipse-y") || 1
        );
        const progress = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-progress") || this.getAttribute("value") || 0
        );
        const progressBarColor = this.getAttribute("bar-color") || "orange";
        const progressBgColor = this.getAttribute("bg-color") || "transparent";
        const strokeWidth = parseFloat(
          getComputedStyle(this).getPropertyValue("stroke-width") || 1
        );
        let strokeWithPercentage = strokeWidth / 2 * 100 / orbitRadius / 2;
        let innerOuter = strokeWithPercentage;
        if (this.classList.contains("outer")) {
          innerOuter = strokeWithPercentage * 2;
        }
        if (this.classList.contains("inner")) {
          innerOuter = 0;
        }
        const realRadius = 50 + innerOuter - strokeWithPercentage;
        const maxAngle = range;
        return {
          orbitRadius,
          lineCap,
          ellipseX,
          ellipseY,
          progress,
          progressBarColor,
          progressBgColor,
          strokeWidth,
          realRadius,
          maxAngle
        };
      }
      getProgressAngle(maxAngle, full) {
        const progress = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-progress") || this.getAttribute("value") || 0
        );
        const maxValue = parseFloat(this.getAttribute("max")) || 100;
        return full ? (maxValue - 1e-3) / maxValue * maxAngle : progress / maxValue * maxAngle;
      }
      calculateArcParameters(angle, realRadius, ellipseX, ellipseY) {
        const radiusX = realRadius / ellipseX;
        const radiusY = realRadius / ellipseY;
        const startX = 50 + radiusX * Math.cos(-Math.PI / 2);
        const startY = 50 + radiusY * Math.sin(-Math.PI / 2);
        const endX = 50 + radiusX * Math.cos((angle - 90) * Math.PI / 180);
        const endY = 50 + radiusY * Math.sin((angle - 90) * Math.PI / 180);
        const largeArcFlag = angle <= 180 ? 0 : 1;
        const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`;
        return { startX, startY, endX, endY, largeArcFlag, d };
      }
    };
  
    // test/web-components/orbit-sector.js
    function calcularExpresionCSS(cssExpression) {
      const match = cssExpression.match(/calc\(([\d.]+)(deg)\s*\/\s*(\d+)\)/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];
        const divisor = parseInt(match[3]);
        if (unit === "deg" && divisor >= 1 && divisor <= 12) {
          return value / divisor;
        }
      }
    }
    var OrbitSector = class extends HTMLElement {
      connectedCallback() {
        this.update();
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes") {
              this.update();
            }
          });
        });
        observer.observe(this, { attributes: true });
      }
      update() {
        const svg = this.createSVGElement();
        const sectorArc = this.createSectorArc();
        svg.appendChild(sectorArc);
        this.innerHTML = "";
        this.appendChild(svg);
      }
      createSVGElement() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("width", this.getAttribute("width") || "100%");
        svg.setAttribute("height", this.getAttribute("height") || "100%");
        return svg;
      }
      createSectorArc() {
        const sectorArc = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const { strokeWidth, realRadius, sectorColor, gap } = this.getAttributes();
        const angle = this.calculateAngle();
        const { d } = this.calculateArcParameters(angle, realRadius, gap);
        sectorArc.setAttribute("d", d);
        sectorArc.setAttribute("stroke", sectorColor);
        sectorArc.setAttribute("stroke-width", strokeWidth);
        sectorArc.setAttribute("fill", "transparent");
        sectorArc.setAttribute("vector-effect", "non-scaling-stroke");
        return sectorArc;
      }
      getAttributes() {
        const orbitRadius = parseFloat(
          getComputedStyle(this).getPropertyValue("r") || 0
        );
        const gap = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-gap") || 1e-3
        );
        const sectorColor = this.getAttribute("sector-color") || "#00ff00";
        const rawAngle = getComputedStyle(this).getPropertyValue("--o-angle");
        const strokeWidth = parseFloat(
          getComputedStyle(this).getPropertyValue("stroke-width") || 1
        );
        let strokeWithPercentage = strokeWidth / 2 * 100 / orbitRadius / 2;
        let innerOuter = strokeWithPercentage;
        if (this.classList.contains("outer-orbit")) {
          innerOuter = strokeWithPercentage * 2;
        }
        if (this.classList.contains("inner-orbit")) {
          innerOuter = 0;
        }
        const realRadius = 50 + innerOuter - strokeWithPercentage;
        const sectorAngle = calcularExpresionCSS(rawAngle);
        return {
          orbitRadius,
          strokeWidth,
          realRadius,
          sectorColor,
          gap,
          sectorAngle
        };
      }
      calculateAngle() {
        const { sectorAngle, gap } = this.getAttributes();
        return sectorAngle - gap;
      }
      calculateArcParameters(angle, realRadius, gap) {
        const radiusX = realRadius / 1;
        const radiusY = realRadius / 1;
        const startX = 50 + gap + radiusX * Math.cos(-Math.PI / 2);
        const startY = 50 + radiusY * Math.sin(-Math.PI / 2);
        const endX = 50 + radiusX * Math.cos((angle - 90) * Math.PI / 180);
        const endY = 50 + radiusY * Math.sin((angle - 90) * Math.PI / 180);
        const largeArcFlag = angle <= 180 ? 0 : 1;
        const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`;
        return { startX, startY, endX, endY, largeArcFlag, d };
      }
    };
  
    // test/web-components/orbit-label.js
    function calcularExpresionCSS2(cssExpression) {
      const match = cssExpression.match(/calc\(([\d.]+)(deg)\s*\/\s*(\d+)\)/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];
        const divisor = parseInt(match[3]);
        if (unit === "deg" && divisor >= 1 && divisor <= 12) {
          return value / divisor;
        }
      }
    }
    var OrbitLabel = class extends HTMLElement {
      connectedCallback() {
        this.update();
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes") {
              this.update();
            }
          });
        });
        observer.observe(this, { attributes: true });
      }
      update() {
        const svg = this.createSVGElement();
        const pathId = `o-${Math.random().toString(36).substr(2, 9)}`;
        const path = this.createPathElement(pathId);
        const text = this.createTextPath(pathId);
        svg.appendChild(path);
        svg.appendChild(text);
        this.innerHTML = "";
        this.appendChild(svg);
      }
      createSVGElement() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("width", this.getAttribute("width") || "100%");
        svg.setAttribute("height", this.getAttribute("height") || "100%");
        return svg;
      }
      createPathElement(pathId) {
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const { strokeWidth, realRadius, sectorColor, gap } = this.getAttributes();
        const angle = this.calculateAngle();
        const { d } = this.calculateArcParameters(angle, realRadius, gap);
        path.setAttribute("id", pathId);
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "none");
        path.setAttribute("stroke-width", strokeWidth);
        path.setAttribute("vector-effect", "non-scaling-stroke");
        return path;
      }
      createTextPath(pathId) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const textPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "textPath"
        );
        textPath.setAttribute("href", `#${pathId}`);
        textPath.setAttribute("alignment-baseline", "middle");
        textPath.textContent = this.textContent;
        text.appendChild(textPath);
        return text;
      }
      textContentNode() {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.textContent = this.textContent;
        return text;
      }
      getAttributes() {
        const orbitRadius = parseFloat(
          getComputedStyle(this).getPropertyValue("r") || 0
        );
        const gap = parseFloat(
          getComputedStyle(this).getPropertyValue("--o-gap") || 1e-3
        );
        const sectorColor = this.getAttribute("sector-color") || "#00ff00";
        const rawAngle = getComputedStyle(this).getPropertyValue("--o-angle");
        const strokeWidth = parseFloat(
          getComputedStyle(this).getPropertyValue("stroke-width") || 1
        );
        let strokeWithPercentage = strokeWidth / 2 * 100 / orbitRadius / 2;
        let innerOuter = strokeWithPercentage;
        if (this.classList.contains("outer-orbit")) {
          innerOuter = strokeWithPercentage * 2;
        }
        if (this.classList.contains("inner-orbit")) {
          innerOuter = 0;
        }
        const realRadius = 50 + innerOuter - strokeWithPercentage;
        const sectorAngle = calcularExpresionCSS2(rawAngle);
        return {
          orbitRadius,
          strokeWidth,
          realRadius,
          sectorColor,
          gap,
          sectorAngle
        };
      }
      calculateAngle() {
        const { sectorAngle, gap } = this.getAttributes();
        return sectorAngle - gap;
      }
      calculateArcParameters(angle, realRadius, gap) {
        const radiusX = realRadius / 1;
        const radiusY = realRadius / 1;
        const startX = 50 + gap + radiusX * Math.cos(-Math.PI / 2);
        const startY = 50 + radiusY * Math.sin(-Math.PI / 2);
        const endX = 50 + radiusX * Math.cos((angle - 90) * Math.PI / 180);
        const endY = 50 + radiusY * Math.sin((angle - 90) * Math.PI / 180);
        const largeArcFlag = angle <= 180 ? 0 : 1;
        const d = `M ${startX},${startY} A ${radiusX},${radiusY} 0 ${largeArcFlag} 1 ${endX},${endY}`;
        return { startX, startY, endX, endY, largeArcFlag, d };
      }
    };
  
    // test/web-components/orbit-resize.js
    var Orbit = {};
    Orbit = {
      resize: (parentElementSelector) => {
        const parentElement = document.querySelector(parentElementSelector);
        if (!parentElement) {
          console.error(`No se encontr\xF3 ning\xFAn elemento con el selector ${parentElementSelector}`);
          return;
        }
        const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const { width } = entry.contentRect;
            const childElement = parentElement.querySelector(".orbital-zone");
            if (childElement) {
              childElement.style.setProperty("--o-lenght", `${width}px`);
            } else {
              console.error("No se encontr\xF3 ning\xFAn elemento hijo con la clase .child-element");
            }
          }
        });
        resizeObserver.observe(parentElement);
      }
    };
  
    // test/orbit.js
    customElements.define("o-progress", OrbitProgress);
    customElements.define("o-sector", OrbitSector);
    customElements.define("o-label", OrbitLabel);
    window.Orbit = Orbit;
  })();
  