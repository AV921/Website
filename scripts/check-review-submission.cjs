const assert = require('node:assert/strict');
const path = require('node:path');
module.exports = async (browser, base) => {
    for (const width of [390, 1440]) {
        const context = await browser.newContext({viewport:{width,height:900},hasTouch:width===390,reducedMotion:'reduce'});
        const page = await context.newPage();
        await page.goto(`${base}/beyond-engineering.html`);
        // Prevent the OS mail handler from opening: inspect the prepared draft only.
        await page.evaluate(() => {
            window.drafts = [];
            document.addEventListener('click', event => {
                const link = event.target.closest('.review-email-link');
                if (link) { event.preventDefault(); window.drafts.push(link.href); }
            });
        });
        const trigger = page.locator('.review-write');
        if (width === 390) await trigger.tap(); else await trigger.click();
        const dialog = page.locator('#review-submission');
        const form = dialog.locator('form');
        assert.equal(await dialog.evaluate(el=>el.open), true);
        assert.equal(await form.evaluate(el=>el.checkValidity()), false);
        await dialog.locator('[name=firstName]').fill('Maria');
        await dialog.locator('[name=lastName]').fill('D’Angelo');
        const review = 'Una lettura intensa & originale.\nAccenti: è, à. Simboli: + # ? %';
        await dialog.locator('[name=review]').fill(review);
        await dialog.locator('[type=submit]').click();
        let url = new URL(await page.evaluate(()=>window.drafts.at(-1)));
        assert.equal(url.protocol, 'mailto:');
        assert.equal(url.pathname, 'info@andreavennarucci.com');
        assert.equal(url.searchParams.get('subject'), 'Recensione - La fisica delle cose create');
        assert.ok(url.searchParams.get('body').includes('Maria D’Angelo'));
        assert.ok(url.searchParams.get('body').endsWith(review));
        await dialog.locator('[name=anonymous]').check();
        assert.equal(await dialog.locator('[name=firstName]').isDisabled(), true);
        await dialog.locator('[type=submit]').click();
        url = new URL(await page.evaluate(()=>window.drafts.at(-1)));
        assert.ok(url.searchParams.get('body').includes('Nome da pubblicare: Anonimo'));
        assert.ok(!url.searchParams.get('body').includes('Maria'));
        await dialog.locator('[name=review]').fill('   ');
        const count = await page.evaluate(()=>window.drafts.length);
        await dialog.locator('[type=submit]').click();
        assert.equal(await page.evaluate(()=>window.drafts.length), count);
        assert.equal(await form.evaluate(el=>el.checkValidity()), false);
        const longText = 'Una riflessione sulla poesia. '.repeat(300);
        await dialog.locator('[name=review]').fill(longText);
        await dialog.locator('[type=submit]').click();
        assert.ok((await dialog.locator('.submission-copy').inputValue()).endsWith(longText.trim()));
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!document.documentElement.classList.contains('review-dialog-open'));
        assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
        await page.getByRole('button',{name:'Italiano',exact:true}).click();
        assert.equal(await trigger.textContent(),'Scrivi una recensione');
        await trigger.click();
        assert.ok((await dialog.locator('#anonymous-note').textContent()).includes('indirizzo email'));
        assert.ok(await dialog.evaluate(el=>el.getBoundingClientRect().right<=innerWidth));
        await page.screenshot({path:path.join(__dirname,'../test-results',`review-submission-${width}.png`),animations:'disabled'});
        await dialog.locator('[data-close]').click();
        await context.close();
    }
    const context = await browser.newContext({javaScriptEnabled:false});
    const page = await context.newPage();
    await page.goto(`${base}/beyond-engineering.html`);
    assert.ok((await page.locator('.review-write').getAttribute('href')).startsWith('mailto:info@andreavennarucci.com'));
    await context.close();
    console.log('PASS: review email form, named/anonymous, validation, encoding, long-text fallback, touch, keyboard, EN/IT and no JS');
};
