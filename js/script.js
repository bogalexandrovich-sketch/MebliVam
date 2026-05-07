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
