// Gives every page in docs/ a rel="canonical" link to its own URL, so
// /orbit/index.html and URLs with tracking parameters count as /orbit/.
// Pages that already have one are left alone. Run it after adding pages: node scripts/canonical.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const SITE = 'https://zumerlab.com/orbit/';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

// Same URL form as sitemap.xml: folders for index pages.
const urlOf = (file) => SITE + relative(DOCS, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');

let added = 0;
for (const file of htmlFiles(DOCS)) {
  const html = readFileSync(file, 'utf8');
  // 404.html and redirect stubs are not pages of their own.
  if (file.endsWith(`${sep}404.html`) || /http-equiv="refresh"/i.test(html) || /rel="canonical"/i.test(html)) continue;
  const title = html.match(/^([ \t]*)<title>.*<\/title>[ \t]*$/m);
  if (!title) {
    console.warn(`No <title> line, skipped: ${relative(DOCS, file)}`);
    continue;
  }
  const at = title.index + title[0].length;
  writeFileSync(file, `${html.slice(0, at)}\n${title[1]}<link rel="canonical" href="${urlOf(file)}">${html.slice(at)}`);
  added++;
}
console.log(`canonical: added to ${added} pages`);
