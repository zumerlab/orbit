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
    const warnings = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
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
    await fixture(ring('<o-progress id="full" variant="stroke" value="100"></o-progress>'));
    const fullPath = await page.locator('#full').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d'));
    assert.equal((fullPath.match(/A /g) || []).length, 4, 'a 360° stroke is drawn as four quarter arcs');

    await fixture(ring('<o-progress id="band" value="0" style="--o-back-fill:#000;--o-stroke-width:0"></o-progress>'));
    const band = await page.locator('#band').evaluate(el => {
      const bg = el.shadowRoot.querySelector('.progress-bg');
      return { d: bg.getAttribute('d'), width: bg.getBBox().width };
    });
    assert.equal((band.d.match(/A /g) || []).length, 8, 'a closed 360° band is drawn as two rings of quarter arcs');
    assert(band.width > 90, 'a closed 360° band is painted');

    await fixture('<div class="bigbang" style="width:400px;height:400px"><div class="gravity-spot" style="--o-force:400px"><div class="orbit-12"><o-arc id="hit" interactive value="50"></o-arc></div></div></div>');
    const hits = await page.locator('#hit').evaluate(el => {
      const box = el.getBoundingClientRect();
      const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      const at = (x, y) => document.elementFromPoint(x, y) === el;
      return { inside: at(cx + 40, cy), band: at(box.right - 2, cy) };
    });
    assert.deepEqual(hits, { inside: false, band: true }, 'an interactive arc takes clicks on its band only, not on its text guide');

    await fixture('<div class="bigbang" style="width:400px;height:400px"><div class="gravity-spot depth"><div id="front" class="orbit-4 layer-front"></div><div id="back" class="orbit-6" data-depth="1"></div><div id="custom-z" class="orbit-8" style="--o-z:-220"></div></div></div><div class="bigbang"><div class="gravity-spot"><div id="flat" class="orbit-4" data-depth="2"></div></div></div>');
    const depth = await page.evaluate(() => Object.fromEntries(['front', 'back', 'custom-z', 'flat'].map(id => [id, new DOMMatrix(getComputedStyle(document.getElementById(id)).transform)])));
    assert.equal(depth.front.m43, 0, 'front layer stays at z 0');
    assert.equal(depth.back.m43, -110, 'data-depth moves a ring back one step');
    assert(Math.abs(depth.back.m11 - 1010 / 900) < 1e-4, 'scale compensates the perspective');
    assert.equal(depth['custom-z'].m43, -220, '--o-z sets depth per ring');
    assert(depth.flat.isIdentity, 'rings outside .depth are not transformed');
    assert.match(await page.locator('#back').evaluate(el => getComputedStyle(el).transitionProperty), /transform/, 'depth changes transition by default');


    // The universe model: .bigbang is the space, orbit-12 reaches its edge.
    const width = selector => page.locator(selector).evaluate(el => el.getBoundingClientRect().width);
    await fixture('<div id="space" style="width:240px"><div class="bigbang" id="universe"><div class="gravity-spot"><div class="orbit-12" id="edge"><o-progress id="fluid" value="50"></o-progress></div><div class="orbit-6" id="half"></div></div></div></div>');
    assert.equal(await width('#universe'), 240, 'a universe takes its parent width');
    assert.equal(await page.locator('#universe').evaluate(el => el.getBoundingClientRect().height), 240, 'a universe is square by default');
    assert.equal(await width('#edge'), 240, 'orbit-12 reaches the edge of the universe');
    assert.equal(await width('#half'), 120, 'orbit-6 is half way');
    const fluidPath = await page.locator('#fluid').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d'));
    await page.locator('#space').evaluate(el => { el.style.width = '400px'; });
    await settle();
    assert.equal(await width('#edge'), 400, 'the system follows its universe without JavaScript');
    assert.notEqual(await page.locator('#fluid').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d')), fluidPath, 'arcs redraw when the universe resizes');

    await fixture('<div style="width:300px;height:100px"><div class="bigbang" id="wide"><div class="gravity-spot"><div class="orbit-12" id="wide-edge"></div></div></div></div>');
    assert.deepEqual(await page.locator('#wide').evaluate(el => [el.clientWidth, el.clientHeight]), [300, 100], 'a parent with a height caps the universe');
    assert.equal(await width('#wide-edge'), 100, 'the system fits the shorter side');

    await fixture('<div class="bigbang" style="width:240px"><div class="gravity-spot" style="--o-force:480px"><div class="orbit-12" id="fixed"></div></div></div>');
    assert.equal(await width('#fixed'), 480, 'a length in --o-force overrides the universe');

    // Values cascade from the system and its rings.
    await fixture('<div class="bigbang" style="width:480px"><div class="gravity-spot"><div class="orbit-6" style="--o-size-ratio:2"><div class="satellite" id="big"></div></div><div class="orbit-8 shrink-50"><div class="satellite" id="plain"></div></div><div class="orbit-10" style="--o-gap:9"><o-arc id="gapped"></o-arc></div><div class="orbit-4"><div class="satellite" id="legacy" style="--o-aligment:-20px"></div></div><div class="orbit-4"><div class="satellite" id="aligned" style="--o-alignment:-20px"></div></div><div class="orbit-4"><div class="satellite" id="unaligned"></div></div></div></div>');
    assert.equal(await width('#big'), 40, 'a ring\'s --o-size-ratio reaches its satellites');
    assert.equal(await page.locator('#plain').evaluate(el => getComputedStyle(el).getPropertyValue('--o-size-ratio').trim()), '1', 'shrink-N on a ring spaces rings without resizing satellites');
    assert.equal(await page.locator('#gapped').evaluate(el => el.getAttributes().gap), 9, 'a ring\'s --o-gap reaches its arcs');
    const transform = id => page.locator(id).evaluate(el => getComputedStyle(el).transform);
    assert.notEqual(await transform('#aligned'), await transform('#unaligned'), '--o-alignment moves satellites off the ring');
    assert.equal(await transform('#aligned'), await transform('#legacy'), '--o-alignment and the legacy --o-aligment place satellites alike');

    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-8 range-270 fit-range"><o-arc></o-arc><o-arc></o-arc><o-arc></o-arc></div><div class="orbit-6 range-270 fit-range" id="ticks"><div class="vector"></div><div class="vector"></div><div class="vector"></div></div></div></div>');
    assert.equal(await page.locator('.orbit-8').evaluate(el => getComputedStyle(el).getPropertyValue('--o-angle').trim()), 'calc(270deg / 3)', 'arcs split a fit-range ring without overflowing it');
    assert.equal(await page.locator('#ticks').evaluate(el => getComputedStyle(el).getPropertyValue('--o-angle').trim()), 'calc(270deg / max(1, 3 - 1))', 'points still land on both ends of a fit-range ring');

    // Nested systems measure the satellite or universe that holds them.
    await fixture('<div class="bigbang" style="width:480px"><div class="gravity-spot"><div class="orbit-6"><div class="satellite" id="host" style="--o-size-ratio:3"><div class="gravity-spot"><div class="orbit-12" id="moon-edge"></div></div></div></div></div></div>');
    assert.equal(await width('#moon-edge'), await page.locator('#host').evaluate(el => el.clientWidth), 'a system inside a satellite fills the satellite');
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot depth"><div class="bigbang layer-front" id="layer"><div class="gravity-spot"><div class="orbit-12" id="layer-edge"></div></div></div></div></div>');
    assert.equal(await page.locator('#layer').evaluate(el => el.offsetWidth), 400, 'a universe inside a system takes its reach');
    assert.equal(await page.locator('#layer-edge').evaluate(el => el.offsetWidth), 400, 'and its orbit-12 reaches the same edge');

    // Full circles, touch areas, text-sized arcs and render notifications.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-10" style="--o-size-ratio:2"><o-arc id="whole" interactive style="--o-fill:transparent;--o-stroke:none">All the way round</o-arc></div></div></div>');
    const whole = await page.locator('#whole').evaluate(el => ({ shape: el.shadowRoot.querySelector('#orbitShape').getAttribute('d'), text: el.shadowRoot.querySelector('#orbitPath').getAttribute('d') }));
    assert(!/NaN|Infinity/.test(whole.shape + whole.text), 'a 360° arc has finite geometry');
    assert((whole.text.match(/A /g) || []).length >= 4, 'curved text on a full circle is split into quarter arcs');
    const box = await page.locator('#whole').boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [box.x + box.width / 2, box.y + 4]);
    assert.equal(hit, 'whole', 'a transparent interactive arc receives the pointer on its band');
    assert.notEqual(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [box.x + box.width / 2, box.y + box.height / 2]), 'whole', 'the center of the ring stays click-through');
    assert.notEqual(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [box.x + box.width / 2, box.y - 26]), 'whole', 'the touch area ends with the band');
    await page.locator('#whole').evaluate(el => el.setAttribute('hit-width', '20'));
    await settle();
    assert.equal(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [box.x + box.width / 2, box.y - 26]), 'whole', 'hit-width widens the touch area');

    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-10"><o-arc id="short" range="auto">Hi</o-arc><o-arc id="long" range="auto">A much longer label</o-arc></div></div></div>');
    const auto = await page.evaluate(() => ['short', 'long'].map(id => document.getElementById(id).getAttributes()));
    assert(auto[0].arcAngle > 0 && auto[1].arcAngle > auto[0].arcAngle * 3, 'range="auto" sizes arcs to their text');
    assert(Math.abs(auto[1].stackOffset - auto[0].arcAngle) < 1e-6, 'auto arcs follow each other');

    const events = await page.evaluate(async () => {
      document.body.innerHTML = '<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-8"><o-progress id="late" value="40"></o-progress></div></div></div>';
      let fired = 0;
      document.body.addEventListener('o-rendered', () => fired++);
      await window.Orbit.ready();
      return { fired, drawn: !!document.getElementById('late').shadowRoot.querySelector('.progress-bar').getAttribute('d') };
    });
    assert.deepEqual(events, { fired: 1, drawn: true }, 'Orbit.ready() resolves after drawing, and o-rendered fires once');

    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot depth"><div class="gravity-spot" data-depth="1" id="composite"><div class="orbit-12" id="composite-edge"></div><div class="orbit-0"><div class="satellite at-center"><div class="capsule">label</div></div></div></div></div></div>');
    assert.equal(await page.locator('#composite-edge').evaluate(el => el.offsetWidth), 400, 'a nested .gravity-spot layer keeps the reach of its universe');
    assert.notEqual(await page.locator('#composite').evaluate(el => getComputedStyle(el).transform), 'none', 'and moves back as a depth layer');
    assert.equal(await page.locator('.satellite').first().evaluate(el => getComputedStyle(el).borderTopStyle), 'none', 'satellites have no border by default');

    // Orbit.resize() only scales systems with a fixed --o-force.
    await fixture('<div id="panel" style="width:250px"><div class="bigbang"><div class="gravity-spot" id="fluid-spot"></div></div><div class="bigbang"><div class="gravity-spot" id="px-spot" style="--o-force:500px"></div></div></div>');
    await page.evaluate(() => window.Orbit.resize('#panel')());
    assert.equal(await page.locator('#fluid-spot').evaluate(el => el.style.getPropertyValue('--o-force-ratio')), '', 'resize leaves fluid systems alone');
    assert.equal(await page.locator('#px-spot').evaluate(el => el.style.getPropertyValue('--o-force-ratio')), '0.5', 'resize scales fixed systems');

    // Problems are explained in the console.
    warnings.length = 0;
    await fixture('<span style="display:inline-block"><div class="bigbang"><div class="gravity-spot"><div class="orbit-6"></div></div></div></span><div class="bigbang dev-orbit" style="width:200px"><div class="gravity-spot"><div class="orbit-6"><p>loose</p><div class="satellite"><span>bare</span></div><o-progress value="lots"></o-progress><o-arc value="5" max="0"></o-arc></div></div></div>');
    await settle();
    for (const pattern of [/has no size/, /is not placed by its ring/, /sits directly in a \.satellite/, /value="lots"> is not a number/, /max="0"> must be a positive number/]) {
      assert(warnings.some(text => pattern.test(text)), `warns: ${pattern}`);
    }
    const count = warnings.length;
    await page.evaluate(() => window.Orbit.refresh());
    assert.equal(warnings.length, count, 'each problem is reported once');

    assert.deepEqual(errors, [], `${name} has no browser errors`);
    console.log(`${name}: layout, stacking, zero, responsive SVG, CSS overrides, lifecycle, geometry, universe sizing, cascade and diagnostics passed`);
  } finally { await browser.close(); }
}
