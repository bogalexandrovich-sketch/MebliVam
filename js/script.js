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
