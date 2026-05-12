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
    let lastTap = 0;
    let isMultiTouch = false;

    // 1. ІНІЦІАЛІЗАЦІЯ КАРТОК (Тут був баг)
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const rawPhotos = card.getAttribute('data-photos');
        if (!rawPhotos) return;

        const photos = rawPhotos.split(',').map(p => p.trim());

        // Оновлюємо лічильник фото на самій картці
        const countSpan = card.querySelector('.photo-count');
        if (countSpan) {
            countSpan.innerText = photos.length;
        }

        // Вішаємо клік на картку для відкриття галереї
        card.addEventListener('click', () => {
            currentPhotos = photos;
            currentIndex = 0;
            updateGallery(true);
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    });

    // 2. ОНОВЛЕННЯ ГАЛЕРЕЇ
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
                element.className = 'max-w-full max-h-[85vh] rounded-lg shadow-2xl photo-enter';
            } else {
                element = document.createElement('img');
                element.src = fileUrl;
                element.className = 'max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl photo-enter';
                element.style.transform = 'scale(1)'; // Скидаємо зум при перемиканні
                element.style.transition = 'transform 0.3s ease';
                element.oncontextmenu = e => e.preventDefault();
            }

            displayContainer.appendChild(element);
            if (indexDisplay) indexDisplay.innerText = `${currentIndex + 1} / ${currentPhotos.length}`;
        };

        if (isFirstOpen) {
            changeContent();
        } else {
            const currentElement = displayContainer.querySelector('img, video');
            if (currentElement) {
                currentElement.classList.add('photo-exit');
                setTimeout(changeContent, 200);
            } else {
                changeContent();
            }
        }
    }

    // 3. НАВІГАЦІЯ
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
        if (e.touches.length > 1) {
            isMultiTouch = true;
        } else {
            isMultiTouch = false;
            touchStartX = e.changedTouches[0].screenX;
        }
    }, { passive: true });

    overlay.addEventListener('touchend', e => {
        const img = overlay.querySelector('img');
        if (!img) return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        // Перевірка на подвійний тап (менше 300мс)
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault(); // Зупиняємо стандартний зум браузера

            // Перемикаємо масштаб
            if (img.style.transform === 'scale(2.5)') {
                img.style.transform = 'scale(1)';
                img.style.zIndex = '1';
            } else {
                img.style.transform = 'scale(2.5)';
                img.style.zIndex = '50'; // Виводимо на передній план
            }
            img.style.transition = 'transform 0.3s ease-out';

            lastTap = 0; // Важливо скинути
            return;
        }
        lastTap = currentTime;

        // Блокування гортання, якщо картинка збільшена
        const isZoomed = img.style.transform === 'scale(2.5)' || (window.visualViewport && window.visualViewport.scale > 1.01);
        if (isMultiTouch || isZoomed) return;

        // Звичайний свайп
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 60) nextPhoto();
        if (touchEndX - touchStartX > 60) prevPhoto();
    }, { passive: false });
