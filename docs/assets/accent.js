// One accent color for the whole site, a different one on each visit.
// Pages and example frames read it from --accent. The accent takes the
// place of teal in the examples' palette, and teal takes the place the accent
// had, so charts with several colors never show the same hue twice.
(() => {
  const PALETTE = [
    ['teal', '#4fd1c5'],
    ['violet', '#a78bfa'],
    ['amber', '#ffb547'],
    ['blue', '#60a5fa'],
    ['coral', '#ff7a6b'],
    ['lime', '#a3e635'],
  ];
  let index = 0;
  try {
    const kept = sessionStorage.getItem('orbit-accent');
    if (kept !== null) index = Number(kept);
    else {
      index = (Number(localStorage.getItem('orbit-accent-last') ?? -1) + 1) % PALETTE.length;
      localStorage.setItem('orbit-accent-last', String(index));
      sessionStorage.setItem('orbit-accent', String(index));
    }
  } catch { /* storage blocked: stay on the first one */ }
  const [name, hex] = PALETTE[index] || PALETTE[0];
  const vars = { '--accent': hex };
  if (name !== 'teal') vars[`--${name}`] = PALETTE[0][1];
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
  // The favicon takes the accent too.
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104" fill="none" stroke="${hex}" stroke-width="8"><path d="M52 9a43 43 0 1 1-43 43"/><path d="M52 29a23 23 0 1 0 23 23"/><circle cx="21.594" cy="21.594" r="6.5" fill="${hex}" stroke="none"/></svg>`;
  const setIcon = () => {
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = 'data:image/svg+xml,' + encodeURIComponent(icon);
  };
  setIcon();
  document.addEventListener('DOMContentLoaded', setIcon, { once: true });
  window.OrbitAccent = { name, hex, vars };
})();
