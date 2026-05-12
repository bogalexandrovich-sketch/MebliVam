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

    // 4. Свайпи
    overlay.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    overlay.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) nextPhoto();
        if (touchEndX - touchStartX > 50) prevPhoto();
    }, { passive: true });

        // 5. Клавіатура та клік по фону
        overlay.onclick = (e) => { if (e.target === overlay) closeBtn?.click(); };
        document.addEventListener('keydown', (e) => {
            if (overlay.classList.contains('hidden')) return;
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'Escape') closeBtn?.click();
        });

            // 6. Захист контенту
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('dragstart', e => { if (e.target.nodeName === 'IMG') e.preventDefault(); });
});
