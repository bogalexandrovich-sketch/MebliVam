document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('gallery-overlay');
    const indexDisplay = document.getElementById('gallery-index');
    const nextBtn = document.getElementById('next-photo');
    const prevBtn = document.getElementById('prev-photo');
    const closeBtn = document.getElementById('close-gallery');

    if (!overlay) return;

    let currentPhotos = [];
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    // 1. Ініціалізація карток
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const rawPhotos = card.getAttribute('data-photos');
        if (!rawPhotos) return;

        const photos = rawPhotos.split(',').map(p => p.trim());
        const countSpan = card.querySelector('.photo-count');
        if (countSpan) countSpan.innerText = photos.length;

        card.addEventListener('click', () => {
            currentPhotos = photos;
            currentIndex = 0;
            updateGallery(true); // Відкриваємо без анімації виходу
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    });

    // 2. Основна функція оновлення з анімацією та підтримкою відео
    function updateGallery(isFirstOpen = false) {
        const displayContainer = overlay.querySelector('.max-w-5xl, .max-w-\\[90vw\\]');
        if (!displayContainer) return;

        const fileUrl = currentPhotos[currentIndex];
        const isVideo = fileUrl.toLowerCase().endsWith('.mp4');

        const changeContent = () => {
            displayContainer.innerHTML = '';
            let element;

            if (isVideo) {
                element = document.createElement('video');
                element.src = fileUrl;
                element.controls = true;
                element.autoplay = true;
                element.className = 'max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10 photo-enter';
            } else {
                element = document.createElement('img');
                element.src = fileUrl;
                element.alt = "View";
                element.className = 'max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10 photo-enter';
                // Захист для нового зображення
                element.oncontextmenu = e => e.preventDefault();
                element.ondragstart = e => e.preventDefault();
            }

            displayContainer.appendChild(element);
            if (indexDisplay) indexDisplay.innerText = `${currentIndex + 1} / ${currentPhotos.length}`;
        };

        if (isFirstOpen) {
            changeContent();
        } else {
            // Анімація виходу (стискання)
            const currentElement = displayContainer.querySelector('img, video');
            if (currentElement) {
                currentElement.classList.add('photo-exit');
                setTimeout(changeContent, 200);
            } else {
                changeContent();
            }
        }
    }

    // 3. Навігація
    const nextPhoto = () => {
        currentIndex = (currentIndex + 1) % currentPhotos.length;
        updateGallery();
    };

    const prevPhoto = () => {
        currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
        updateGallery();
    };

    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); nextPhoto(); };
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); prevPhoto(); };
    if (closeBtn) closeBtn.onclick = () => {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    };

    // 4. Свайпи + Подвійний тап
    let lastTap = 0;
    let isMultiTouch = false;

    overlay.addEventListener('touchstart', e => {
        if (e.touches.length > 1) isMultiTouch = true;
        else {
            isMultiTouch = false;
            touchStartX = e.changedTouches[0].screenX;
        }
    }, { passive: true });

    overlay.addEventListener('touchend', e => {
        const img = overlay.querySelector('img');
        const isZoomed = img && (img.style.transform === 'scale(2.5)' || (window.visualViewport && window.visualViewport.scale > 1.01));

        // Логіка подвійного тапу
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            if (img) {
                if (img.style.transform === 'scale(2.5)') {
                    img.style.transform = 'scale(1)';
                } else {
                    img.style.transform = 'scale(2.5)';
                }
                img.style.transition = 'transform 0.3s ease';
            }
            return;
        }
        lastTap = currentTime;

        // Блокуємо гортання, якщо збільшено
        if (isMultiTouch || isZoomed) return;

        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 60) nextPhoto();
        if (touchEndX - touchStartX > 60) prevPhoto();
    }, { passive: false });
        // 5. Подвійний тап для зуму/виходу
        let lastTap = 0;
        overlay.addEventListener('touchend', e => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 300 && tapLength > 0) {
                // Це подвійний тап!
                e.preventDefault(); // Щоб браузер не робив свій стандартний зум куди попало

                if (window.visualViewport) {
                    const currentScale = window.visualViewport.scale;

                    if (currentScale > 1.01) {
                        // Якщо вже збільшено — скидаємо в 1:1
                        window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: 'smooth'
                        });
                        // На жаль, scale напряму через JS міняти не можна (безпека),
                        // але ми можемо "обманути" систему, сфокусувавши мета-тег або просто давши юзеру команду.
                        // Проте більшість мобільних браузерів скинуть зум, якщо зробити scrollTo(0,0) при певному viewport.

                        // Альтернатива: якщо юзер подвійно тапає по збільшеному — просто кажемо браузеру "reset"
                        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=10.0');
                    } else {
                        // Якщо 1:1 — зумимо на картинку (імітуємо зум браузера)
                        // Найкращий спосіб для мобільних — дозволити браузеру відпрацювати стандартно,
                        // але ми просто не будемо йому заважати.
                    }
                }

                // Якщо хочеш саме "програмний" зум картинки (без всієї сторінки) - це надійніше:
                const img = overlay.querySelector('img');
                if (img) {
                    if (img.style.transform === 'scale(2.5)') {
                        img.style.transform = 'scale(1)';
                        img.style.transition = 'transform 0.3s ease';
                    } else {
                        img.style.transform = 'scale(2.5)';
                        img.style.transition = 'transform 0.3s ease';
                    }
                }
            }
            lastTap = currentTime;
        });
