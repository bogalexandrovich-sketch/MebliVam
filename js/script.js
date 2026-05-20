document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізуємо банер, коли DOM повністю завантажено
    initAdBanner();
});

// Функція для керування рекламним банером
function initAdBanner() {
    const adBlock = document.getElementById('ad-block');
    if (!adBlock) return; // Якщо на сторінці немає банера, нічого не робимо

    // Перевіряємо, чи закривав користувач банер раніше (в будь-який час на будь-якій сторінці)
    const isClosed = localStorage.getItem('adBannerClosed');

    if (!isClosed) {
        // Якщо не закривав — показуємо
        adBlock.classList.remove('hidden');
    }
}

// Функція, яка спрацьовує при натисканні на хрестик
function closeAdBanner() {
    const adBlock = document.getElementById('ad-block');
    if (adBlock) {
        adBlock.classList.add('hidden'); // Ховаємо зараз
        localStorage.setItem('adBannerClosed', 'true'); // Запам'ятовуємо вибір
    }
}
