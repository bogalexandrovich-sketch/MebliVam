import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

const authSec = document.getElementById('auth-section');
const formSec = document.getElementById('review-form-section');
const container = document.getElementById('reviews-container');

// Обробка для мобілок (Redirect)
getRedirectResult(auth).catch(err => console.error("Auth Error:", err));

window.login = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        signInWithRedirect(auth, provider);
    } else {
        signInWithPopup(auth, provider).catch(() => signInWithRedirect(auth, provider));
    }
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (!authSec) return;
    if (user) {
        authSec.innerHTML = `
        <div class="flex items-center gap-4 bg-white/5 p-2 pr-6 rounded-full border border-white/10 shadow-xl">
        <img src="${user.photoURL}" class="w-10 h-10 rounded-full border-2 border-amber-500">
        <div class="text-left">
        <p class="text-white text-[10px] font-bold uppercase tracking-widest">${user.displayName}</p>
        <button onclick="logout()" class="text-amber-500 text-[9px] uppercase font-black hover:text-white transition-colors">Вийти</button>
        </div>
        </div>`;
        formSec?.classList.remove('hidden');
    } else {
        authSec.innerHTML = `
        <button onclick="login()" class="px-10 py-5 bg-amber-600 hover:bg-amber-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
        Увійти через Google
        </button>`;
        formSec?.classList.add('hidden');
    }
});

if (container) {
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
        } catch (err) { console.error("Firestore Error:", err); }
    });

    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            container.innerHTML += `
            <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6 animate-fade-in shadow-lg">
            <div class="flex items-center gap-4 mb-4">
            <img src="${d.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20 shadow-md">
            <h4 class="text-[10px] font-black uppercase text-amber-500 tracking-widest">${d.name}</h4>
            </div>
            <p class="text-sm italic text-slate-300 leading-relaxed font-light">"${d.text}"</p>
            </div>`;
        });
    });
}
