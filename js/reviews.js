import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB6cfj0rKRz2B_MgPrELJe8sFav942TrF0",
    authDomain: "meblivam-pp-ua.firebaseapp.com",
    projectId: "meblivam-pp-ua",
    storageBucket: "meblivam-pp-ua.appspot.com",
    messagingSenderId: "565017405232",
    appId: "1:565017405232:web:2f865f979720b0805164f9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Робимо функції доступними для кнопок у HTML (через window)
window.login = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    try {
        if (isMobile) {
            await signInWithRedirect(auth, provider);
        } else {
            await signInWithPopup(auth, provider);
        }
    } catch (err) {
        console.error("Помилка входу:", err);
        // Якщо Popup заблоковано, пробуємо редирект як план Б
        await signInWithRedirect(auth, provider);
    }
};

window.logout = () => signOut(auth);

// Слідкуємо за входом юзера
onAuthStateChanged(auth, (user) => {
    const authSec = document.getElementById('auth-section');
    const formSec = document.getElementById('review-form-section');

    if (user) {
        // Юзер залогінився
        if (authSec) {
            authSec.innerHTML = `
            <div class="flex items-center gap-3 bg-white/10 p-1.5 rounded-full border border-white/20 shadow-lg">
            <img src="${user.photoURL}" class="w-8 h-8 rounded-full border border-amber-500">
            <span class="text-[9px] uppercase font-black text-white tracking-tighter">${user.displayName}</span>
            <button onclick="logout()" class="text-amber-500 text-[9px] font-black uppercase px-2 hover:text-white">Вихід</button>
            </div>`;
        }
        if (formSec) {
            formSec.classList.remove('hidden');
            formSec.style.display = 'block';
        }
    } else {
        // Юзер НЕ залогінився
        if (authSec) {
            authSec.innerHTML = `
            <button onclick="login()" class="px-10 py-5 bg-amber-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
            Увійти через Google
            </button>`;
        }
        if (formSec) {
            formSec.classList.add('hidden');
            formSec.style.display = 'none';
        }
    }
});

// Відображення відгуків
onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    container.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        container.innerHTML += `
        <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6 shadow-xl animate-fade-in">
        <div class="flex items-center gap-4 mb-4">
        <img src="${d.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20 shadow-md">
        <h4 class="text-[10px] font-black uppercase text-amber-500 tracking-widest">${d.name}</h4>
        </div>
        <p class="text-sm italic text-slate-300 font-light leading-relaxed">"${d.text}"</p>
        </div>`;
    });
});

// Обробка форми
document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('review-text');
    if (!input.value.trim() || !auth.currentUser) return;

    try {
        await addDoc(collection(db, "reviews"), {
            name: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            text: input.value,
            timestamp: serverTimestamp()
        });
        input.value = "";
    } catch (err) {
        console.error("Помилка збереження:", err);
    }
});
