// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    initAdBanner();
    // Тут можна додавати інші виклики ініціалізації
});

function initAdBanner() {
    const adBlock = document.getElementById('ad-block');
    if (!adBlock) return;

    const isClosed = localStorage.getItem('adBannerClosed');
    if (!isClosed) {
        adBlock.classList.remove('hidden');
    }
}

function closeAdBanner() {
    const adBlock = document.getElementById('ad-block');
    if (adBlock) {
        adBlock.classList.add('hidden');
        localStorage.setItem('adBannerClosed', 'true');
    }
}
// Додаємо обробник скролу в існуючий script.js
window.addEventListener('scroll', () => {
    const btn = document.querySelector('.fixed.bottom-6.left-6');
    if (!btn) return; // якщо кнопки на сторінці немає, просто виходимо

    if (window.scrollY > 500) {
        btn.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        btn.classList.add('opacity-0', 'pointer-events-none');
    }
});
.nav-btn {
    padding: 14px 20px;
    text-align: left;
    color: #94a3b8;
    background: transparent;
    border-radius: 12px;
    transition: all 0.3s ease;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
}

.nav-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
}

.nav-btn.active {
    color: #f59e0b; /* amber-500 */
    background: rgba(245, 158, 11, 0.1);
    border-left: 4px solid #f59e0b;
}
