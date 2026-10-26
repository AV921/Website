// Add reviews as static .review-card articles: complete text stays readable without JS.
(() => {
    const section = document.querySelector('.book-reviews');
    if (!section) return;
    const track = section.querySelector('.reviews-track');
    const controls = section.querySelector('.reviews-controls');
    const pause = section.querySelector('.reviews-pause');
    const cards = [...track.querySelectorAll('.review-card')];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let overflow = false, userPaused = false, hovering = false, visible = false;
    let frame = 0, previous = 0, position = 0, direction = 1;
    const copy = () => document.documentElement.lang === 'it'
        ? {title:'Recensioni dei lettori', more:'Leggi tutta la recensione', less:'Riduci', pause:'Pausa', play:'Riprendi', prev:'Recensione precedente', next:'Recensione successiva'}
        : {title:'Reader reviews', more:'Read full review', less:'Show less', pause:'Pause', play:'Resume', prev:'Previous review', next:'Next review'};
    function labels() {
        const text = copy();
        section.querySelector('#reviews-heading').textContent = text.title;
        track.setAttribute('aria-label', text.title);
        pause.textContent = userPaused ? text.play : text.pause;
        section.querySelector('.reviews-prev').setAttribute('aria-label', text.prev);
        section.querySelector('.reviews-next').setAttribute('aria-label', text.next);
        cards.forEach(card => {
            const button = card.querySelector('.review-more');
            button.textContent = button.getAttribute('aria-expanded') === 'true' ? text.less : text.more;
        });
    }
    function canMove() {
        return overflow && visible && !document.hidden && !motion.matches && !userPaused && !hovering
            && !section.contains(document.activeElement)
            && !cards.some(card => card.querySelector('.review-more').getAttribute('aria-expanded') === 'true');
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    function tick(time) {
        frame = 0;
        if (!canMove()) { previous = 0; return; }
        const elapsed = previous ? Math.min(time - previous, 50) : 0;
        previous = time;
        const max = track.scrollWidth - track.clientWidth;
        position = Math.max(0, Math.min(max, position + direction * elapsed * 0.014));
        track.scrollLeft = position;
        if (position >= max) direction = -1;
        else if (position <= 0) direction = 1;
        frame = requestAnimationFrame(tick);
    }
    function update() {
        if (!canMove()) return stop();
        if (!frame) { position = track.scrollLeft; frame = requestAnimationFrame(tick); }
    }
    function measure() {
        cards.forEach(card => {
            const button = card.querySelector('.review-more');
            if (button.getAttribute('aria-expanded') === 'true') return;
            card.classList.add('is-collapsed');
            const text = card.querySelector('.review-text');
            const clipped = text.scrollHeight > text.clientHeight + 1;
            button.hidden = !clipped;
            card.classList.toggle('is-collapsed', clipped);
        });
        overflow = track.scrollWidth > track.clientWidth + 1;
        controls.hidden = !overflow;
        pause.hidden = motion.matches;
        update();
    }
    cards.forEach(card => card.querySelector('.review-more').addEventListener('click', () => {
        const button = card.querySelector('.review-more');
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded));
        card.classList.toggle('is-collapsed', !expanded);
        labels(); update();
    }));
    pause.addEventListener('click', () => { userPaused = !userPaused; labels(); update(); });
    for (const [selector, step] of [['.reviews-prev', -1], ['.reviews-next', 1]]) {
        section.querySelector(selector).addEventListener('click', () => {
            userPaused = true; labels(); stop();
            track.scrollBy({left: step * (cards[0].getBoundingClientRect().width + 28), behavior: motion.matches ? 'instant' : 'smooth'});
        });
    }
    section.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; update(); } });
    section.addEventListener('pointerleave', () => { hovering = false; update(); });
    track.addEventListener('pointerdown', () => { userPaused = true; labels(); update(); });
    track.addEventListener('wheel', () => { userPaused = true; labels(); update(); }, {passive:true});
    section.addEventListener('focusin', update);
    section.addEventListener('focusout', () => setTimeout(update, 0));
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', measure);
    new MutationObserver(labels).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
    new ResizeObserver(measure).observe(track);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(section);
    labels(); measure();
})();
