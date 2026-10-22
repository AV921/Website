const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));
for (const f of files) {
    const source = fs.readFileSync(path.join(root, f), 'utf8');
    for (const m of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1], { filename: f });
}
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    const file = path.join(root, new URL(req.url, 'http://localhost').pathname === '/' ? 'index.html' : decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch();
        const base = `http://127.0.0.1:${server.address().port}`;
        for (const width of [390, 1440]) {
            const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
            for (const file of files) {
                await page.goto(`${base}/${file}`);
                await page.getByRole('button', { name: 'Italiano', exact: true }).click();
                assert.equal(await page.locator('html').getAttribute('lang'), 'it');
                assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), 'it_IT');
                if (width === 390 && file !== 'beyond-engineering.html') {
                    const menu = page.locator('.menu-toggle');
                    await menu.click();
                    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
                    await page.keyboard.press('Escape');
                    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
                }
                if (file === 'portfolio.html') {
                    assert.equal(await page.locator('.project-content:not([inert])').count(), 0);
                    await page.locator('.project-header').first().click();
                    assert.equal(await page.locator('.project-content:not([inert])').count(), 1);
                    await page.locator('.project-header').nth(1).click();
                    assert.equal(await page.locator('.project-content:not([inert])').count(), 1);
                    await page.goto(`${base}/${file}#road-safety-award`);
                    assert.equal(await page.locator('#road-safety-award .project-content').getAttribute('inert'), null);
                }
                if (file === 'beyond-engineering.html') {
                    const options = page.locator('.purchase-options');
                    const trigger = options.locator('summary');
                    const shops = options.locator('a');
                    assert.deepEqual(await shops.evaluateAll(links => links.map(a => new URL(a.href).hostname)),
                        ['www.amazon.it', 'www.lafeltrinelli.it', 'www.ibs.it']);
                    await trigger.hover();
                    assert.equal(await options.evaluate(el => el.open), true);
                    await shops.last().hover();
                    assert.equal(await shops.last().isVisible(), true);
                    await page.mouse.move(0, 0);
                    assert.equal(await options.evaluate(el => el.open), false);
                    await trigger.focus();
                    await page.keyboard.press('Enter');
                    await page.keyboard.press('Tab');
                    assert.equal(await shops.first().evaluate(el => el === document.activeElement), true);
                    await page.keyboard.press('Escape');
                    assert.equal(await options.evaluate(el => el.open), false);
                    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
                    await page.keyboard.press('Enter');
                }
                if (file !== 'beyond-engineering.html') assert.equal(await page.locator('.hero-image').evaluate(el => getComputedStyle(el).transform), 'none');
                await page.screenshot({ path: path.join(root, 'test-results', `${file}-${width}.png`), fullPage: true });
                console.log(`PASS: ${file}, ${width}px`);
            }
            assert.deepEqual(errors, []);
            await context.close();
        }
        const touchContext = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
        const touchPage = await touchContext.newPage();
        await touchPage.goto(`${base}/beyond-engineering.html`);
        await touchPage.locator('.purchase-options summary').tap();
        assert.equal(await touchPage.locator('.purchase-links a').last().isVisible(), true);
        await touchPage.locator('.purchase-options summary').tap();
        assert.equal(await touchPage.locator('.purchase-options').evaluate(el => el.open), false);
        await touchContext.close();
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();
        await page.goto(`${base}/beyond-engineering.html`);
        assert.equal(await page.locator('.apparizione').first().evaluate(el => getComputedStyle(el).opacity), '1');
        await page.locator('.purchase-options summary').click();
        assert.equal(await page.locator('.purchase-links a').last().isVisible(), true);
        await context.close();
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

