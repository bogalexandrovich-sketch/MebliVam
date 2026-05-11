import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB6cfj0rKRz2B_MgPrELJe8sFav942TrF0",
    authDomain: "meblivam-pp-ua.firebaseapp.com",
    projectId: "meblivam-pp-ua",
    storageBucket: "meblivam-pp-ua.appspot.com",
    messagingSenderId: "565017405232",
    appId: "1:565017405232:web:2f865f979720b0805164f9"
};

// Ініціалізація
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Фіксуємо сесію, щоб не «вилітало»
setPersistence(auth, browserLocalPersistence)
.then(() => {
    console.log("Persistence set to local");
})
.catch((error) => console.error("Persistence error:", error));

// Обробка повернення з Google після редиректу
getRedirectResult(auth)
.then((result) => {
    if (result?.user) {
        console.log("Вхід успішний:", result.user.displayName);
    }
})
.catch((error) => console.error("Auth error:", error));

// Основна логіка відстеження користувача
onAuthStateChanged(auth, (user) => {
    const authSec = document.getElementById('auth-section');
    const formSec = document.getElementById('review-form-section');

    if (!authSec) return;

    if (user) {
        // Якщо залогінений
        authSec.innerHTML = `
        <div class="flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/10 shadow-xl">
        <img src="${user.photoURL}" class="w-10 h-10 rounded-full border-2 border-amber-500">
        <div class="text-left px-2">
        <p class="text-white text-[10px] font-bold uppercase tracking-widest">${user.displayName}</p>
        <button id="logout-btn" class="text-amber-500 text-[9px] uppercase font-black hover:text-white transition-colors">Вийти</button>
        </div>
        </div>`;

        if (formSec) {
            formSec.classList.remove('hidden');
            formSec.style.display = 'block';
        }

        document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));
    } else {
        // Якщо не залогінений
        authSec.innerHTML = `
        <button id="login-btn" class="px-10 py-5 bg-amber-600 hover:bg-amber-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
        Увійти через Google
        </button>`;

        if (formSec) {
            formSec.classList.add('hidden');
            formSec.style.display = 'none';
        }

        document.getElementById('login-btn')?.addEventListener('click', () => {
            signInWithRedirect(auth, provider);
        });
    }
});

// Відправка коментаря
document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgInput = document.getElementById('review-text');
    if (!msgInput.value.trim() || !auth.currentUser) return;

    try {
        await addDoc(collection(db, "reviews"), {
            name: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            text: msgInput.value,
            timestamp: serverTimestamp()
        });
        msgInput.value = "";
    } catch (err) {
        console.error("Firestore error:", err);
    }
});

// Живе оновлення списку відгуків
const container = document.getElementById('reviews-container');
if (container) {
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            container.innerHTML += `
            <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6 shadow-md animate-fade-in">
            <div class="flex items-center gap-4 mb-4">
            <img src="${d.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20">
            <h4 class="text-[10px] font-black uppercase text-amber-500 tracking-widest">${d.name}</h4>
            </div>
            <p class="text-sm italic text-slate-300 font-light">"${d.text}"</p>
            </div>`;
        });
    });
}
