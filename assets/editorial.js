/* A shared chapter navigation connects practice, research and personal writing. */
(() => {
    const labels = {
        en: {navHome:'Home',navAbout:'About Me',navPortfolio:'Portfolio',navPublications:'Publications',navContact:'Contact',navPoetry:'Beyond Engineering',discoverBook:'Discover the book',literaryBridge:'Research provides methods for describing phenomena, testing hypotheses and constructing reliable models. Literature and philosophy approach other dimensions of the same reality: the meaning attributed to experience, the limits of language and the way individuals interpret uncertainty and change.'},
        it: {navHome:'Home',navAbout:'Chi sono',navPortfolio:'Portfolio',navPublications:'Pubblicazioni',navContact:'Contatti',navPoetry:"Oltre l’Ingegneria",discoverBook:'Scopri il libro',literaryBridge:"La ricerca fornisce metodi per descrivere i fenomeni, verificare ipotesi e costruire modelli affidabili. La letteratura e la filosofia affrontano altre dimensioni della stessa realtà: il significato attribuito all'esperienza, i limiti del linguaggio e il modo in cui gli individui interpretano l'incertezza e il cambiamento."}
    };
    function sync() {
        const lang = document.documentElement.lang === 'it' ? 'it' : 'en';
        const brand = document.querySelector('.brand [data-i18n="brand"]');
        if (brand) brand.textContent = `${lang === 'it' ? 'Ing.' : 'Eng.'} Andrea Vennarucci`;
        document.querySelectorAll('[data-editorial-i18n]').forEach(el => {
            const text = labels[lang][el.dataset.editorialI18n];
            if (text) el.textContent = text;
        });
        document.querySelectorAll('.language-button').forEach(button => {
            const active = button.dataset.lang === lang;
            button.classList.toggle('active',active);
            button.setAttribute('aria-pressed',String(active));
        });
    }
    sync();
    new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    // Content is visible by default. Motion is a one-off enhancement, never parallax.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('editorial-reveal');
                observer.unobserve(entry.target);
            }
        }),{threshold:.08});
        document.querySelectorAll('.home-card,.highlight-card,.activity-card,.literary-bridge').forEach(el=>observer.observe(el));
    }
    document.querySelectorAll('.journey-item .card[role="button"]').forEach(card=>card.addEventListener('keydown',event=>{
        if (event.key==='Enter'||event.key===' ') {event.preventDefault();card.click();}
    }));
})();
