import { refreshLayout } from './orbit-layout.js';

const resizing = new WeakMap();

const Orbit = {
  refresh: refreshLayout,

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
      for (const element of parent.querySelectorAll('.gravity-spot')) {
        const ratio = String(width / 500);
        if (element.style.getPropertyValue('--o-force-ratio') !== ratio) element.style.setProperty('--o-force-ratio', ratio);
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
