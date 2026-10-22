// Native details keeps the shop links usable by keyboard, touch and without JS.
document.querySelectorAll('.purchase-options').forEach(options => {
    const trigger = options.querySelector('summary');
    options.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' && matchMedia('(hover: hover)').matches) {
            options.open = true;
        }
    });
    options.addEventListener('pointerleave', event => {
        if (event.pointerType === 'mouse' && !options.contains(document.activeElement)) {
            options.open = false;
        }
    });
    options.addEventListener('focusout', event => {
        if (!options.contains(event.relatedTarget)) options.open = false;
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && options.open) {
            const restoreFocus = options.contains(document.activeElement);
            options.open = false;
            if (restoreFocus) trigger.focus();
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!options.contains(event.target)) options.open = false;
    });
});

