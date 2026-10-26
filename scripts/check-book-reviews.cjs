const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function checkReviews(browser, base) {
    const source = fs.readFileSync(path.join(__dirname, '../beyond-engineering.html'), 'utf8');
    const originalCard = source.match(/<article class="review-card">[\s\S]*?<\/article>/)[0];
    for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: {width, height:900} });
        const page = await context.newPage();
        await page.goto(`${base}/beyond-engineering.html`);
        const section = page.locator('.book-reviews');
        await section.scrollIntoViewIfNeeded();
        assert.equal(await section.locator('.review-card').count(), 1);
        assert.equal(await section.locator('.reviews-controls').isVisible(), false);
        const more = section.locator('.review-more');
        assert.equal(await more.isVisible(), true);
        await more.click();
        assert.equal(await more.getAttribute('aria-expanded'), 'true');
        assert.ok(await section.locator('.review-text').evaluate(el => el.clientHeight >= el.scrollHeight - 1));
        await more.click();
        assert.equal(await more.getAttribute('aria-expanded'), 'false');
        await page.getByRole('button', {name:'Italiano', exact:true}).click();
        assert.equal(await more.textContent(), 'Leggi tutta la recensione');
        await section.scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(__dirname, '../test-results', `reviews-${width}.png`)});
        const originalWidth = await page.evaluate(() => document.documentElement.scrollWidth);

        // Fixtures are injected only in the test browser, never published as reviews.
        const multiple = source.replace(originalCard, Array.from({length:5}, (_, i) => originalCard.replaceAll('bianca-maria-diamanti', `fixture-${i}`)).join('\n'));
        await page.route('**/beyond-engineering.html', route => route.fulfill({body:multiple, contentType:'text/html'}));
        await page.goto(`${base}/beyond-engineering.html`);
        await section.scrollIntoViewIfNeeded();
        await page.mouse.move(0,0);
        const track = section.locator('.reviews-track');
        await page.waitForTimeout(800);
        assert.equal(await section.locator('.reviews-controls').isVisible(), true);
        const moved = await track.evaluate(el => el.scrollLeft);
        assert.ok(moved > 2, 'Overflowing reviews should move slowly');
        await track.hover();
        const stopped = await track.evaluate(el => el.scrollLeft);
        await page.waitForTimeout(350);
        assert.equal(await track.evaluate(el => el.scrollLeft), stopped, 'Hover pauses scrolling');
        await section.locator('.reviews-next').click();
        await page.waitForTimeout(600);
        assert.ok(await track.evaluate(el => el.scrollLeft) > stopped, 'Manual next works');
        await section.locator('.reviews-pause').click();
        await page.emulateMedia({reducedMotion:'reduce'});
        await section.locator('.reviews-pause').waitFor({state:'hidden'});
        assert.equal(await section.locator('.reviews-pause').isVisible(), false);
        await page.mouse.move(0,0);
        await page.evaluate(() => document.activeElement.blur());
        const reduced = await track.evaluate(el => el.scrollLeft);
        await page.waitForTimeout(350);
        assert.equal(await track.evaluate(el => el.scrollLeft), reduced);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= originalWidth + 1, 'Extra cards must not widen the page');
        assert.ok(await track.evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1), 'Carousel stays inside the viewport');
        await context.close();
    }
    const context = await browser.newContext({javaScriptEnabled:false});
    const page = await context.newPage();
    await page.goto(`${base}/beyond-engineering.html`);
    assert.ok(await page.locator('.review-text').evaluate(el => el.clientHeight >= el.scrollHeight - 1));
    assert.equal(await page.locator('.review-more').isVisible(), false);
    await context.close();
    console.log('PASS: book reviews, single/multiple, expansion, hover pause, manual controls, reduced motion and no JS');
};
