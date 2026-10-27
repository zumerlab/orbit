// Orbit site: header, navigation, pager and live examples.
// Every page loads this file with data-root pointing at the site root
// ("" at the top level, "../" one folder down).

const script = document.currentScript;

const ROOT = new URL(script?.dataset.root || './', location.href);
const at = (path) => new URL(path, ROOT).href;

const NAV = [
  ['Start', [
    ['How Orbit thinks', 'universe.html'],
    ['Install', 'install.html'],
    ['Build a knob', 'guide.html'],
    ['Coming from 1.x', 'migrating.html'],
  ]],
  ['Elements', [
    ['Bigbang', 'reference/bigbang.html'],
    ['Gravity spot', 'reference/gravity-spot.html'],
    ['Orbits', 'reference/orbit.html'],
    ['Satellites', 'reference/satellite.html'],
    ['Capsules', 'reference/capsule.html'],
    ['Vectors', 'reference/vector.html'],
    ['Sides', 'reference/side.html'],
    ['Arcs', 'reference/arc.html'],
    ['Progress', 'reference/progress.html'],
  ]],
  ['Craft', [
    ['Depth layers', 'craft/depth.html'],
    ['Themes', 'craft/themes.html'],
    ['Colors', 'craft/colors.html'],
    ['Visual aids', 'craft/visual-aids.html'],
    ['Runtime and resizing', 'craft/runtime.html'],
  ]],
  ['Frameworks', [
    ['React', 'frameworks/react.html'],
    ['Vue', 'frameworks/vue.html'],
    ['Svelte', 'frameworks/svelte.html'],
    ['Angular', 'frameworks/angular.html'],
    ['Astro', 'frameworks/astro.html'],
  ]],
  ['Orbit Kit', [
    ['Overview', 'kit/index.html'],
    ['Shared options', 'kit/options.html'],
    ['Gauge', 'kit/gauge.html'],
    ['Donut', 'kit/donut.html'],
    ['Rings', 'kit/rings.html'],
    ['Knob', 'kit/knob.html'],
    ['Menu', 'kit/menu.html'],
    ['Instrument', 'kit/instrument.html'],
    ['Clock', 'kit/clock.html'],
    ['Compass', 'kit/compass.html'],
    ['Radar', 'kit/radar.html'],
    ['Timer', 'kit/timer.html'],
    ['Status', 'kit/status.html'],
    ['Range', 'kit/range.html'],
    ['Time picker', 'kit/time-picker.html'],
    ['Spinner', 'kit/spinner.html'],
    ['Radar chart', 'kit/radar-chart.html'],
    ['Sunburst', 'kit/sunburst.html'],
    ['Wheel', 'kit/wheel.html'],
    ['Color wheel', 'kit/color-wheel.html'],
  ]],
  ['See it working', [
    ['Examples', 'examples/index.html'],
    ['Use cases', 'use-cases/index.html'],
  ]],
];

// Compare pages the same way whether the server shows /kit/, /kit/index.html,
// /kit/index, /universe.html or /universe.
const bare = (href) => new URL(href).pathname.replace(/(index)?(\.html)?$/, '').replace(/\/$/, '');
const here = bare(location.href);
const isHere = (path) => bare(at(path)) === here;
// Pages that are not in the menu (an example, a demo) mark their section.
const section = (path) => bare(at(path)).replace(/\/[^/]*$/, '');
const inSection = (path) => path.endsWith('index.html') && path.includes('/') && here.startsWith(section(path) + '/');

// The Orbit mark, inline so it takes the accent of the visit.
const MARK = `<svg class="mark" viewBox="0 0 104 104" fill="none" stroke="currentColor" stroke-width="8" aria-hidden="true">
  <path d="M52 9a43 43 0 1 1-43 43"/>
  <path class="mark-inner" d="M52 29a23 23 0 1 0 23 23"/>
  <g class="mark-satellite"><circle cx="21.594" cy="21.594" r="6.5" fill="currentColor" stroke="none"/></g>
</svg>`;

// Kit pages point at the kit's repo; the rest at Orbit's.
const REPO = /\/kit\//.test(location.pathname) ? 'zumerlab/orbit-kit' : 'zumerlab/orbit';
const GH_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

// Star counts from the GitHub API, kept for a few hours so the page does not
// spend the visitor's rate limit. Without a count the button still works.
async function starCount(repo) {
  const key = `orbit-stars:${repo}`;
  try {
    const kept = JSON.parse(localStorage.getItem(key) || 'null');
    if (kept && Date.now() - kept.at < 6 * 3600e3) return kept.n;
  } catch { /* storage blocked */ }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const n = (await res.json()).stargazers_count;
    try { localStorage.setItem(key, JSON.stringify({ n, at: Date.now() })); } catch { /* ignore */ }
    return n;
  } catch { return null; }
}
const shortCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
function fillStars(root = document) {
  for (const g of root.querySelectorAll('.gh:empty')) g.outerHTML = GH_ICON;
  for (const a of root.querySelectorAll('a[data-repo]')) {
    starCount(a.dataset.repo).then((n) => {
      const b = a.querySelector('b');
      if (n == null || !b) return;
      b.textContent = shortCount(n);
      b.hidden = false;
      a.setAttribute('aria-label', `Star ${a.dataset.repo} on GitHub, ${n} stars`);
    });
  }
}

function header() {
  const head = document.querySelector('[data-site-head]');
  if (!head) return;
  head.className = 'site-head';
  head.innerHTML = `
    <a class="brand" href="${at('index.html')}">${MARK}Orbit</a>
    <nav class="links" aria-label="Site">
      <a href="${at('universe.html')}">Docs</a>
      <a href="${at('kit/index.html')}">Kit</a>
      <a href="${at('examples/index.html')}">Examples</a>
      <a class="star" href="https://github.com/${REPO}" data-repo="${REPO}">${GH_ICON}<span>Star</span><b hidden></b></a>
      <a class="sponsor" href="https://github.com/sponsors/tinchox5">Sponsor</a>
    </nav>
    <button class="menu-toggle" type="button" aria-expanded="false">Menu</button>`;
  // Pages without a side menu (the home page) still get one on small screens.
  if (!document.querySelector('[data-site-nav]')) {
    const extra = document.createElement('nav');
    extra.className = 'site-nav only-small';
    extra.dataset.siteNav = '';
    head.after(extra);
  }
  head.querySelector('.menu-toggle').addEventListener('click', (e) => {
    const open = document.body.classList.toggle('nav-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
}

function nav() {
  const el = document.querySelector('[data-site-nav]');
  if (!el) return;
  el.setAttribute('aria-label', 'Documentation');
  const exact = NAV.some(([, items]) => items.some(([, path]) => isHere(path)));
  el.innerHTML = NAV.map(([title, items]) => `<h2>${title}</h2><ul>${items.map(([label, path]) =>
    `<li><a href="${at(path)}"${isHere(path) ? ' aria-current="page"' : (!exact && inSection(path) ? ' aria-current="true"' : '')}>${label}</a></li>`).join('')}</ul>`).join('') +
    `<p class="nav-sponsor"><a href="https://github.com/${REPO}">Star on GitHub</a><a href="https://github.com/sponsors/tinchox5">Sponsor Orbit</a></p>`;
}

function pager() {
  const el = document.querySelector('[data-pager]');
  if (!el) return;
  const flat = NAV.flatMap(([, items]) => items);
  const i = flat.findIndex(([, path]) => isHere(path));
  if (i < 0) return;
  const prev = flat[i - 1], next = flat[i + 1];
  el.className = 'pager';
  el.innerHTML = `${prev ? `<a href="${at(prev[1])}"><small>Previous</small>${prev[0]}</a>` : ''}${next ? `<a class="next" href="${at(next[1])}"><small>Next</small>${next[0]}</a>` : ''}`;
}

// ─── Syntax highlighting ──────────────────────────────────
// A small tokenizer for the three languages of the examples (plus the shell
// and JSON in the guides). Colors come from the accent, see site.css.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (cls, s) => (s ? `<span class="hl-${cls}">${esc(s)}</span>` : '');

// Runs a list of [class, regex] rules over the text, longest-first by order.
function scan(text, rules) {
  const re = new RegExp(rules.map(([, r]) => `(${r.source})`).join('|'), 'gy');
  let out = '', last = 0, m;
  const any = new RegExp(re.source, 'g');
  while ((m = any.exec(text))) {
    if (m[0] === '') { any.lastIndex++; continue; }
    out += esc(text.slice(last, m.index));
    const i = m.slice(1).findIndex((g) => g !== undefined);
    const cls = rules[i][0];
    out += typeof cls === 'function' ? cls(m[0]) : span(cls, m[0]);
    last = any.lastIndex;
  }
  return out + esc(text.slice(last));
}

const JS_KEYWORDS = 'await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|yield|async|true|false|null|undefined';

const js = (text) => scan(text, [
  ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
  ['string', /`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/],
  ['keyword', new RegExp(`\\b(?:${JS_KEYWORDS})\\b`)],
  ['number', /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/],
  ['fn', /\b[A-Za-z_$][\w$]*(?=\s*\()/],
  ['punct', /=>|[{}()[\];,.:?]/],
]);

const cssValue = (text) => scan(text, [
  ['comment', /\/\*[\s\S]*?\*\//],
  ['string', /'[^'\n]*'|"[^"\n]*"/],
  ['var', /--[\w-]+/],
  ['number', /-?\d*\.?\d+(?:deg|turn|px|rem|em|%|ms|s|vh|vw|cqmin|cqw|cqh|fr)?\b/],
  ['fn', /\b[a-z-]+(?=\()/],
  ['punct', /[(),]/],
]);

function css(text) {
  // Declarations inside braces; selectors and at-rules outside.
  let out = '', depth = 0, i = 0;
  const parts = text.split(/(\/\*[\s\S]*?\*\/|[{}])/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('/*')) { out += span('comment', part); continue; }
    if (part === '{') { depth++; out += span('punct', part); continue; }
    if (part === '}') { depth = Math.max(0, depth - 1); out += span('punct', part); continue; }
    if (depth === 0 || /^\s*[^:;]*\{/.test(part)) {
      out += scan(part, [['at', /@[\w-]+/], ['selector', /[^\s,@][^,{]*?(?=\s*(?:,|$))/]]);
    } else {
      // property: value; pairs, but a nested rule (@media) has selectors inside.
      out += part.split(/(;)/).map((decl) => {
        if (decl === ';') return span('punct', decl);
        const m = decl.match(/^(\s*)([\w-]+)(\s*:)([\s\S]*)$/);
        if (!m) return scan(decl, [['selector', /[^\s][^,]*?(?=\s*(?:,|$))/]]);
        return esc(m[1]) + span(m[2].startsWith('--') ? 'var' : 'prop', m[2]) + span('punct', m[3]) + cssValue(m[4]);
      }).join('');
    }
    i++;
  }
  return out;
}

function html(text) {
  let out = '', last = 0, m;
  const re = /<!--[\s\S]*?-->|<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>|<\/?[a-zA-Z][\w-]*(?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g;
  const tag = (t) => {
    const mm = t.match(/^(<\/?)([\w-]+)([\s\S]*?)(\/?>)$/);
    if (!mm) return esc(t);
    const attrs = mm[3].replace(/([^\s=]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+))?|(\s+)/g, (a, name, eq, val, ws) => {
      if (ws) return ws;
      if (!name) return esc(a);
      let v = '';
      if (val !== undefined) {
        const inner = val.replace(/^["']|["']$/g, '');
        v = span('punct', eq) + (name === 'style'
          ? span('string', val[0]) + cssValue(inner) + span('string', val.at(-1))
          : span('string', val));
      }
      return span('attr', name) + v;
    });
    return span('punct', mm[1]) + span('tag', mm[2]) + attrs + span('punct', mm[4]);
  };
  while ((m = re.exec(text))) {
    out += esc(text.slice(last, m.index));
    if (m[0].startsWith('<!--')) out += span('comment', m[0]);
    else if (m[1]) {
      const open = m[0].slice(0, m[0].indexOf('>') + 1);
      out += tag(open) + (m[1] === 'style' ? css(m[3]) : js(m[3])) + tag(`</${m[1]}>`);
    } else out += tag(m[0]);
    last = re.lastIndex;
  }
  return out + esc(text.slice(last));
}

const sh = (text) => scan(text, [
  ['comment', /#[^\n]*/],
  ['string', /'[^'\n]*'|"[^"\n]*"/],
  ['keyword', /^(?:npm|npx|pnpm|yarn|node|cd|git)\b/m],
]);

const json = (text) => scan(text, [
  ['attr', /"(?:\\.|[^"\\])*"(?=\s*:)/],
  ['string', /"(?:\\.|[^"\\])*"/],
  ['number', /-?\d+(?:\.\d+)?/],
  ['keyword', /\b(?:true|false|null)\b/],
  ['punct', /[{}[\],:]/],
]);

const LANGS = { html, xml: html, vue: html, svelte: html, astro: html, css, js, javascript: js, ts: js, jsx: js, tsx: js, mjs: js, sh, bash: sh, shell: sh, json };

function guess(text) {
  const t = text.trim();
  if (/^</.test(t)) return 'html';
  if (/^(npm|npx|pnpm|yarn|node|git|cd)\b/.test(t)) return 'sh';
  if (/^[{[]/.test(t) && /"\s*:/.test(t)) return 'json';
  if (/^(import|export|const|let|var|function|document|window|\/\/)/m.test(t) && !/^[.#:\w-][^{]*\{\s*[\w-]+\s*:/m.test(t)) return 'js';
  if (/[.#:\w-][^{]*\{[^}]*:[^}]*;?\s*\}/.test(t) || /^\s*--[\w-]+\s*:/m.test(t)) return 'css';
  return 'js';
}

function highlight(text, lang) {
  const fn = LANGS[lang] || LANGS[guess(text)];
  try { return fn(text); } catch { return esc(text); }
}

function highlightBlocks(root = document) {
  for (const code of root.querySelectorAll('pre > code:not([data-hl])')) {
    const lang = (code.className.match(/language-(\w+)/) || [])[1];
    code.innerHTML = highlight(code.textContent, lang);
    code.dataset.hl = '';
  }
}

// ─── Live examples ─────────────────────────────────────────
// <figure class="example" data-height="300" [data-kit] [data-light]>
//   <template data-html>…</template> <template data-css>…</template> <template data-js>…</template>
// </figure>

const dedent = (text) => {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n');
  const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(pad)).join('\n');
};

// Every example shares the demos' look: assets/frame.css, inlined so that
// "Copy page" gives a page that works on its own.
let frameCSS = '';
const frameReady = fetch(at('assets/frame.css')).then((r) => (r.ok ? r.text() : '')).then((t) => { frameCSS = t; }, () => {});

// The accent of this visit (assets/accent.js) reaches the examples too.
const accentCSS = () => {
  const vars = window.OrbitAccent?.vars;
  return vars ? `\n:root { ${Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ')} }` : '';
};

function exampleDocument({ html = '', css = '', js = '', kit = false, light = false, body = '' }, standalone = false) {
  const css1 = standalone ? 'https://unpkg.com/@zumer/orbit/dist/orbit.min.css' : at('orbit/orbit.min.css');
  const js1 = standalone ? 'https://unpkg.com/@zumer/orbit/dist/orbit.min.js' : at('orbit/orbit.min.js');
  const kitSrc = standalone ? 'https://unpkg.com/@zumer/orbit-kit/src/orbit-kit.js' : at('kit/src/orbit-kit.js');
  const classes = [light ? 'light' : '', body].filter(Boolean).join(' ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${css1}">
  <script src="${js1}"><\/script>${kit ? `\n  <script type="module" src="${kitSrc}"><\/script>` : ''}
  <style>
${frameCSS.trim()}${accentCSS()}
  </style>
  <style>
${css}
  </style>
</head>
<body${classes ? ` class="${classes}"` : ''}>
${html}
${js ? `<script>\n${js}\n<\/script>` : ''}
</body>
</html>`;
}

function example(fig, n) {
  // Code lives in <script type="text/plain" data-html|data-css|data-js>, or in a
  // <template> for HTML. Plain-text scripts keep characters like ">" as written.
  const part = (name) => {
    const t = fig.querySelector(`[data-${name}]`);
    if (!t) return '';
    return dedent(t.tagName === 'TEMPLATE' && name === 'html' ? t.innerHTML : (t.content ? t.content.textContent : t.textContent));
  };
  const state = {
    html: part('html'), css: part('css'), js: part('js'),
    kit: fig.hasAttribute('data-kit'), light: fig.hasAttribute('data-light'), body: fig.dataset.body || '',
  };
  const frame = document.createElement('iframe');
  frame.className = 'preview';
  frame.title = fig.dataset.title || `Example ${n + 1}`;
  frame.loading = 'lazy';
  frame.style.height = `${parseInt(fig.dataset.height || '300', 10)}px`;
  frame.style.background = state.light ? '#f6f7f9' : '#0c0f13';
  const render = () => frameReady.then(() => { frame.srcdoc = exampleDocument(state); });

  const tabs = ['html', 'css', 'js'].filter((k) => state[k]);
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML = tabs.map((k) => `<button type="button" data-tab="${k}" aria-selected="false">${k.toUpperCase()}</button>`).join('') +
    '<span class="spacer"></span><button type="button" data-act="copy">Copy page</button>';
  const code = document.createElement('div');
  code.className = 'code';
  // The textarea is transparent over a highlighted copy of its text.
  const shade = document.createElement('pre');
  shade.className = 'hl';
  shade.setAttribute('aria-hidden', 'true');
  const area = document.createElement('textarea');
  area.spellcheck = false;
  area.setAttribute('autocapitalize', 'off');
  area.setAttribute('autocomplete', 'off');
  area.setAttribute('aria-label', 'Example code');
  code.append(shade, area);
  const paint = () => {
    // A trailing newline needs a character after it to take up a line.
    shade.innerHTML = highlight(area.value, tab) + '\n ';
    shade.scrollTop = area.scrollTop;
    shade.scrollLeft = area.scrollLeft;
  };
  area.addEventListener('scroll', () => { shade.scrollTop = area.scrollTop; shade.scrollLeft = area.scrollLeft; });
  let tab = null;
  bar.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'copy') {
      await frameReady;
      await navigator.clipboard?.writeText(exampleDocument(state, true));
      b.textContent = 'Copied';
      setTimeout(() => { b.textContent = 'Copy page'; }, 1200);
      return;
    }
    const k = b.dataset.tab;
    const closing = tab === k && fig.classList.contains('open');
    fig.classList.toggle('open', !closing);
    tab = closing ? null : k;
    for (const t of bar.querySelectorAll('[data-tab]')) t.setAttribute('aria-selected', String(t.dataset.tab === tab));
    if (tab) {
      area.value = state[tab];
      area.style.height = 'auto';
      area.style.height = `${Math.min(520, Math.max(180, area.scrollHeight + 4))}px`;
      paint();
    }
  });
  let timer;
  area.addEventListener('input', () => {
    if (!tab) return;
    state[tab] = area.value;
    paint();
    clearTimeout(timer);
    timer = setTimeout(render, 300);
  });
  area.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end');
    area.dispatchEvent(new Event('input'));
  });
  const cap = fig.querySelector('figcaption');
  fig.insertBefore(frame, cap);
  fig.insertBefore(bar, cap);
  fig.insertBefore(code, cap);
  render();
}

header();
nav();
pager();
document.querySelectorAll('figure.example').forEach(example);
highlightBlocks();
fillStars();
