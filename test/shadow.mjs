import assert from 'node:assert/strict';
import { build } from 'esbuild';
import * as sass from 'sass';
import * as playwright from 'playwright';
import { fileURLToPath } from 'node:url';

// Build in memory so this focused regression suite does not overwrite dist.
const project = fileURLToPath(new URL('..', import.meta.url));
const css = sass.compile(`${project}/src/orbit.scss`).css;
const built = await build({ absWorkingDir: project, entryPoints: ['src/orbit.js'], bundle: true, write: false, format: 'iife' });
const js = built.outputFiles[0].text;
const browsers = (process.env.BROWSERS || 'chromium').split(',').map(name => name.trim());

for (const name of browsers) {
assert(playwright[name], `Unknown browser: ${name}`);
const browser = await playwright[name].launch();

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<!doctype html><html><body><div id="outside">Unrelated text</div></body></html>');
  await page.evaluate(() => {
    const OriginalMutationObserver = window.MutationObserver;
    const OriginalResizeObserver = window.ResizeObserver;
    window.activeMutations = new Set();
    window.activeResizes = new Set();
    window.MutationObserver = class extends OriginalMutationObserver {
      observe(target, options) { window.activeMutations.add(this); super.observe(target, options); }
      disconnect() { window.activeMutations.delete(this); super.disconnect(); }
    };
    window.ResizeObserver = class extends OriginalResizeObserver {
      observe(target, options) { window.activeResizes.add(this); super.observe(target, options); }
      disconnect() { window.activeResizes.delete(this); super.disconnect(); }
    };
  });
  await page.addScriptTag({ content: js });
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  await settle();
  const baseline = await page.evaluate(() => [activeMutations.size, activeResizes.size]);
  const withShadow = baseline.map(count => count + 1);
  await page.evaluate(styles => {
    window.host = document.createElement('section');
    host.id = 'shadow-host';
    window.root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${styles}\n.gravity-spot { --o-range:var(--test-range,360deg); }</style><div class="bigbang"><div class="gravity-spot"><div class="orbit-30"><o-progress id="progress" value="50"></o-progress><o-arc id="text">One</o-arc></div></div></div>`;
    document.body.append(host);
    window.progress = root.querySelector('#progress');
    window.textArc = root.querySelector('#text');
  }, css);
  await settle();
  assert.equal(await page.evaluate(() => progress.getAttributes().orbitNumber), 30, 'shadow rings use the runtime beyond the static fallback');
  assert(await page.evaluate(() => !!progress.shadowRoot.querySelector('.progress-bar').getAttribute('d')), 'shadow progress paints');
  assert.deepEqual(await page.evaluate(() => [activeMutations.size, activeResizes.size]), withShadow, 'the shadow scope adds one observer of each type');

  await page.evaluate(() => host.style.setProperty('--test-range', '180deg'));
  await settle();
  assert.equal(await page.evaluate(() => progress.getAttributes().range), 180, 'host CSS changes refresh the shadow SVG');
  await page.evaluate(() => {
    window.addedStyle = document.createElement('style');
    addedStyle.textContent = '.gravity-spot { --o-range:90deg; }';
    root.append(addedStyle);
  });
  await settle();
  assert.equal(await page.evaluate(() => progress.getAttributes().range), 90, 'adding a stylesheet directly to a shadow root refreshes SVGs');
  await page.evaluate(() => addedStyle.remove());
  await settle();
  assert.equal(await page.evaluate(() => progress.getAttributes().range), 180, 'removing a shadow stylesheet refreshes SVGs');
  await page.evaluate(() => {
    const sheet = root.querySelector('style').sheet;
    sheet.insertRule('.gravity-spot { --o-range:120deg; }', sheet.cssRules.length);
    Orbit.refresh(root);
  });
  assert.equal(await page.evaluate(() => progress.getAttributes().range), 120, 'explicit ShadowRoot refresh handles CSSOM changes synchronously');
  await page.evaluate(() => {
    const sheet = root.querySelector('style').sheet;
    sheet.deleteRule(sheet.cssRules.length - 1);
    Orbit.refresh(root);
  });
  const changedPath = await page.evaluate(() => progress.shadowRoot.querySelector('.progress-bar').getAttribute('d'));
  await page.evaluate(() => progress.setAttribute('value', '25'));
  await settle();
  assert.notEqual(await page.evaluate(() => progress.shadowRoot.querySelector('.progress-bar').getAttribute('d')), changedPath, 'shadow attribute updates paint');

  await page.evaluate(() => {
    const original = progress.update;
    progress.updates = 0;
    progress.update = function () { this.updates++; return original.call(this); };
    const ring = root.querySelector('.orbit-30');
    const satellite = document.createElement('div');
    satellite.className = 'satellite';
    ring.append(satellite);
  });
  await settle();
  assert.equal(await page.evaluate(() => Number(getComputedStyle(root.querySelector('.satellite')).getPropertyValue('--o-orbit-child-number'))), 0, 'orbiter changes update without rediscovering rings');

  await page.evaluate(() => {
    progress.updates = 0;
    document.querySelector('#outside').classList.add('is-active');
    document.querySelector('#outside').firstChild.data = 'A new status';
    document.body.append(document.createTextNode('Unrelated append'));
  });
  await settle();
  assert.equal(await page.evaluate(() => progress.updates), 0, 'unrelated class/text/child changes do not redraw all charts');

  await page.addScriptTag({ content: js });
  await settle();
  assert.deepEqual(await page.evaluate(() => [activeMutations.size, activeResizes.size]), withShadow, 'a second bundle shares observers');
  await page.evaluate(() => { progress.updates = 0; progress.setAttribute('value', '40'); });
  await settle();
  assert.equal(await page.evaluate(() => progress.updates), 1, 'a second bundle does not double updates');

  await page.evaluate(() => { window.savedHost = host; host.remove(); });
  await settle();
  assert.deepEqual(await page.evaluate(() => [activeMutations.size, activeResizes.size]), baseline, 'removing a shadow host releases its observers');
  await page.evaluate(() => { document.body.append(savedHost); progress.setAttribute('value', '60'); });
  await settle();
  assert.deepEqual(await page.evaluate(() => [activeMutations.size, activeResizes.size]), withShadow, 'reconnecting creates one fresh shadow scheduler');
  assert.equal(await page.evaluate(() => progress.getAttributes().progress), 60);
  assert(await page.evaluate(() => !!progress.shadowRoot.querySelector('.progress-bar').getAttribute('d')));

  await page.evaluate(styles => {
    window.innerHost = document.createElement('section');
    window.innerRoot = innerHost.attachShadow({ mode: 'closed' });
    innerRoot.innerHTML = `<style>${styles}\n.gravity-spot { --o-range:var(--test-range,360deg); }</style><div class="bigbang"><div class="gravity-spot"><div class="orbit-4"><o-progress value="50"></o-progress></div></div></div>`;
    root.append(innerHost);
    window.innerProgress = innerRoot.querySelector('o-progress');
    host.style.setProperty('--test-range', '90deg');
  }, css);
  await settle();
  assert.equal(await page.evaluate(() => innerProgress.getAttributes().range), 90, 'nested closed shadow roots inherit ancestor host updates');
  assert(await page.evaluate(() => !!innerProgress.shadowRoot.querySelector('.progress-bar').getAttribute('d')));
  await page.evaluate(() => host.remove());
  await settle();
  assert.deepEqual(await page.evaluate(() => [activeMutations.size, activeResizes.size]), baseline, 'removing an outer host releases nested shadow schedulers');
  await page.evaluate(() => document.body.append(savedHost));
  await settle();
  await page.evaluate(() => {
    window.adoptionFrame = document.createElement('iframe');
    document.body.append(adoptionFrame);
    const targetDocument = adoptionFrame.contentDocument;
    targetDocument.body.append(targetDocument.adoptNode(savedHost));
    progress.setAttribute('value', '75');
    host.style.setProperty('--test-range', '135deg');
  });
  await settle();
  assert.equal(await page.evaluate(() => progress.ownerDocument === adoptionFrame.contentDocument), true, 'the component was adopted into another document');
  assert.equal(await page.evaluate(() => progress.getAttributes().progress), 75, 'adopted shadow components continue to update');
  assert.equal(await page.evaluate(() => innerProgress.getAttributes().range), 135, 'adopted nested scopes use the new document for host invalidation');
  assert.deepEqual(await page.evaluate(() => [activeMutations.size, activeResizes.size]), baseline, 'adoption releases observers from the former document');
  assert.deepEqual(errors, [], 'shadow updates produce no browser errors');
  console.log(`${name}: shadow rendering, host stylesheets, nested/closed roots, disposal, adoption, repeated loading and scoped invalidation passed`);
} finally {
  await browser.close();
}
}
