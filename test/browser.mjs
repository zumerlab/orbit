import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as playwright from 'playwright';

const css = await readFile(new URL('../dist/orbit.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../dist/orbit.js', import.meta.url), 'utf8');
const browsers = (process.env.BROWSERS || 'chromium').split(',').map(name => name.trim());

for (const name of browsers) {
  assert(playwright[name], `Unknown browser: ${name}`);
  const browser = await playwright[name].launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<!doctype html><html><head></head><body></body></html>');
    await page.addStyleTag({ content: css });
    await page.evaluate(() => { document.body.innerHTML = '<div class="bigbang"><div class="gravity-spot"><div class="orbit-4"><div class="satellite"></div><div class="satellite"></div></div></div></div><div id="invalid" class="bigbang"><p>Invalid structure</p></div>'; });
    const fallback = await page.locator('.orbit-4 .satellite').last().evaluate(el => ({ transform: getComputedStyle(el).transform, index: Number(getComputedStyle(el).getPropertyValue('--o-orbit-child-number')) }));
    assert.equal(fallback.index, 1, 'static CSS fallback supplies indices');
    assert.notEqual(fallback.transform, 'none', 'static CSS fallback positions satellites');
    assert.equal(await page.locator('#invalid').evaluate(el => getComputedStyle(el, '::after').content), 'none', 'production markup does not show diagnostics');
    await page.locator('#invalid').evaluate(el => el.classList.add('dev-orbit'));
    assert.match(await page.locator('#invalid').evaluate(el => getComputedStyle(el, '::after').content), /⚠/, 'developer mode shows structure diagnostics');
    await page.addScriptTag({ content: js });
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const fixture = async markup => {
      await page.evaluate(html => { document.body.innerHTML = html; }, markup);
      await settle();
    };
    const ring = children => `<div class="bigbang" style="width:400px;height:400px"><div class="gravity-spot"><div class="orbit-4" id="ring">${children}</div></div></div>`;

    await fixture(ring('<o-arc id="first" value="25"></o-arc><o-arc id="second" value="75"></o-arc>'));
    const offset = () => page.locator('#second').evaluate(el => parseFloat(el.style.getPropertyValue('--o-arc-start')));
    assert.equal(await offset(), 90, 'initial stack');
    await page.locator('#first').evaluate(el => el.setAttribute('value', '50'));
    await settle();
    assert.equal(await offset(), 180, 'a changed segment repositions following segments');
    await page.locator('#first').evaluate(el => el.setAttribute('value', '0'));
    await settle();
    assert.equal(await offset(), 0, 'zero segment consumes no angle');
    assert.equal(await page.locator('#first').evaluate(el => el.shadowRoot.querySelector('#orbitShape').getAttribute('d')), '', 'zero has no painted shape');
    await page.locator('#ring').evaluate(el => el.prepend(el.lastElementChild));
    await settle();
    assert.equal(await offset(), 0, 'reordered first segment has no stale offset');
    await page.locator('#second').evaluate(el => el.remove());
    await settle();
    assert.equal(await page.locator('#first').evaluate(el => el.getAttributes().stackOffset), 0, 'removed siblings leave no offset');

    await fixture(ring('<o-arc id="custom" value="20" style="--o-angle-composite:17deg"></o-arc><o-progress id="progress" value="50"></o-progress>'));
    assert.equal(await page.locator('#custom').evaluate(el => getComputedStyle(el).getPropertyValue('--o-angle-composite').trim()), '17deg', 'author angles survive layout');
    const initialPath = await page.locator('#progress').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d'));
    await page.locator('#ring').evaluate(el => el.style.setProperty('--o-range', 'calc(.5turn)'));
    await settle();
    assert.equal(await page.locator('#progress').evaluate(el => el.getAttributes().range), 180, 'CSS expressions resolve to degrees');
    assert.notEqual(await page.locator('#progress').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d')), initialPath, 'ancestor CSS invalidates SVG');

    await fixture('<div id="box" class="bigbang" style="width:400px;aspect-ratio:1;container-type:inline-size"><div class="gravity-spot" style="--o-force:calc(100cqw * 3)"><div class="orbit-4"><o-progress id="responsive" value="35"></o-progress></div></div></div>');
    const beforeResize = await page.locator('#responsive').evaluate(el => ({ radius: el.getAttributes().orbitRadius, path: el.shadowRoot.querySelector('.progress-bar').getAttribute('d') }));
    await page.locator('#box').evaluate(el => { el.style.width = '200px'; });
    await settle();
    const afterResize = await page.locator('#responsive').evaluate(el => ({ radius: el.getAttributes().orbitRadius, path: el.shadowRoot.querySelector('.progress-bar').getAttribute('d') }));
    assert(Math.abs(afterResize.radius * 2 - beforeResize.radius) < 1, 'container units resize the actual radius');
    assert.notEqual(afterResize.path, beforeResize.path, 'resizing updates SVG band thickness');

    await fixture(`<div class="bigbang"><div class="gravity-spot"><div id="many" class="orbit-30">${'<div class="satellite"><div class="capsule">x</div></div>'.repeat(72)}</div></div></div><div id="unrelated" class="orbit-card">ordinary content</div>`);
    assert.equal(await page.locator('#many').evaluate(el => Number(getComputedStyle(el).getPropertyValue('--o-orbit-number'))), 30, 'rings exceed the static CSS limit');
    const last = await page.locator('#many > .satellite').last().evaluate(el => ({ index: Number(getComputedStyle(el).getPropertyValue('--o-orbit-child-number')), transform: getComputedStyle(el).transform }));
    assert.equal(last.index, 71, 'children exceed the static CSS limit');
    assert.notEqual(last.transform, 'none', 'last satellite is positioned');
    assert.equal(await page.locator('#unrelated').evaluate(el => getComputedStyle(el).position), 'static', 'unrelated class names are not radial layouts');

    await fixture(ring('<o-arc id="text" fit-range>Orbit</o-arc>'));
    assert.equal(await page.locator('#text').evaluate(el => el.shadowRoot.querySelector('text').hasAttribute('textLength')), true);
    await page.locator('#text').evaluate(el => { el.removeAttribute('fit-range'); el.firstChild.data = 'Updated'; });
    await settle();
    assert.deepEqual(await page.locator('#text').evaluate(el => ({ fitted: el.shadowRoot.querySelector('text').hasAttribute('textLength'), text: el.shadowRoot.querySelector('textPath').textContent })), { fitted: false, text: 'Updated' }, 'text and fit-range update in place');

    await fixture(ring('<o-progress id="lifecycle" value="5"></o-progress>'));
    await page.locator('#lifecycle').evaluate(el => {
      const original = el.update;
      el.updates = 0;
      el.update = function () { this.updates++; return original.call(this); };
      const parent = el.parentElement;
      for (let i = 0; i < 3; i++) { el.remove(); parent.append(el); }
    });
    await settle();
    await page.locator('#lifecycle').evaluate(el => { el.updates = 0; el.setAttribute('value', '55'); });
    await settle();
    assert.equal(await page.locator('#lifecycle').evaluate(el => el.updates), 1, 'reconnections do not duplicate observers');

    for (const shape of ['none', 'rounded', 'circle-a', 'circle-b', 'arrow', 'slash', 'zigzag']) {
      await fixture(ring(`<o-progress id="shape" shape="${shape}" value="0"></o-progress>`));
      for (const value of ['0', '.01', '49.99', '50.01', '100', '150', '-1', 'invalid']) {
        await page.locator('#shape').evaluate((el, v) => el.setAttribute('value', v), value);
        await settle();
        const path = await page.locator('#shape').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d'));
        assert(!/NaN|Infinity/.test(path), `${shape} ${value} has finite geometry`);
        if (['0', '-1', 'invalid'].includes(value)) assert.equal(path, '', `${shape} ${value} is empty`);
      }
    }
    assert.deepEqual(errors, [], `${name} has no browser errors`);
    console.log(`${name}: layout, stacking, zero, responsive SVG, CSS overrides, lifecycle and geometry passed`);
  } finally { await browser.close(); }
}
