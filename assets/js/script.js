document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('coverflow-stage');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    let sliderIndex = 0;
    let autoTimer;
    const intervalDuration = 4000;

    const prevBtn = document.querySelector('.stage-prev');
    const nextBtn = document.querySelector('.stage-next');
    const dotsContainer = document.getElementById('stage-dots');

    const updateSlider = () => {
        if (!stage) return;

        const visibleItems = Array.from(stage.querySelectorAll('.showcase-item:not(.hidden-item)'));
        if (visibleItems.length === 0) return;

        const itemWidth = visibleItems[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(stage).gap) || 22;

        // compute visible count based on available width (at least 1)
        const viewportWidth = stage.clientWidth;
        let visibleCount = Math.max(1, Math.floor((viewportWidth + gap) / (itemWidth + gap)));
        visibleCount = Math.min(visibleCount, visibleItems.length);

        // pages = number of possible left-most positions
        const pages = Math.max(1, visibleItems.length - visibleCount + 1);
        if (sliderIndex >= pages) sliderIndex = 0;

        const totalVisibleWidth = visibleCount * itemWidth + (visibleCount - 1) * gap;
        const centerOffset = (viewportWidth - totalVisibleWidth) / 2;
        const translateX = centerOffset - sliderIndex * (itemWidth + gap);

        stage.style.transform = `translateX(${translateX}px)`;

        // highlight center item
        const centerIndex = sliderIndex + Math.floor(visibleCount / 2);
        visibleItems.forEach((it, i) => it.classList.toggle('is-center', i === centerIndex));

        // update dots
        renderDots(pages, sliderIndex);
    };

    const renderDots = (pages, active) => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < pages; i++) {
            const btn = document.createElement('button');
            if (i === active) btn.classList.add('active');
            btn.addEventListener('click', () => { sliderIndex = i; updateSlider(); resetAuto(); });
            dotsContainer.appendChild(btn);
        }
    };

    const startAuto = () => {
        if (!stage) return;
        stopAuto();
        autoTimer = setInterval(() => {
            const visibleItems = Array.from(stage.querySelectorAll('.showcase-item:not(.hidden-item)'));
            if (visibleItems.length === 0) return;
            const itemWidth = visibleItems[0].offsetWidth;
            const gap = parseFloat(getComputedStyle(stage).gap) || 22;
            const viewportWidth = stage.clientWidth;
            let visibleCount = Math.max(1, Math.floor((viewportWidth + gap) / (itemWidth + gap)));
            visibleCount = Math.min(visibleCount, visibleItems.length);
            const pages = Math.max(1, visibleItems.length - visibleCount + 1);
            sliderIndex = (sliderIndex + 1) % pages;
            updateSlider();
        }, intervalDuration);
    };

    const stopAuto = () => { clearInterval(autoTimer); };
    const resetAuto = () => { stopAuto(); startAuto(); };

    // Controls
    if (prevBtn) prevBtn.addEventListener('click', () => { sliderIndex = Math.max(0, sliderIndex - 1); updateSlider(); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (!stage) return;
        const visibleItems = Array.from(stage.querySelectorAll('.showcase-item:not(.hidden-item)'));
        if (visibleItems.length === 0) return;
        const itemWidth = visibleItems[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(stage).gap) || 22;
        const viewportWidth = stage.clientWidth;
        let visibleCount = Math.max(1, Math.floor((viewportWidth + gap) / (itemWidth + gap)));
        visibleCount = Math.min(visibleCount, visibleItems.length);
        const pages = Math.max(1, visibleItems.length - visibleCount + 1);
        sliderIndex = (sliderIndex + 1) % pages;
        updateSlider(); resetAuto();
    });

    // Pause auto on hover
    if (stage) {
        stage.addEventListener('mouseenter', stopAuto);
        stage.addEventListener('mouseleave', startAuto);
    }

    // update on resize
    window.addEventListener('resize', () => { updateSlider(); });

    // Initialize slider
    updateSlider();
    startAuto();

    // 3. Category Filter Action Logic
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetFilter = button.getAttribute('data-filter');
            const allItems = stage.querySelectorAll('.showcase-item');

            allItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                if (targetFilter === 'all' || targetFilter === itemType) {
                    item.classList.remove('hidden-item');
                } else {
                    item.classList.add('hidden-item');
                }
            });

            // Reset positioning pointers cleanly back to index zero on change
            activeIndex = 0;
            updateCoverflow();
        });
    });

    // 4. Per-work inner carousel initialization
    const initInnerCarousels = () => {
        const items = document.querySelectorAll('.showcase-item, .work-card');

        items.forEach(item => {
            const carousels = item.querySelectorAll('.inner-carousel');
            if (carousels.length === 0) return;

            carousels.forEach(carousel => {
                let slides = Array.from(carousel.querySelectorAll('img'));
                let current = 0;
                let timer;

                // Add data-index to initial images
                slides.forEach((img, idx) => { img.setAttribute('data-index', idx + 1); });

                const show = (index) => {
                    slides.forEach((s, i) => s.classList.toggle('slide-active', i === index));
                };

                const next = () => {
                    current = (current + 1) % slides.length;
                    show(current);
                };

                const prev = () => {
                    current = (current - 1 + slides.length) % slides.length;
                    show(current);
                };

                // Wire up buttons
                const btnPrev = carousel.querySelector('.inner-prev');
                const btnNext = carousel.querySelector('.inner-next');
                if (btnPrev) btnPrev.addEventListener('click', (e) => { e.preventDefault(); prev(); resetTimer(); });
                if (btnNext) btnNext.addEventListener('click', (e) => { e.preventDefault(); next(); resetTimer(); });

                // Add edit/upload UI per item so user can upload images for this carousel
                let editBtn = carousel.querySelector('.edit-carousel');
                if (!editBtn) {
                    editBtn = document.createElement('button');
                    editBtn.className = 'edit-carousel';
                    editBtn.title = 'Upload images for this work';
                    editBtn.innerHTML = '✎';
                    carousel.appendChild(editBtn);
                }

                // hidden file input
                let fileInput = carousel.querySelector('.uploader-input');
                if (!fileInput) {
                    fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.multiple = true;
                    fileInput.className = 'uploader-input';
                    carousel.appendChild(fileInput);
                }

                editBtn.addEventListener('click', () => fileInput.click());

                fileInput.addEventListener('change', (ev) => {
                    const files = Array.from(ev.target.files);
                    if (files.length === 0) return;

                    // read files as data URLs and replace slides
                    const readers = files.map(f => new Promise((res, rej) => {
                        const r = new FileReader();
                        r.onload = () => res(r.result);
                        r.onerror = rej;
                        r.readAsDataURL(f);
                    }));

                    Promise.all(readers).then(dataUrls => {
                        // remove existing slide elements
                        carousel.querySelectorAll('img').forEach(n => n.remove());
                        // add new slides
                        dataUrls.forEach(url => {
                            const img = document.createElement('img');
                            img.src = url;
                            carousel.insertBefore(img, carousel.querySelector('.inner-prev'));
                        });
                        // refresh slides reference
                        slides = Array.from(carousel.querySelectorAll('img'));
                        current = 0;
                        show(current);
                        resetTimer();
                        // re-evaluate outer slider layout in case sizes changed
                        updateSlider();
                    }).catch(() => { alert('Failed reading files'); });
                });

                const start = () => { timer = setInterval(next, 1500); };
                const stop = () => { clearInterval(timer); };
                const resetTimer = () => { stop(); start(); };

                // start showing
                show(current);
                start();

                // pause inner carousel when parent is hovered
                carousel.addEventListener('mouseenter', stop);
                carousel.addEventListener('mouseleave', start);
            });
        });
    };

    initInnerCarousels();
});