import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Конфігурація Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB6cfj0rKRz2B_MgPrELJe8sFav942TrF0",
    authDomain: "meblivam-pp-ua.firebaseapp.com",
    projectId: "meblivam-pp-ua",
    storageBucket: "meblivam-pp-ua.firebasestorage.app",
    messagingSenderId: "212919546702",
    appId: "1:212919546702:web:9ae37460e493ce9d39641f",
    measurementId: "G-DQ8K8H4CT1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Робимо функції глобальними для кнопок "Увійти" / "Вийти"
window.getAuth = getAuth;
window.signInWithPopup = signInWithPopup;
window.GoogleAuthProvider = GoogleAuthProvider;
window.auth = auth; // Робимо auth доступним для інших скриптів (наприклад, reviews.js)

const DB_TABLE_URL = "https://docs.google.com/spreadsheets/d/132o4JFFRBOPW-T55ZD67ugqv9ufxxfjRvOODXnFn5Vs/edit?usp=sharing";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec";

// Функція відправки даних у Google Sheets
window.sendDataToSheets = async function(payload) {
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) { console.error("Sheets Error:", err); }
};

// --- АВТОРИЗАЦІЯ (Перевірка стану користувача) ---
onAuthStateChanged(auth, (user) => {
    const authHeader = document.getElementById('auth-section');
    const authFooter = document.getElementById('auth-section-footer');
    const commentsWrapper = document.getElementById('comments-wrapper');

    if (user) {
        window.sendDataToSheets({ type: "auth", name: user.displayName, email: user.email });

        // Синхронізація для інших сторінок (калькулятор, блог)
        localStorage.setItem('currentUserData', JSON.stringify({
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            uid: user.uid
        }));

        if (commentsWrapper) commentsWrapper.classList.remove('hidden');

        const isAdmin = user.email === "alphacentavr.2012@gmail.com";
        const adminDbBtn = isAdmin ? `
        <a href="${DB_TABLE_URL}" target="_blank"
        class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all duration-300 mr-4 group/btn shadow-lg">
        <i class="fas fa-database text-amber-500 text-[10px] group-hover/btn:rotate-12 transition-transform"></i>
        <span class="text-[9px] text-amber-500 font-black uppercase tracking-widest">База</span>
        </a>` : '';

        const userHtml = `
        <div class="flex items-center gap-4 group animate-fade-in">
        ${adminDbBtn}
        <div class="relative">
        <img src="${user.photoURL}" alt="${user.displayName}"
        class="w-10 h-10 rounded-full border-2 border-amber-500/30 group-hover:border-amber-500 transition-all duration-500 shadow-2xl">
        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
        </div>
        <div class="flex flex-col text-left">
        <span class="text-[10px] text-white font-black uppercase tracking-[0.2em] leading-none mb-1.5">${user.displayName}</span>
        <button onclick="getAuth().signOut()"
        class="text-[8px] text-amber-500/40 hover:text-red-500 font-black uppercase tracking-[0.25em] transition-all duration-300 flex items-center gap-1">
        <i class="fas fa-sign-out-alt"></i> Вийти
        </button>
        </div>
        </div>`;

        if (authHeader) authHeader.innerHTML = userHtml;
        if (authFooter) authFooter.innerHTML = userHtml;
    } else {
        // Очищення даних при виході
        localStorage.removeItem('currentUserData');

        if (commentsWrapper) commentsWrapper.classList.add('hidden');
        const loginBtn = `
        <button onclick="const p = new GoogleAuthProvider(); signInWithPopup(getAuth(), p)"
        style="background-color: #ffffff !important; color: #3c4043 !important;"
        class="flex items-center justify-center gap-3 px-4 py-2 rounded shadow-md border border-gray-300 hover:bg-gray-50 transition-all duration-200 mx-auto w-[120px]">
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span class="text-[13px] font-medium font-sans">Увійти</span>
        </button>`;
        if (authHeader) authHeader.innerHTML = loginBtn;
        if (authFooter) authFooter.innerHTML = loginBtn;
    }
});
