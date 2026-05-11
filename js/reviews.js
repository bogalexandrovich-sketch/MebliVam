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

// Функція входу
window.login = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        signInWithRedirect(auth, provider);
    } else {
        signInWithPopup(auth, provider).catch(() => signInWithRedirect(auth, provider));
    }
};

// Функція виходу
window.logout = () => signOut(auth);

// Стан користувача
onAuthStateChanged(auth, (user) => {
    const authSec = document.getElementById('auth-section');
    const formSec = document.getElementById('review-form-section');

    if (user) {
        authSec.innerHTML = `
        <div class="flex items-center gap-4 bg-white/10 p-2 rounded-full border border-white/20">
        <img src="${user.photoURL}" class="w-8 h-8 rounded-full border border-amber-500">
        <span class="text-[10px] uppercase font-bold text-white">${user.displayName}</span>
        <button onclick="logout()" class="text-amber-500 text-[9px] font-black uppercase pr-4">Вийти</button>
        </div>`;
        if (formSec) {
            formSec.classList.remove('hidden');
            formSec.style.display = 'block';
        }
    } else {
        authSec.innerHTML = `<button onclick="login()" class="px-8 py-4 bg-amber-600 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">Увійти через Google</button>`;
        if (formSec) {
            formSec.classList.add('hidden');
            formSec.style.display = 'none';
        }
    }
});

// Робота з базою (Вивід)
const container = document.getElementById('reviews-container');
if (container) {
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            container.innerHTML += `
            <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-4">
            <div class="flex items-center gap-3 mb-3">
            <img src="${d.photo}" class="w-8 h-8 rounded-full">
            <h4 class="text-[10px] font-bold uppercase text-amber-500">${d.name}</h4>
            </div>
            <p class="text-sm italic text-slate-300 font-light">"${d.text}"</p>
            </div>`;
        });
    });
}

// Відправка
document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('review-text').value;
    if (!msg.trim() || !auth.currentUser) return;
    try {
        await addDoc(collection(db, "reviews"), {
            name: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            text: msg,
            timestamp: serverTimestamp()
        });
        document.getElementById('review-text').value = "";
    } catch (e) { console.error(e); }
});
