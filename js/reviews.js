import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ТВІЙ АКТУАЛЬНИЙ КОНФІГ
const firebaseConfig = {
    apiKey: "AIzaSyB-ТВІЙ-КЛЮЧ-ТУТ", // Встав свій API Key, якщо цей не підійде
    authDomain: "meblivam-pp-ua.firebaseapp.com",
    projectId: "meblivam-pp-ua",
    storageBucket: "meblivam-pp-ua.appspot.com",
    messagingSenderId: "565017405232",
    appId: "1:565017405232:web:xxxx"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Елементи інтерфейсу
const reviewsContainer = document.getElementById('reviews-container');
const authSection = document.getElementById('auth-section');
const reviewFormSection = document.getElementById('review-form-section');

// --- ЛОГІКА АВТОРИЗАЦІЇ ---

// Важливо для мобілок: обробка повернення після входу
getRedirectResult(auth).catch((error) => {
    console.error("Помилка редиректу:", error);
});

// Функція входу (тепер глобальна через window)
window.login = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // На смартфоні браузер НЕ блокує перенаправлення
        signInWithRedirect(auth, provider);
    } else {
        // На ПК відкриваємо зручне вікно
        signInWithPopup(auth, provider).catch(() => signInWithRedirect(auth, provider));
    }
};

window.logout = () => signOut(auth);

// Стежимо за юзером
onAuthStateChanged(auth, (user) => {
    if (!authSection) return;

    if (user) {
        authSection.innerHTML = `
            <div class="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
                <img src="${user.photoURL}" class="w-10 h-10 rounded-full border-2 border-amber-500 shadow-md">
                <div class="text-left">
                    <span class="block text-white text-[10px] font-black uppercase tracking-widest">${user.displayName}</span>
                    <button onclick="logout()" class="text-[9px] text-amber-500 hover:text-white transition-colors uppercase font-bold">Вийти</button>
                </div>
            </div>
        `;
        if (reviewFormSection) reviewFormSection.classList.remove('hidden');
    } else {
        authSection.innerHTML = `
            <button onclick="login()" class="bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl active:scale-95">
                Увійти через Google
            </button>
        `;
        if (reviewFormSection) reviewFormSection.classList.add('hidden');
    }
});

// --- РОБОТА З ВІДГУКАМИ ---

if (reviewsContainer) {
    document.getElementById('review-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textInput = document.getElementById('review-text');
        if (!textInput.value.trim() || !auth.currentUser) return;

        try {
            await addDoc(collection(db, "reviews"), {
                name: auth.currentUser.displayName,
                photo: auth.currentUser.photoURL,
                email: auth.currentUser.email,
                text: textInput.value,
                timestamp: serverTimestamp()
            });
            textInput.value = "";
        } catch (err) {
            console.error("Помилка Firebase:", err);
        }
    });

    // Вивід відгуків
    const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        reviewsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const isAdmin = auth.currentUser && auth.currentUser.email === "alphacentavr.2012@gmail.com";

            reviewsContainer.innerHTML += `
                <div class="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative mb-6 animate-fade-in">
                    <div class="flex items-center gap-4 mb-4">
                        <img src="${data.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20 shadow-lg">
                        <div>
                            <h4 class="text-white font-bold uppercase tracking-widest text-[10px]">${data.name}</h4>
                            <p class="text-[8px] text-amber-500/50 uppercase font-bold">
                                ${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : 'щойно'}
                            </p>
                        </div>
                    </div>
                    <p class="text-slate-300 text-sm italic leading-relaxed">"${data.text}"</p>
                    ${isAdmin ? `
                        <button onclick="deleteReview('${doc.id}')" class="absolute top-4 right-4 text-red-500/30 hover:text-red-500 transition-colors">
                            <i class="fas fa-trash-can text-xs"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });
    });
}

window.deleteReview = async (id) => {
    if (confirm('Видалити?')) await deleteDoc(doc(db, "reviews", id));
};
