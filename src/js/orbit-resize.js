import { refreshLayout, warnOnce } from './orbit-layout.js';

const resizing = new WeakMap();
const FIXED = /^[+-]?(?:\d+\.?\d*|\.\d+)px$/;

const Orbit = {
  refresh: refreshLayout,

  /**
   * Scale systems that use a fixed px --o-force with their container's width
   * (500px wide = ratio 1). Systems on the default --o-force already follow
   * their .bigbang, so they are left alone.
   */
  resize(parentElementSelector) {
    const parent = typeof parentElementSelector === 'string'
      ? globalThis.document?.querySelector(parentElementSelector)
      : parentElementSelector;
    if (!parent?.ownerDocument) {
      console.error('Orbit.resize: element not found:', parentElementSelector);
      return () => {};
    }
    resizing.get(parent)?.();
    const view = parent.ownerDocument.defaultView;
    const applyRatio = width => {
      if (!(width > 0)) return;
      let fixed = 0;
      for (const element of parent.querySelectorAll('.gravity-spot')) {
        if (!FIXED.test(view.getComputedStyle(element).getPropertyValue('--o-force').trim())) continue;
        fixed++;
        const ratio = String(width / 500);
        if (element.style.getPropertyValue('--o-force-ratio') !== ratio) element.style.setProperty('--o-force-ratio', ratio);
      }
      if (!fixed) {
        warnOnce(parent, 'resize', 'Orbit.resize() has nothing to do here: every .bigbang already scales with its container. ' +
          'It only scales systems that set a fixed px --o-force.');
      }
      refreshLayout(parent);
    };
    const observer = new view.ResizeObserver(entries => {
      for (const entry of entries) applyRatio(entry.contentRect.width);
    });
    observer.observe(parent);
    applyRatio(parent.clientWidth || parent.getBoundingClientRect().width);
    const stop = () => {
      observer.disconnect();
      if (resizing.get(parent) === stop) resizing.delete(parent);
    };
    resizing.set(parent, stop);
    return stop;
  }
};

export { Orbit };
