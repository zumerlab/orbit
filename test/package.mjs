import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { gzipSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = mkdtempSync(join(tmpdir(), 'orbit-package-test-'))

try {
  // Exercise the actual npm allowlist and export map, not imports from src.
  const [packed] = JSON.parse(execFileSync('npm', [
    'pack', '--json', '--ignore-scripts', '--pack-destination', scratch,
    '--cache', join(scratch, 'npm-cache'),
  ], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
  const files = new Set(packed.files.map(file => file.path))
  for (const file of [
    'package.json', 'README.md', 'LICENSE',
    'dist/orbit.css', 'dist/orbit.min.css',
    'dist/orbit.js', 'dist/orbit.min.js', 'dist/orbit.mjs',
  ]) {
    assert.ok(files.has(file), `Missing published file: ${file}`)
  }

  execFileSync('tar', ['-xzf', join(scratch, packed.filename), '-C', scratch])
  for (const file of ['orbit.css', 'orbit.min.css']) {
    const css = readFileSync(join(scratch, 'package', 'dist', file), 'utf8')
    assert.ok(!css.includes('\uFEFF'), `${file} contains a misplaced UTF-8 BOM`)
  }
  const scope = join(scratch, 'node_modules', '@zumer')
  mkdirSync(scope, { recursive: true })
  symlinkSync(join(scratch, 'package'), join(scope, 'orbit'), 'dir')
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const core = await import('@zumer/orbit');
    for (const name of ['OrbitArc', 'OrbitProgress', 'registerOrbit']) {
      assert.equal(typeof core[name], 'function', name + ' must be exported');
    }
    assert.equal(typeof core.Orbit.resize, 'function');
    assert.equal(typeof core.Orbit.refresh, 'function');
    assert.ok(import.meta.resolve('@zumer/orbit').endsWith('/dist/orbit.mjs'));
    assert.ok(import.meta.resolve('@zumer/orbit/style').endsWith('/dist/orbit.css'));
    assert.equal(typeof globalThis.window, 'undefined');
    assert.equal(typeof globalThis.customElements, 'undefined');
  `], { cwd: scratch, stdio: 'pipe' })

  for (const file of ['orbit.js', 'orbit.min.js']) {
    // Classic script bundles also remain harmless if evaluated without a DOM.
    runInNewContext(readFileSync(join(scratch, 'package', 'dist', file), 'utf8'), {}, { filename: file })
  }

  const sizes = ['orbit.min.css', 'orbit.min.js'].map(file => {
    const bytes = readFileSync(join(scratch, 'package', 'dist', file))
    return `${file}: ${bytes.length} bytes, ${gzipSync(bytes).length} gzip`
  })
  console.log(`Package smoke passed: published files, ESM exports, SSR imports, classic scripts.\n${sizes.join('\n')}`)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
