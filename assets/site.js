/* Shared behaviour; page content and translations remain in each page script. */
const siteStorage = {
    getItem(key) { try { return localStorage.getItem(key); } catch { return null; } },
    setItem(key, value) { try { localStorage.setItem(key, value); } catch { /* Optional preference. */ } }
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}
function toggleMenu() {
    const menu = document.querySelector('.nav-links');
    const button = document.querySelector('.menu-toggle');
    if (!menu || !button) return;
    const open = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
}
function applyTranslations(dictionary) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const value = dictionary[element.dataset.i18n];
        if (value !== undefined) element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const value = dictionary[element.dataset.i18nHtml];
        if (value !== undefined) element.innerHTML = value;
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const menu = document.querySelector('.nav-links');
    const button = document.querySelector('.menu-toggle');
    const closeMenu = () => {
        menu?.classList.remove('open');
        button?.setAttribute('aria-expanded', 'false');
    };
    menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu?.classList.contains('open')) {
            closeMenu(); button.focus();
        }
    });
    window.matchMedia('(max-width: 860px)').addEventListener('change', closeMenu);
    const hero = document.querySelector('.hero-image');
    let frame;
    function updateHero() {
        frame = null;
        if (document.body.classList.contains('editorial')) return;
        if (hero) hero.style.transform = reducedMotion.matches ? 'none' :
            `translateY(${window.scrollY * 0.18}px) scale(${1.04 + window.scrollY * 0.00005})`;
    }
    window.addEventListener('scroll', () => {
        if (!reducedMotion.matches && !frame) frame = requestAnimationFrame(updateHero);
    }, { passive: true });
    reducedMotion.addEventListener('change', updateHero);
    updateHero();
    const syncMetadata = () => {
        const italian = document.documentElement.lang === 'it';
        const description = document.querySelector('meta[name="description"]');
        if (description?.dataset.en) description.content = description.dataset[italian ? 'it' : 'en'];
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', description?.content || '');
        document.querySelector('meta[property="og:locale"]')?.setAttribute('content', italian ? 'it_IT' : 'en_GB');
        const skip = document.querySelector('.skip-link');
        if (skip) skip.textContent = italian ? 'Vai al contenuto' : 'Skip to content';
        button?.setAttribute('aria-label', italian ? 'Menu di navigazione' : 'Navigation menu');
    };
    new MutationObserver(syncMetadata).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    syncMetadata();
});
