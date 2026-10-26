// No server or automatic sending: the visitor reviews and sends their own email.
(() => {
    const trigger = document.querySelector('.review-write');
    if (!trigger || !window.HTMLDialogElement) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'review-dialog review-submission';
    dialog.id = 'review-submission';
    dialog.setAttribute('aria-labelledby', 'submission-title');
    dialog.innerHTML = `
        <button type="button" class="review-dialog-x" data-close>×</button>
        <h2 id="submission-title" data-review-form="write"></h2>
        <p class="submission-intro" data-review-form="intro"></p>
        <form>
            <label class="submission-anonymous"><input type="checkbox" name="anonymous"> <span data-review-form="anonymous"></span></label>
            <p id="anonymous-note" class="submission-note" data-review-form="privacy"></p>
            <div class="submission-names">
                <label><span data-review-form="first"></span><input name="firstName" autocomplete="given-name" required maxlength="100"></label>
                <label><span data-review-form="last"></span><input name="lastName" autocomplete="family-name" required maxlength="100"></label>
            </div>
            <label><span data-review-form="text"></span><textarea name="review" required rows="7"></textarea></label>
            <button class="submission-prepare" type="submit" data-review-form="prepare"></button>
            <p class="submission-status" role="status"></p>
            <div class="submission-result" hidden>
                <a class="review-email-link" data-review-form="reopen"></a>
                <details><summary data-review-form="copy"></summary>
                    <p class="submission-note"><span data-review-form="fallback"></span> <strong>info@andreavennarucci.com</strong></p>
                    <textarea class="submission-copy" readonly rows="7"></textarea>
                </details>
            </div>
        </form>`;
    document.body.append(dialog);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    const form = dialog.querySelector('form');
    const anonymous = form.elements.anonymous;
    anonymous.setAttribute('aria-describedby', 'anonymous-note');
    const fields = [form.elements.firstName, form.elements.lastName];
    const result = dialog.querySelector('.submission-result');
    const status = dialog.querySelector('.submission-status');
    const email = dialog.querySelector('.review-email-link');
    const copy = dialog.querySelector('.submission-copy');
    const texts = {
        it: {write:'Scrivi una recensione', intro:'La tua recensione arriverà a info@andreavennarucci.com e sarà valutata prima dell’eventuale pubblicazione. Il pulsante prepara una mail: potrai controllarla e inviarla dal tuo programma di posta.', anonymous:'Pubblica la recensione come anonima', privacy:'L’anonimato riguarda il nome pubblicato. Il tuo indirizzo email sarà comunque visibile al destinatario.', first:'Nome', last:'Cognome', text:'La tua recensione', prepare:'Prepara la mail', close:'Chiudi', reopen:'Apri di nuovo la mail', copy:'Preferisci copiare il testo?', fallback:'Se la mail non si apre o il testo è molto lungo, copia qui sotto il messaggio e invialo a', prepared:'Bozza preparata. Completa l’invio nel tuo programma di posta.', invalid:'Inserisci un testo, non soltanto spazi.', copyLabel:'Testo della mail da copiare'},
        en: {write:'Write a review', intro:'Your review will reach info@andreavennarucci.com for consideration before publication. This form prepares an email for you to review and send from your own email app.', anonymous:'Publish my review anonymously', privacy:'Anonymity applies to the published name. Your email address will still be visible to the recipient.', first:'First name', last:'Last name', text:'Your review', prepare:'Prepare email', close:'Close', reopen:'Open the email again', copy:'Prefer to copy the text?', fallback:'If your email app does not open or your text is very long, copy the message below and send it to', prepared:'Draft prepared. Complete sending in your email app.', invalid:'Please enter text, not only spaces.', copyLabel:'Email text to copy'}
    };
    const language = () => document.documentElement.lang === 'it' ? 'it' : 'en';
    function labels() {
        const text = texts[language()];
        document.querySelectorAll('[data-review-form]').forEach(el => { el.textContent = text[el.dataset.reviewForm]; });
        dialog.querySelector('[data-close]').setAttribute('aria-label', text.close);
        copy.setAttribute('aria-label', text.copyLabel);
    }
    function clearDraft() {
        result.hidden = true; status.textContent = ''; email.removeAttribute('href'); copy.value = '';
        [...fields, form.elements.review].forEach(field => field.setCustomValidity(''));
    }
    anonymous.addEventListener('change', () => {
        fields.forEach(field => { field.disabled = anonymous.checked; field.required = !anonymous.checked; });
        clearDraft();
    });
    form.addEventListener('input', clearDraft);
    trigger.addEventListener('click', event => {
        event.preventDefault(); dialog.showModal();
        document.documentElement.classList.add('review-dialog-open');
        anonymous.focus();
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    let backdropDown = false;
    function outside(event) {
        const r = dialog.getBoundingClientRect();
        return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    }
    dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog && outside(event)) dialog.close(); });
    dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('review-dialog-open');
        trigger.focus({preventScroll:true});
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        const required = anonymous.checked ? [form.elements.review] : [...fields, form.elements.review];
        required.forEach(field => field.setCustomValidity(field.value.trim() ? '' : texts[language()].invalid));
        if (!form.reportValidity()) return;
        const author = anonymous.checked ? 'Anonimo' : fields.map(field => field.value.trim()).join(' ');
        const subject = 'Recensione - La fisica delle cose create';
        const body = `Recensione proposta per La fisica delle cose create\n\nNome da pubblicare: ${author}\nPubblicazione anonima: ${anonymous.checked ? 'Sì' : 'No'}\n\n${form.elements.review.value.trim()}`;
        email.href = 'mailto:info@andreavennarucci.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        copy.value = `Oggetto: ${subject}\n\n${body}`;
        result.hidden = false;
        status.textContent = texts[language()].prepared;
        email.click();
    });
    new MutationObserver(() => { labels(); clearDraft(); }).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
    labels();
})();
