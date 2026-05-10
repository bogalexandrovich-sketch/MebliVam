import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const adminEmail = "alphacentavr.2012@gmail.com";

window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

window.deleteReview = async (id) => {
    if (confirm("Видалити цей відгук?")) {
        try {
            await deleteDoc(doc(db, "reviews", id));
        } catch (err) {
            console.error("Помилка видалення:", err);
        }
    }
};

onAuthStateChanged(auth, (user) => {
    const authSection = document.getElementById('auth-section');
    const formWrapper = document.getElementById('review-form-wrapper');
    if (!authSection) return;

    if (user) {
        authSection.innerHTML = `
        <div class="flex items-center justify-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 max-w-fit mx-auto">
        <img src="${user.photoURL}" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full border border-amber-500">
        <span class="text-white text-[10px] uppercase font-bold">Привіт, ${user.displayName}</span>
        <button onclick="logout()" class="text-amber-500 border border-amber-500/20 px-3 py-1 rounded-lg text-[9px] hover:bg-amber-500 hover:text-white transition-all uppercase">Вийти</button>
        </div>`;
        if (formWrapper) formWrapper.classList.remove('hidden');
    } else {
        authSection.innerHTML = `
        <button onclick="login()" class="bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all shadow-xl flex items-center mx-auto gap-3">
        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="w-4 h-4"> Увійти через Google
        </button>`;
        if (formWrapper) formWrapper.classList.add('hidden');
    }
});

document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const textInput = document.getElementById('review-text');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!textInput.value.trim() || !auth.currentUser) return;

    // Зберігаємо текст і ОЧИЩАЄМО поле відразу
    const message = textInput.value;
    textInput.value = "";

    submitBtn.disabled = true;
    submitBtn.innerText = "НАДСИЛАЄТЬСЯ...";

    try {
        await addDoc(collection(db, "reviews"), {
            name: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            email: auth.currentUser.email,
            text: message,
            timestamp: serverTimestamp()
        });

        submitBtn.innerText = "ГОТОВО!";
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerText = "ОПУБЛІКУВАТИ";
        }, 2000);

    } catch (err) {
        console.error("Помилка відправки:", err);
        textInput.value = message; // Повертаємо текст у разі помилки
        submitBtn.disabled = false;
        submitBtn.innerText = "ОПУБЛІКУВАТИ";
        alert("Помилка! Спробуйте ще раз.");
    }
});

const reviewsContainer = document.getElementById('reviews-container');
const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));

// ТУТ ТІЛЬКИ ОДИН ONSNAPSHOT
onSnapshot(q, (snapshot) => {
    if (!reviewsContainer) return;
    reviewsContainer.innerHTML = '';

    snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : "Щойно";
        const isAdmin = auth.currentUser && auth.currentUser.email === adminEmail;

        reviewsContainer.innerHTML += `
        <div class="group bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-amber-500/20 transition-all duration-500 shadow-xl mb-6 relative">
        ${isAdmin ? `
            <button onclick="deleteReview('${doc.id}')" class="absolute top-6 right-6 text-red-500/20 hover:text-red-500 transition-colors text-[9px] uppercase font-bold tracking-widest px-2 py-1 border border-red-500/10 rounded-md">
            Видалити
            </button>
            ` : ''}
            <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
            <img src="${data.photo || ''}" referrerpolicy="no-referrer" class="w-12 h-12 rounded-full border-2 border-amber-500/30 group-hover:border-amber-500 transition-colors">
            <div>
            <h4 class="text-white font-bold text-[11px] uppercase tracking-wider">${data.name}</h4>
            <p class="text-slate-500 text-[9px] uppercase tracking-widest font-medium">${date}</p>
            ${isAdmin && data.email ? `<p class="text-amber-500/50 text-[8px] lowercase italic mt-1">${data.email}</p>` : ''}
            </div>
            </div>
            </div>
            <p class="text-slate-300 text-[15px] leading-relaxed italic font-light tracking-wide border-l-2 border-white/5 pl-6 group-hover:border-amber-500/30 transition-colors">
            "${data.text}"
            </p>
            </div>`;
    });
});
window.login = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        // Для смартфонів — перенаправлення
        signInWithRedirect(auth, provider);
    } else {
        // Для ПК — звичне вікно
        signInWithPopup(auth, provider).catch(() => {
            // Якщо вікно заблоковано браузером — теж робимо редирект
            signInWithRedirect(auth, provider);
        });
    }
};
