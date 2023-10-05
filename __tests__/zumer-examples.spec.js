const puppeteer = require('puppeteer');

describe('Test Zumer CSS examples', () => {
  let browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      // `headless: true` (default) enables old Headless;
      // `headless: 'new'` enables new Headless;
      // `headless: false` enables “headful” mode.
    });
  });

  it('Index', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5500/examples/');
    const image = await page.screenshot();

    expect(image).toMatchImageSnapshot();
  });

  it('Generic', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5500/examples/generic.html');
    const image = await page.screenshot();

    expect(image).toMatchImageSnapshot();
  });

  it('Spread', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5500/examples/spread.html');
    const image = await page.screenshot();

    expect(image).toMatchImageSnapshot();
  });

  it('Watch', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5500/examples/watch.html');
    const image = await page.screenshot();

    expect(image).toMatchImageSnapshot();
  });

  it('Sector grid', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:5500/examples/arcgrid.html');
    const image = await page.screenshot();

    expect(image).toMatchImageSnapshot();
  });

  afterAll(async () => {
    await browser.close();
  });
});
