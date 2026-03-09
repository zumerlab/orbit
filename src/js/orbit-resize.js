const Orbit = {
  resize(parentElementSelector) {
    const parent = document.querySelector(parentElementSelector);
    if (!parent) {
      console.error('Orbit.resize: element not found:', parentElementSelector);
      return;
    }
    const applyRatio = (width) => {
      parent.querySelectorAll('.gravity-spot').forEach((el) => {
        el.style.setProperty('--o-force-ratio', String(width / 500));
      });
    };
    let w = parent.offsetWidth || parent.getBoundingClientRect().width;
    if (w > 0) applyRatio(w);
    else requestAnimationFrame(() => {
      w = parent.offsetWidth || parent.getBoundingClientRect().width;
      if (w > 0) applyRatio(w);
    });
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.contentRect.width > 0) applyRatio(e.contentRect.width);
      }
    });
    ro.observe(parent);
  }
};

export { Orbit };
