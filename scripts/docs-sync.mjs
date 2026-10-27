// Copies the build into docs/ so the site on GitHub Pages runs the current
// Orbit, and the kit from a sibling orbit-kit checkout when there is one.
// Run after npm run compile: npm run docs:sync
import { cp, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, 'docs');

await mkdir(join(docs, 'orbit'), { recursive: true });
for (const file of ['orbit.css', 'orbit.min.css', 'orbit.js', 'orbit.min.js']) {
  await cp(join(root, 'dist', file), join(docs, 'orbit', file));
}
console.log('docs/orbit ← dist');

const kit = join(root, '..', 'orbit-kit', 'src');
try {
  await access(kit);
  await cp(kit, join(docs, 'kit', 'src'), { recursive: true });
  console.log('docs/kit/src ← ../orbit-kit/src');
} catch {
  console.log('No ../orbit-kit checkout, docs/kit/src left as it is');
}
