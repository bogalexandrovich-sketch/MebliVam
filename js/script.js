document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('gallery-overlay');
    const galleryImg = document.getElementById('gallery-img');
    const indexDisplay = document.getElementById('gallery-index');

    // Перевіряємо наявність елементів галереї, щоб не було помилок
    if (!overlay || !galleryImg) return;

    let currentPhotos = [];
    let currentIndex = 0;

    // 1. Ініціалізація карток та лічильників
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        const rawPhotos = card.getAttribute('data-photos');
        if (!rawPhotos) return;

        const photos = rawPhotos.split(',').map(p => p.trim());

        // Оновлюємо ярличок з кількістю
        const countSpan = card.querySelector('.photo-count');
        if (countSpan) {
            countSpan.innerText = photos.length;
        }

        // 2. Логіка відкриття
        card.addEventListener('click', (e) => {
            currentPhotos = photos;
            currentIndex = 0;
            updateGallery();
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Заборона скролу фону
        });
    });

    function updateGallery() {
        galleryImg.src = currentPhotos[currentIndex];
        if (indexDisplay) {
            indexDisplay.innerText = `${currentIndex + 1} / ${currentPhotos.length}`;
        }
    }

    // 3. Навігація в галереї
    const nextBtn = document.getElementById('next-photo');
    const prevBtn = document.getElementById('prev-photo');
    const closeBtn = document.getElementById('close-gallery');

    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % currentPhotos.length;
            updateGallery();
        };
    }

    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
            updateGallery();
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        };
    }

    // Закриття по кліку на фон або Escape
    overlay.onclick = (e) => {
        if (e.target === overlay) closeBtn.click();
    };

        document.addEventListener('keydown', (e) => {
            if (overlay.classList.contains('hidden')) return;
            if (e.key === 'ArrowRight') nextBtn?.click();
            if (e.key === 'ArrowLeft') prevBtn?.click();
            if (e.key === 'Escape') closeBtn?.click();
        });
});
function updateGallery() {
    const fileUrl = currentPhotos[currentIndex].trim();
    const isVideo = fileUrl.toLowerCase().endsWith('.mp4');

    // Знаходимо контейнер, де має бути зображення або відео
    const displayContainer = document.querySelector('#gallery-overlay div.max-w-5xl, #gallery-overlay div.max-w-\[90vw\]');

    if (!displayContainer) return;

    // Повністю очищуємо контейнер
    displayContainer.innerHTML = '';

    if (isVideo) {
        // Створюємо елемент відео
        const video = document.createElement('video');
        video.src = fileUrl;
        video.controls = true;
        video.autoplay = true;
        video.className = 'max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10';

        // Додаємо обробку помилки, якщо відео не завантажилось
        video.onerror = () => {
            displayContainer.innerHTML = `<p class="text-white">Помилка завантаження відео: ${fileUrl}</p>`;
        };

        displayContainer.appendChild(video);
    } else {
        // Створюємо елемент зображення
        const img = document.createElement('img');
        img.src = fileUrl;
        img.alt = "View";
        img.className = 'max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10';

        displayContainer.appendChild(img);
    }

    if (indexDisplay) {
        indexDisplay.innerText = `${currentIndex + 1} / ${currentPhotos.length}`;
    }
}
// Заборона контекстного меню (правої кнопки миші) на всьому сайті
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Заборона перетягування зображень (drag-and-drop)
document.addEventListener('dragstart', (e) => {
    if (e.target.nodeName === 'IMG') {
        e.preventDefault();
    }
});
document.querySelectorAll('img').forEach(img => {
    // Блокуємо контекстне меню (права кнопка і довгий натиск)
    img.addEventListener('contextmenu', e => e.preventDefault());

    // Додатковий захист від перетягування (щоб не перетягнули в іншу вкладку)
    img.addEventListener('dragstart', e => e.preventDefault());
});
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.project-card');
    const overlay = document.getElementById('gallery-overlay');
    const galleryImg = document.getElementById('gallery-img');
    const galleryIndex = document.getElementById('gallery-index');
    const closeBtn = document.getElementById('close-gallery');
    const prevBtn = document.getElementById('prev-photo');
    const nextBtn = document.getElementById('next-photo');

    let currentPhotos = [];
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    // 1. Автоматичне оновлення лічильників фото на картках
    cards.forEach(card => {
        const photos = card.dataset.photos.split(',').map(p => p.trim());
        const countSpan = card.querySelector('.photo-count');
        if (countSpan) countSpan.textContent = photos.length;

        card.addEventListener('click', () => {
            currentPhotos = photos;
            currentIndex = 0;
            showPhoto(currentIndex);
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    });

    // 2. Функція відображення фото
    function showPhoto(index) {
        galleryImg.src = currentPhotos[index];
        galleryIndex.textContent = `${index + 1} / ${currentPhotos.length}`;
    }

    // 3. Навігація
    const nextPhoto = () => {
        currentIndex = (currentIndex + 1) % currentPhotos.length;
        showPhoto(currentIndex);
    };

    const prevPhoto = () => {
        currentIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
        showPhoto(currentIndex);
    };

    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextPhoto(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevPhoto(); });

    // 4. ЛОГІКА СВАЙПІВ
    overlay.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    overlay.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50; // мінімальна відстань для свайпа
        if (touchStartX - touchEndX > swipeThreshold) {
            nextPhoto(); // свайп вліво — наступне
        }
        if (touchEndX - touchStartX > swipeThreshold) {
            prevPhoto(); // свайп вправо — попереднє
        }
    }

    // 5. Закриття
    const closeGallery = () => {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeGallery);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('.max-w-full')) {
            // закриваємо тільки якщо клікнули на фон, а не на кнопки
            if (e.target === overlay) closeGallery();
        }
    });

    // Кнопки клавіатури
    document.addEventListener('keydown', (e) => {
        if (overlay.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeGallery();
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
    });
});
