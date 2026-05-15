import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Твої налаштування Firebase (копіюємо з основного скрипта)
const firebaseConfig = {
    apiKey: "AIzaSyB6cfj0rKRz2B_MgPrELJe8sFav942TrF0",
    authDomain: "meblivam-pp-ua.firebaseapp.com",
    projectId: "meblivam-pp-ua",
    storageBucket: "meblivam-pp-ua.firebasestorage.app",
    messagingSenderId: "212919546702",
    appId: "1:212919546702:web:9ae37460e493ce9d39641f",
    measurementId: "G-DQ8K8H4CT1"
};

// Ініціалізація (перевіряємо, чи додаток уже створений, щоб не було помилок)
let app;
try {
    app = getApp();
} catch (e) {
    app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);

// Верстка реклами
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

// Одразу ховаємо, якщо закривали в цій сесії
if (sessionStorage.getItem('adsClosed') === 'true') {
    advBlock.classList.add('hidden');
}

onAuthStateChanged(auth, (user) => {
    // Якщо користувач залогінився — реклама зникає
    if (user) {
        advBlock.classList.add('hidden');
    } else {
        // Якщо гість і ще не закривав — показуємо
        if (sessionStorage.getItem('adsClosed') !== 'true') {
            advBlock.classList.remove('hidden');
        }
    }
});

closeBtn.onclick = () => {
    advBlock.classList.add('hidden');
    sessionStorage.setItem('adsClosed', 'true');
};
