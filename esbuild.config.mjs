import { build } from 'esbuild'
import * as sass from 'sass'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
const version = pkg.version || '0.0.0'
const banner = `/*
* orbit
* v.${version}
* Author Juan Martin Muda - Zumerlab
* License MIT
*/`

/** @type {import('esbuild').BuildOptions} */
const common = {
  bundle: true,
  sourcemap: false,
  logLevel: 'info',
  banner: { js: banner },
}

function buildCss() {
  mkdirSync('dist', { recursive: true })
  const fixCharset = (css) => {
    // Compressed Sass emits a BOM. Strip it before adding @charset so it does
    // not become a selector character in the middle of the stylesheet.
    return '@charset "UTF-8";\n' + css.replace(/^\uFEFF/, '').replace(/^@charset[^;]+;\s*/i, '')
  }
  const expanded = sass.compile('src/orbit.scss', { loadPaths: ['src'] })
  writeFileSync('dist/orbit.css', fixCharset(expanded.css))
  const compressed = sass.compile('src/orbit.scss', { loadPaths: ['src'], style: 'compressed' })
  writeFileSync('dist/orbit.min.css', fixCharset(compressed.css))
}

async function buildJs() {
  await Promise.all([
    build({
      ...common,
      entryPoints: ['src/orbit.js'],
      outfile: 'dist/orbit.js',
      format: 'iife',
      platform: 'browser',
      target: ['es2018'],
      minify: false,
    }),
    build({
      ...common,
      entryPoints: ['src/orbit.js'],
      outfile: 'dist/orbit.min.js',
      format: 'iife',
      platform: 'browser',
      target: ['es2018'],
      minify: true,
    }),
    build({
      ...common,
      entryPoints: ['src/orbit.js'],
      outfile: 'dist/orbit.mjs',
      format: 'esm',
      platform: 'browser',
      target: ['es2018'],
      minify: false,
    }),
  ])
}

async function main() {
  buildCss()
  await buildJs()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
