import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

// Створюємо верстку (зверни увагу: тут додано клас hidden за замовчуванням)
const adsHTML = `
<div id="adv-block" class="fixed bottom-6 right-6 z-[100] group hidden">
<div class="relative bg-zinc-900/80 backdrop-blur-md border border-amber-500/30 p-4 rounded-xl shadow-2xl max-w-[200px] transition-all duration-500 hover:border-amber-500 hover:scale-105">
<div class="absolute -top-1 -left-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
<p class="text-xs text-white/90 font-light leading-relaxed">
Бажаєте бачити свої товари в наших проектах?
<span class="block mt-2 text-amber-500 font-medium uppercase tracking-wider text-[10px]">
Тут може бути ваша реклама
</span>
</p>
<a href="https://t.me/alphacentavr_2012" target="_blank" class="mt-3 block text-center py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black text-[10px] uppercase font-bold rounded transition-colors duration-300">
Зв'язатися
</a>
<button id="close-ads-btn" class="absolute -top-2 -right-2 bg-zinc-800 text-white/40 hover:text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center border border-white/10">
<i class="fas fa-times"></i>
</button>
</div>
</div>`;

document.body.insertAdjacentHTML('beforeend', adsHTML);

const advBlock = document.getElementById('adv-block');
const closeBtn = document.getElementById('close-ads-btn');

onAuthStateChanged(auth, (user) => {
    const isClosedInSession = sessionStorage.getItem('adsClosed');

    if (user) {
        // Якщо користувач увійшов
        if (isClosedInSession === 'true') {
            advBlock.classList.add('hidden');
        } else {
            advBlock.classList.remove('hidden');
        }
    } else {
        // Якщо це ГІСТЬ — показуємо завжди (або можеш теж додати перевірку сесії тут)
        advBlock.classList.remove('hidden');
    }
});

closeBtn.onclick = () => {
    advBlock.classList.add('hidden');
    // Тепер ми дозволяємо запам'ятовувати закриття ВСІМ,
    // але для гостей це скинеться після оновлення сторінки (через onAuthStateChanged вище)
    sessionStorage.setItem('adsClosed', 'true');
};
