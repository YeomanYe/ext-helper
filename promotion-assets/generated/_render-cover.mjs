import { chromium } from 'playwright';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('usage: node _render-cover.mjs <html-file>...');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const html of targets) {
    const ctx = await browser.newContext({
      viewport: { width: 1600, height: 1200 },
      deviceScaleFactor: 1
    });
    const page = await ctx.newPage();
    await page.goto('file://' + html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800); // give web fonts time to settle
    const out = html.replace(/\.html$/, '.png');
    await page.screenshot({ path: out, omitBackground: false, fullPage: false, clip: { x:0, y:0, width:1600, height:1200 } });
    console.log('wrote', out);
    await ctx.close();
  }
} finally {
  await browser.close();
}
