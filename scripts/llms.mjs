// Builds docs/llms.txt (a short index) and docs/llms-full.txt (the text of every docs page)
// from the HTML pages in docs/. Run it after changing the docs: node scripts/llms.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const SITE = 'https://zumerlab.github.io/orbit/';
const read = (p) => readFileSync(join(DOCS, p), 'utf8');

// ─── Which pages, in which order ───────────────────────────
// The navigation in site.js gives the docs order. Examples follow the gallery,
// use cases their index.
function navSections() {
  const src = read('assets/site.js');
  const block = src.slice(src.indexOf('const NAV = ['), src.indexOf('];', src.indexOf('const NAV = [')));
  const sections = [];
  for (const m of block.matchAll(/\['([^']+)', \[([\s\S]*?)\]\],/g)) {
    const items = [...m[2].matchAll(/\['([^']+)', '([^']+)'\]/g)].map((i) => ({ label: i[1], path: i[2] }));
    sections.push({ title: m[1], items });
  }
  return sections;
}

function linksIn(path, selector = /<a class="card" href="([^"#]+)/g) {
  const base = posix.dirname(path);
  return [...new Set([...read(path).matchAll(selector)].map((m) => posix.normalize(posix.join(base, m[1]))))];
}

// ─── HTML to text ──────────────────────────────────────────
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#x27': "'", mdash: '—', ndash: '–', hellip: '…', middot: '·', rarr: '→', larr: '←' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return entities[e] ?? m;
});

// Remove (or replace) whole elements, counting nested tags of the same name.
function replaceElements(html, openRe, fn) {
  let out = '', i = 0;
  const re = new RegExp(openRe.source, 'gi');
  let m;
  while ((m = re.exec(html))) {
    if (m.index < i) continue;
    const tag = m[1].toLowerCase();
    const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    tagRe.lastIndex = m.index;
    let depth = 0, end = -1, t;
    while ((t = tagRe.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) { end = tagRe.lastIndex; break; }
    }
    if (end < 0) break;
    out += html.slice(i, m.index) + fn(html.slice(m.index, end));
    i = end;
    re.lastIndex = end;
  }
  return out + html.slice(i);
}

const dedent = (text) => {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n');
  const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(pad)).join('\n');
};
const fence = (lang, code) => `\`\`\`${lang}\n${code.replace(/\s+$/, '')}\n\`\`\``;

function toText(html, pageUrl) {
  // Code is set aside while the rest is turned into text, then put back.
  const stash = [];
  const keep = (text) => `\n\n\u0000${stash.push(text) - 1}\u0000\n\n`;
  // Live examples: keep their code.
  html = replaceElements(html, /<(figure)\b[^>]*class="example[^"]*"[^>]*>/, (fig) => {
    let out = '';
    for (const kind of ['html', 'css', 'js']) {
      const m = fig.match(new RegExp(`<(script|template)[^>]*data-${kind}[^>]*>([\\s\\S]*?)</\\1>`, 'i'));
      if (m && m[2].trim()) out += keep(fence(kind, dedent(m[2])));
    }
    const cap = fig.match(/<figcaption>([\s\S]*?)<\/figcaption>/i);
    return out + (cap ? `<p>${cap[1]}</p>` : '');
  });
  html = replaceElements(html, /<(\w+)\b[^>]*aria-hidden="true"[^>]*>/, () => '');
  html = replaceElements(html, /<(nav)\b[^>]*>/, () => '');
  html = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  // Code blocks
  const plain = (code) => decode(code.replace(/<[^>]+>/g, ''));
  html = html.replace(/<pre[^>]*>\s*<code(?: class="language-(\w+)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (m, lang = '', code) => keep(fence(lang, plain(code))));
  html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (m, code) => keep(fence('', plain(code))));
  // Inline
  html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (m, c) => `\u0001${stash.push('`' + plain(c) + '`') - 1}\u0001`);
  html = html.replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, text) => {
    const card = text.match(/<strong>([\s\S]*?)<\/strong>\s*<span>([\s\S]*?)<\/span>/i);
    const label = (card ? card[1] : text.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!label || href.startsWith('#')) return label;
    return `[${label}](${new URL(href, pageUrl).href})${card ? `: ${card[2].trim()}` : ''}`;
  });
  html = html.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**').replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*');
  // Blocks
  html = html.replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (m, n, t) => `\n\n${'#'.repeat(Number(n))} ${t}\n\n`);
  html = html.replace(/\s*<li[^>]*>/gi, '\n- ').replace(/<\/li>/gi, '');
  html = html.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (m, row) => '\n| ' + [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => c[1].trim()).join(' | ') + ' |');
  html = html.replace(/<\/(p|ul|ol|table|div|section|figure|header|article|blockquote)>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n');
  html = html.replace(/<\/?(p|span)\b[^>]*>/gi, ' ').replace(/<[^>]+>/g, '');
  let text = decode(html).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n');
  // No blank lines between list items
  for (let prev; prev !== text;) { prev = text; text = text.replace(/(\n- [^\n]*)\n\n+(?=- )/g, '$1\n').replace(/(\n\| [^\n]*)\n\n+(?=\| )/g, '$1\n'); }
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text.replace(/[\u0000\u0001](\d+)[\u0000\u0001]/g, (m, i) => stash[i]);
}

function page(path) {
  const html = read(path);
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, path])[1]).replace(/ · Orbit$/, '');
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1]);
  const body = (html.match(/<article\b[\s\S]*<\/article>/i) || html.match(/<main\b[\s\S]*<\/main>/i) || [''])[0];
  return { path, url: SITE + path.replace(/(^|\/)index\.html$/, '$1'), title, desc, text: toText(body, SITE + path) };
}

// ─── Collect ───────────────────────────────────────────────
const missing = [];
const take = (path) => (existsSync(join(DOCS, path)) ? page(path) : (missing.push(path), null));

const sections = navSections().map(({ title, items }) => ({ title, pages: items.map((i) => take(i.path)).filter(Boolean) }));
const seen = new Set(sections.flatMap((s) => s.pages.map((p) => p.path)));
const extra = (paths) => paths.filter((p) => !seen.has(p) && (seen.add(p), true)).map(take).filter(Boolean);
const examples = existsSync(join(DOCS, 'examples/index.html')) ? extra([...linksIn('examples/index.html'), ...['gauges', 'progress', 'knobs', 'charts', 'watches', 'calendar', 'mandalas'].map((c) => `examples/${c}/index.html`)]) : [];
const useCases = existsSync(join(DOCS, 'use-cases/index.html')) ? extra(linksIn('use-cases/index.html')) : [];
const home = take('index.html');

// ─── llms.txt ──────────────────────────────────────────────
const line = (p) => `- [${p.title}](${p.url})${p.desc ? `: ${p.desc}` : ''}`;
const short = `# Orbit

> Orbit is a CSS layout system for radial interfaces: gauges, dials, knobs, radial menus, donut charts, watch faces. You write plain HTML with a few classes; CSS does the geometry and a small runtime keeps numbering, spacing and SVG arcs right. Package: \`@zumer/orbit\` (2.0, MIT).

Install: \`npm install @zumer/orbit\`, then \`import '@zumer/orbit/style'\` and \`import '@zumer/orbit'\`. Or in a page:

\`\`\`html
<link rel="stylesheet" href="https://unpkg.com/@zumer/orbit@2.0.0/dist/orbit.min.css">
<script defer src="https://unpkg.com/@zumer/orbit@2.0.0/dist/orbit.min.js"></script>
\`\`\`

## The model

- \`.bigbang\` is the universe: its box is the only size you set. Square by default, as wide as its parent, capped by a parent with a definite height.
- \`.gravity-spot\` is the center. Its reach, \`--o-force\` (default \`100cqmin\`), is the diameter of \`orbit-12\`.
- \`.orbit-1\` to \`.orbit-12\` are twelve lanes from the center to the edge; \`orbit-0\` is the center, \`orbit-13\` to \`orbit-24\` stick out.
- A ring holds \`.satellite\` (with a \`.capsule\` for content), \`.vector\` (rays), \`.side\` (chords), \`<o-arc>\` (pieces of a lane, curved text) and \`<o-progress>\` (a filled lane).
- Everything on a ring is one lane thick; \`--o-size-ratio\` sets thickness in lanes. A satellite is a universe too: a \`.gravity-spot\` inside it reaches its edge, and every gravity spot resets the defaults.
- Angles start at the top and grow clockwise: \`--o-range\`/\`range-N\`, \`--o-from\`/\`from-N\`, \`angle-N\`, \`ccw\`, \`fit-range\`.
- Structure: \`.bigbang > .gravity-spot > .orbit-N > .satellite > .capsule\`. Rings are direct children of a gravity spot, never of another ring. Centered content: \`.orbit-0 > .satellite.at-center > .capsule\`.
- \`dev-orbit\` on the \`.bigbang\` draws the lanes and explains mistakes in the console, prefixed \`[orbit]\`.
- Runtime: \`Orbit.ready()\`, \`Orbit.refresh()\`, the \`o-rendered\` event; \`Orbit.resize()\` only for a fixed px \`--o-force\`.
- From 1.x: systems were 500px across. \`--o-force: 500px\` keeps that size; a 1.x \`orbit-N\` in a box W px wide lands near \`orbit-(N × 500 / W)\`.

${sections.map((s, i) => `## ${s.title}\n\n${[...(i === 0 && home ? [{ ...home, title: 'Home' }] : []), ...s.pages].map(line).join('\n')}`).join('\n\n')}
${examples.length ? `\n## Examples\n\n${examples.map(line).join('\n')}\n` : ''}${useCases.length ? `\n## Use cases\n\n${useCases.map(line).join('\n')}\n` : ''}
## Optional

- [llms-full.txt](${SITE}llms-full.txt): the text and code of every page above in one file
- [Source on GitHub](https://github.com/zumerlab/orbit)
- [1.x documentation](https://zumerlab.github.io/orbit-docs/v1/)
`;

// ─── llms-full.txt ─────────────────────────────────────────
const all = [home, ...sections.flatMap((s) => s.pages), ...examples, ...useCases].filter(Boolean);
const full = `# Orbit documentation, full text

> Every page of ${SITE} as plain text, with the code of its live examples. Generated by scripts/llms.mjs.

${all.map((p) => `\n\n---\n\nSource: ${p.url}\n\n${p.text}`).join('')}
`;

writeFileSync(join(DOCS, 'llms.txt'), short);
writeFileSync(join(DOCS, 'llms-full.txt'), full);
console.log(`llms.txt: ${short.length} bytes; llms-full.txt: ${all.length} pages, ${full.length} bytes`);
if (missing.length) console.log(`skipped (not found): ${missing.join(', ')}`);
