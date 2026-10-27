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
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-10" style="--o-from:-30deg"><o-arc id="centered" range="auto" text-anchor="middle">Label</o-arc></div><div class="orbit-8" style="--o-from:-30deg"><o-arc id="ended" range="auto" text-anchor="end">Label</o-arc></div></div></div>');
    const anchored = await page.evaluate(() => ['centered', 'ended'].map(id => {
      const el = document.getElementById(id);
      return { start: parseFloat(el.style.getPropertyValue('--o-arc-start')), angle: el.getAttributes().arcAngle, rotate: parseFloat(getComputedStyle(el).rotate) };
    }));
    assert(anchored[0].angle > 0 && Math.abs(anchored[0].start + anchored[0].angle / 2) < 1e-6, 'text-anchor="middle" centers an auto arc on its angle');
    assert(Math.abs(anchored[1].start + anchored[1].angle) < 1e-6, 'text-anchor="end" ends an auto arc at its angle');
    assert(Math.abs(anchored[0].rotate - (-30 - anchored[0].angle / 2)) < .01, 'so a label centered at -30° starts half its length before');

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

    // Each satellite exposes its direction from the center (--o-dir-x, --o-dir-y),
    // and its content inherits the numbers, not the capsule's own angle.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-6"><div class="satellite"><div class="capsule"><span id="dir-top">a</span></div></div><div class="satellite"><div class="capsule"><span id="dir-right">b</span></div></div><div class="satellite"><div class="capsule"><span id="dir-bottom">c</span></div></div><div class="satellite"><div class="capsule"><span id="dir-left">d</span></div></div></div><div class="orbit-0"><div class="satellite at-center"><div class="capsule"><span id="dir-center">e</span></div></div></div></div></div>');
    const dir = id => page.locator(id).evaluate(el => [getComputedStyle(el).getPropertyValue('--o-dir-x'), getComputedStyle(el).getPropertyValue('--o-dir-y')].map(v => Math.round(parseFloat(v) * 1000) / 1000 + 0));
    assert.deepEqual(await dir('#dir-top'), [0, -1], 'the first satellite points up');
    assert.deepEqual(await dir('#dir-right'), [1, 0], 'then right');
    assert.deepEqual(await dir('#dir-bottom'), [0, 1], 'then down');
    assert.deepEqual(await dir('#dir-left'), [-1, 0], 'then left');
    assert.deepEqual(await dir('#dir-center'), [0, 0], 'the center satellite has no direction');

    // The reset has zero specificity: a single class of yours wins inside a capsule.
    await page.addStyleTag({ content: '.mine { margin: 7px; font-size: 13px; }' });
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-6"><div class="satellite"><div class="capsule"><button class="mine" id="mine">x</button></div></div></div></div></div>');
    assert.deepEqual(await page.locator('#mine').evaluate(el => [getComputedStyle(el).marginTop, getComputedStyle(el).fontSize]), ['7px', '13px'], 'user classes beat the reset');

    // A nested system starts from the defaults: the shrink of the ring that holds it does not reach it.
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-10 shrink-50"><div class="satellite grow-4x"><div class="gravity-spot"><div class="orbit-0"><div class="satellite at-center grow-6x" id="nested-center"></div></div></div></div></div></div></div>');
    assert(await page.locator('#nested-center').evaluate(el => el.offsetWidth) > 0, 'shrink-N does not leak into a nested system');

    // dev-orbit combines with a theme on the same element.
    await fixture('<div class="bigbang theme-cyan dev-orbit" style="width:300px"><div class="gravity-spot"><div class="orbit-8"><div class="satellite" id="dev-sat"><div class="capsule">A</div></div></div></div></div>');
    assert.equal(await page.locator('#dev-sat').evaluate(el => getComputedStyle(el).borderTopStyle), 'dashed', 'dev-orbit wins over theme-cyan');

    // theme-cyan does not outrank a single class of yours.
    await page.addStyleTag({ content: '.my-sat { border: 3px solid rgb(1, 2, 3); }' });
    await fixture('<div class="bigbang theme-cyan" style="width:300px"><div class="gravity-spot"><div class="orbit-8"><div class="satellite my-sat" id="cy-sat"><div class="capsule">A</div></div></div></div></div>');
    assert.equal(await page.locator('#cy-sat').evaluate(el => getComputedStyle(el).borderTopColor), 'rgb(1, 2, 3)', 'a single class beats theme-cyan');

    // variant="stroke" draws a 2px bar over a gray track by default.
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-8"><o-progress id="sv" variant="stroke" value="40"></o-progress></div></div></div>');
    await settle();
    const sv = await page.locator('#sv').evaluate(el => { const r = el.shadowRoot; const s = p => getComputedStyle(r.querySelector(p)); return [s('.progress-bar').strokeWidth, s('.progress-bg').stroke]; });
    assert.equal(sv[0], '2px', 'stroke variant bar is 2px');
    assert.notEqual(sv[1], 'none', 'stroke variant draws its track');

    // angle-N points satellites, vectors and sides the same way.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot" id="ang-gs"><div class="orbit-8"><div class="satellite angle-90" id="ang-sat"></div></div><div class="orbit-6"><div class="vector angle-90" id="ang-vec"></div></div><div class="orbit-10"><div class="side angle-90" id="ang-side"></div><div class="side angle-90" style="opacity:0"></div><div class="side angle-90" style="opacity:0"></div></div></div></div>');
    await settle();
    const angleOffset = id => page.evaluate(([gsId, elId]) => {
      const c = r => [r.left + r.width / 2, r.top + r.height / 2];
      const [gx, gy] = c(document.getElementById(gsId).getBoundingClientRect());
      const [x, y] = c(document.getElementById(elId).getBoundingClientRect());
      return [Math.round(x - gx), Math.round(y - gy)];
    }, ['ang-gs', id]);
    for (const id of ['ang-sat', 'ang-vec', 'ang-side']) {
      const [dx, dy] = await angleOffset(id);
      assert(dx > 20 && Math.abs(dy) < 3, `${id}: angle-90 points right (got ${dx}, ${dy})`);
    }

    // Only real angle-N classes reset --o-from.
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-8 from-90"><div class="satellite triangle-icon" id="tri"></div></div></div></div>');
    assert.equal(await page.locator('#tri').evaluate(el => getComputedStyle(el).getPropertyValue('--o-from').trim()), '90deg', 'a class that merely contains "angle-" keeps --o-from');

    // core-N is the new name of from-Nx.
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot core-4"><div class="orbit-4" id="core-new"></div></div></div><div class="bigbang" style="width:300px"><div class="gravity-spot from-4x"><div class="orbit-4" id="core-old"></div></div></div>');
    const coreNew = await page.locator('#core-new').evaluate(el => el.offsetWidth);
    assert.equal(coreNew, await page.locator('#core-old').evaluate(el => el.offsetWidth), 'core-4 and from-4x match');
    assert(coreNew > 300 * 4 / 12 + 5, 'core-4 pushes orbit-4 outward');

    // --o-color on an element gives it its own shades.
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-8" style="--o-color: rgb(255, 0, 0)"><div class="satellite" id="shade" style="background: var(--o-color-dark)"></div></div></div></div>');
    const shade = await page.locator('#shade').evaluate(el => getComputedStyle(el).backgroundColor);
    assert(/^(rgb|oklab|color)/.test(shade) && !/rgba?\(0, 0, 0/.test(shade) && shade !== 'rgba(0, 0, 0, 0)', `--o-color-dark follows a local --o-color (got ${shade})`);
    const red = await page.locator('#shade').evaluate(el => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(el).backgroundColor; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data]; });
    assert(red[0] > 150 && red[1] < 60 && red[2] < 60, `the shade is a dark red (got ${red})`);

    // Utility classes carry no !important: an inline style or a more specific rule of yours wins.
    await page.addStyleTag({ content: '.ring .big { --o-size-ratio: 1; }' });
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-6 ring"><div class="satellite" id="u-plain"></div><div class="satellite grow-2x" id="u-grow"></div><div class="satellite grow-2x" style="--o-size-ratio: 1" id="u-inline"></div><div class="satellite grow-2x big" id="u-rule"></div></div></div></div>');
    const uw = id => page.locator(id).evaluate(el => el.offsetWidth);
    const plain = await uw('#u-plain');
    assert(await uw('#u-grow') > plain * 3, 'grow-2x makes a satellite four lanes thick');
    assert.equal(await uw('#u-inline'), plain, 'an inline --o-size-ratio beats grow-2x');
    assert.equal(await uw('#u-rule'), plain, 'a more specific rule beats grow-2x');

    // value and max are properties too, so frameworks that bind properties redraw.
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-8"><o-progress id="prop" value="72"></o-progress></div></div></div>');
    await settle();
    const bar = () => page.locator('#prop').evaluate(el => el.shadowRoot.querySelector('.progress-bar').getAttribute('d'));
    const before = await bar();
    await page.locator('#prop').evaluate(el => { el.value = 30; });
    await settle();
    assert.equal(await page.locator('#prop').getAttribute('value'), '30', 'setting .value writes the attribute');
    assert.notEqual(await bar(), before, 'setting .value redraws');
    assert.equal(await page.locator('#prop').evaluate(el => [el.value, el.max].join()), '30,100', 'value and max read back as numbers');

    // Arcs and progress are drawn on circles only: an elliptical ring hides them, and says why.
    warnings.length = 0;
    await fixture('<div class="bigbang" style="width:300px"><div class="gravity-spot"><div class="orbit-8" id="round"><o-arc id="arc-round" value="40"></o-arc></div><div class="orbit-10" id="oval" style="--o-ellipse-x: .5"><o-arc id="arc-oval" value="40"></o-arc><o-progress id="prog-oval" value="40"></o-progress><div class="satellite" id="sat-oval"></div></div></div></div><div class="bigbang" style="width:300px"><div class="gravity-spot" style="--o-ellipse-y: .8"><div class="orbit-8"><o-progress id="prog-spot" value="40"></o-progress></div></div></div>');
    await settle();
    const shown = id => page.locator(id).evaluate(el => getComputedStyle(el).display !== 'none');
    assert.equal(await shown('#arc-round'), true, 'an arc on a round ring shows');
    assert.equal(await shown('#arc-oval'), false, 'an arc on an elliptical ring is hidden');
    assert.equal(await shown('#prog-oval'), false, 'progress on an elliptical ring is hidden');
    assert.equal(await shown('#prog-spot'), false, 'an ellipse set on the gravity spot hides it too');
    assert.equal(await shown('#sat-oval'), true, 'satellites follow the ellipse');
    assert(warnings.some(text => /stretched into an ellipse/.test(text)), 'the console explains the hidden arc');
    await page.locator('#oval').evaluate(el => el.style.setProperty('--o-ellipse-x', '1.0'));
    assert.equal(await shown('#arc-oval'), true, 'back to a circle (1.0), the arc shows again');

    // A .satellite.at-value sits on the value of the o-progress in its ring: the knob of a dial.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-8" id="dial" style="--o-from:225deg; --o-range:270deg"><o-progress id="dial-bar" value="50"></o-progress><div class="satellite at-value" id="knob"><div class="capsule"><span id="knob-label">x</span></div></div></div></div></div>');
    assert.equal(await page.locator('#dial').evaluate(el => el.style.getPropertyValue('--o-value-angle')), '135deg', 'o-progress writes the angle of its value on its ring');
    assert.deepEqual(await dir('#knob-label'), [0, -1], 'half of a 270° dial from 225° is the top');
    await page.locator('#dial-bar').evaluate(el => el.setAttribute('value', '0'));
    await settle();
    assert.deepEqual(await dir('#knob-label'), [-0.707, 0.707], 'at 0 the knob is at the start of the range');
    await page.locator('#dial-bar').evaluate(el => el.remove());
    await settle();
    assert.equal(await page.locator('#dial').evaluate(el => el.style.getPropertyValue('--o-value-angle')), '', 'a removed progress takes its angle with it');

    // --o-max sets the scale of a ring or system; a max attribute still wins.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot" style="--o-max:12"><div class="orbit-8"><o-progress id="hours" value="6"></o-progress><o-arc id="own-max" value="6" max="24"></o-arc></div></div></div>');
    assert.equal(await page.locator('#hours').evaluate(el => el.getAttributes().maxValue), 12, '--o-max reaches progress');
    assert.equal(await page.locator('#hours').evaluate(el => el.parentElement.style.getPropertyValue('--o-value-angle')), '180deg', '6 of 12 is half the ring');
    assert.equal(await page.locator('#own-max').evaluate(el => el.getAttributes().arcAngle), 90, 'a max attribute overrides --o-max');

    // start places an arc on the ring's scale: it takes no slot and moves no other arc.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-8" id="slots"><o-arc></o-arc><o-arc></o-arc><o-arc range="auto" start="50" text-anchor="middle" id="over">Label</o-arc><o-arc></o-arc><o-arc id="fourth"></o-arc></div><div class="orbit-10" style="--o-from:30deg; --o-range:330deg; --o-max:12"><o-arc value="3" id="stack-1"></o-arc><o-arc start="1" value="2" id="placed"></o-arc><o-arc value="3" id="stack-2"></o-arc><o-arc start="11" value="2" id="clipped"></o-arc><o-arc start="-1" value="2" id="early"></o-arc></div><div class="orbit-6" style="--o-max:24"><o-arc start="22" value="4" id="wraps"></o-arc></div></div></div>');
    const arc = id => page.locator(id).evaluate(el => ({ ...el.getAttributes(), start: parseFloat(el.style.getPropertyValue('--o-arc-start')) }));
    assert.equal((await arc('#fourth')).arcAngle, 90, 'four arcs still split the ring with a placed label among them');
    assert.equal(await page.locator('#fourth').evaluate(el => getComputedStyle(el).getPropertyValue('--o-orbit-child-number').trim()), '3', 'and keep their slots');
    const over = await arc('#over');
    assert(over.arcAngle > 0 && Math.abs(over.start - (180 - over.arcAngle / 2)) < 1e-6, 'a placed label centers on its point');
    assert.equal((await arc('#stack-2')).start, 82.5, 'stacked arcs skip placed ones');
    const placed = await arc('#placed');
    assert.deepEqual([placed.start, placed.arcAngle], [27.5, 55], 'start and value are on the ring\'s scale');
    const clipped = await arc('#clipped');
    assert.deepEqual([clipped.start, clipped.arcAngle], [302.5, 27.5], 'a segment stops at the end of a partial range');
    const early = await arc('#early');
    assert.deepEqual([early.start, early.arcAngle], [0, 27.5], 'and starts no earlier than its beginning');
    const wraps = await arc('#wraps');
    assert.deepEqual([wraps.start, wraps.arcAngle], [330, 60], 'on a full ring it wraps around');
    await page.locator('#over').evaluate(el => { el.removeAttribute('start'); el.removeAttribute('range'); });
    await settle();
    assert.equal((await arc('#fourth')).arcAngle, 72, 'without start, the arc takes a slot again');

    // .ripple: a copy of the band grows from it and fades; the canvas covers it.
    await fixture(ring('<o-arc id="calm" value="25"></o-arc><o-arc id="calling" class="ripple" value="25"></o-arc>'));
    const wave = id => page.locator(id).evaluate(el => {
      const root = el.shadowRoot;
      const w = root.querySelector('#orbitWave');
      return { same: w.getAttribute('d') === root.querySelector('#orbitShape').getAttribute('d'), display: getComputedStyle(w).display, animation: getComputedStyle(w).animationName, canvas: Number(root.querySelector('svg').getAttribute('viewBox').split(' ')[2]) };
    });
    const calm = await wave('#calm'), calling = await wave('#calling');
    assert.equal(calm.display, 'none', 'arcs have no ripple by default');
    assert.deepEqual([calling.same, calling.display, calling.animation], [true, 'inline', 'orbit-ripple'], 'a ripple copies the band and animates it');
    assert(calling.canvas > calm.canvas, 'the canvas grows to cover the ripple');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal((await wave('#calling')).display, 'none', 'reduced motion turns the ripple off');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // .outward and .outward-y put a label just outside its satellite.
    await fixture('<div class="bigbang" style="width:400px"><div class="gravity-spot"><div class="orbit-8" style="--o-size-ratio:2">' +
      ['top', 'right', 'bottom', 'left'].map(id => `<div class="satellite" id="sat-${id}"><div class="capsule"><span class="outward" id="out-${id}">Label</span><span class="outward-y" id="outy-${id}">Label</span></div></div>`).join('') +
      '</div></div></div>');
    const gaps = await page.evaluate(() => ['top', 'right', 'bottom', 'left'].map(id => {
      const s = document.getElementById('sat-' + id).getBoundingClientRect();
      const o = document.getElementById('out-' + id).getBoundingClientRect();
      const y = document.getElementById('outy-' + id).getBoundingClientRect();
      return { top: s.top - o.bottom, right: o.left - s.right, bottom: o.top - s.bottom, left: s.left - o.right, y: y.top - s.bottom, yAbove: s.top - y.bottom };
    }).map(g => Object.fromEntries(Object.entries(g).map(([k, v]) => [k, Math.round(v)]))));
    assert.equal(gaps[0].top, 4, '.outward hangs above a satellite at the top');
    assert.equal(gaps[1].right, 4, 'right of one on the right');
    assert.equal(gaps[2].bottom, 4, 'below one at the bottom');
    assert.equal(gaps[3].left, 4, 'and left of one on the left');
    assert.deepEqual([gaps[0].yAbove, gaps[1].y, gaps[2].y, gaps[3].y], [4, 4, 4, 4], '.outward-y goes above in the upper half and below the rest');

    // Problems are explained in the console.
    warnings.length = 0;
    await fixture('<span style="display:inline-block"><div class="bigbang"><div class="gravity-spot"><div class="orbit-6"></div></div></div></span><div class="bigbang dev-orbit" style="width:200px"><div class="gravity-spot"><div class="orbit-6"><p>loose</p><div class="satellite"><span>bare</span></div><o-progress value="lots"></o-progress><o-arc value="5" max="0"></o-arc><o-arc start="soon" value="5"></o-arc><o-progress value="5" style="--o-max: 0"></o-progress></div></div></div>');
    await settle();
    for (const pattern of [/has no size/, /is not placed by its ring/, /sits directly in a \.satellite/, /value="lots"> is not a number/, /max="0"> must be a positive number/, /start="soon"> is not a number/, /--o-max: 0 on <o-progress> must be a positive number/]) {
      assert(warnings.some(text => pattern.test(text)), `warns: ${pattern}`);
    }
    const count = warnings.length;
    await page.evaluate(() => window.Orbit.refresh());
    assert.equal(warnings.length, count, 'each problem is reported once');

    assert.deepEqual(errors, [], `${name} has no browser errors`);
    console.log(`${name}: layout, stacking, zero, responsive SVG, CSS overrides, lifecycle, geometry, universe sizing, cascade, directions, values, placed arcs, ripples, outward labels, reset and diagnostics passed`);
  } finally { await browser.close(); }
}
