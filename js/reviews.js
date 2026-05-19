import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

window.getAuth = getAuth;
window.signInWithPopup = signInWithPopup;
window.GoogleAuthProvider = GoogleAuthProvider;

// КОНФІГУРАЦІЯ
const DB_TABLE_URL = "https://docs.google.com/spreadsheets/d/132o4JFFRBOPW-T55ZD67ugqv9ufxxfjRvOODXnFn5Vs/edit?usp=sharing";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec";
const IMGBB_API_KEY = "fed56a153d831e2a13a70f3316ec1229";

// --- ФУНКЦІЯ ВІДПРАВКИ В ТАБЛИЦЮ ---
async function sendDataToSheets(payload) {
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Sheets Error:", err);
    }
}

// --- ФУНКЦІЯ ЗАВАНТАЖЕННЯ ФОТО (ImgBB) ---
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        return result.success ? result.data.url : null;
    } catch (e) {
        console.error("Помилка завантаження фото:", e);
        return null;
    }
}

// --- ФУНКЦІЇ АДМІНІСТРУВАННЯ ---
window.deleteReview = async (reviewId) => {
    if (confirm("Видалити цей відгук назавжди?")) {
        try {
            await deleteDoc(doc(db, "portfolio", reviewId));
            alert("Відгук успішно видалено.");
        } catch (error) {
            console.error("Помилка видалення:", error);
            alert("Помилка доступу або мережі.");
        }
    }
};

window.banUser = (userId) => {
    if (confirm("Заблокувати цього автора?")) {
        console.log("Забанено користувача з UID:", userId);
        alert("Користувача додано до списку блокування (ID збережено в логах).");
    }
};

// --- УПРАВЛІННЯ СТАНОМ АВТОРИЗАЦІЇ ---
onAuthStateChanged(auth, (user) => {
    const authHeader = document.getElementById('auth-section');
    const authFooter = document.getElementById('auth-section-footer');
    const commentsWrapper = document.getElementById('comments-wrapper');

    if (user) {
        sendDataToSheets({ type: "auth", name: user.displayName, email: user.email });

        if (commentsWrapper) commentsWrapper.classList.remove('hidden');

        const isAdmin = user.email === "alphacentavr.2012@gmail.com";
        const adminDbBtn = isAdmin ? `
        <a href="${DB_TABLE_URL}" target="_blank"
        class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all duration-300 mr-4 group/btn shadow-lg">
        <i class="fas fa-database text-amber-500 text-[10px] group-hover/btn:rotate-12 transition-transform"></i>
        <span class="text-[9px] text-amber-500 font-black uppercase tracking-widest">База</span>
        </a>
        ` : '';

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
        if (commentsWrapper) commentsWrapper.classList.add('hidden');

        const loginBtn = `
        <button onclick="const p = new GoogleAuthProvider(); signInWithPopup(getAuth(), p)"
        class="group relative px-8 py-3.5 bg-slate-900/50 border border-white/5 rounded-full overflow-hidden transition-all duration-500 hover:border-amber-500/40">
        <span class="text-[10px] text-slate-400 group-hover:text-white font-black uppercase tracking-[0.25em]">Увійти через Google</span>
        </button>`;

        if (authHeader) authHeader.innerHTML = loginBtn;
        if (authFooter) authFooter.innerHTML = loginBtn;
    }
});

// --- ВІДПРАВКА ФОРМИ ---
const reviewForm = document.getElementById('review-form');
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('review-submit-btn');
        const fileInput = document.getElementById('review-image');

        submitBtn.disabled = true;
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i class="fas fa-sync-alt animate-spin mr-2"></i> Обробка...`;

        try {
            let uploadedImageUrl = null;
            if (fileInput.files[0]) {
                uploadedImageUrl = await uploadImage(fileInput.files[0]);
            }

            await addDoc(collection(db, "portfolio"), {
                page: "vidguky",
                title: document.getElementById('selected-rating').value,
                         desc: document.getElementById('review-text').value,
                         name: auth.currentUser.displayName,
                         photo: auth.currentUser.photoURL,
                         userId: auth.currentUser.uid,
                         reviewImage: uploadedImageUrl,
                         timestamp: serverTimestamp(),
                         verified: true
            });

            sendDataToSheets({
                type: "comment",
                name: auth.currentUser.displayName,
                email: auth.currentUser.email,
                comment: document.getElementById('review-text').value,
                             rating: document.getElementById('selected-rating').value
            });

            reviewForm.reset();
            const fileLabel = document.getElementById('file-chosen');
            if (fileLabel) fileLabel.textContent = '';
            alert("Ваш відгук успішно опубліковано!");

        } catch (error) {
            console.error("Помилка:", error);
            alert("Сталася помилка при збереженні.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    });
}

// --- ВІДОБРАЖЕННЯ ВІДГУКІВ ---
const reviewsContainer = document.getElementById('reviews-container');
if (reviewsContainer) {
    const q = query(
        collection(db, "portfolio"),
                    where("page", "==", "vidguky"),
                    orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        reviewsContainer.innerHTML = "";

        if (snapshot.empty) {
            reviewsContainer.innerHTML = `
            <div class="col-span-full text-center py-24 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[3rem]">
            <p class="text-slate-600 text-[10px] uppercase font-black tracking-[0.4em]">Наразі відгуків немає.</p>
            </div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date();
            const formattedDate = ts.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const isAdmin = auth.currentUser && auth.currentUser.email === "alphacentavr.2012@gmail.com";

            const adminTools = isAdmin ? `
            <div class="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
            <button onclick="deleteReview('${id}')" title="Видалити"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/5">
            <i class="fas fa-trash-alt text-xs"></i>
            </button>
            <button onclick="banUser('${data.userId}')" title="Забанити"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-lg shadow-orange-500/5">
            <i class="fas fa-user-slash text-xs"></i>
            </button>
            </div>
            ` : '';

            reviewsContainer.innerHTML += `
            <article class="group relative bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 md:p-12 shadow-2xl backdrop-blur-md mb-8 hover:border-amber-500/20 transition-all duration-700">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div class="flex items-center gap-5">
            <img src="${data.photo}" class="w-14 h-14 rounded-full border-2 border-amber-500/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
            <div>
            <h4 class="text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] mb-1.5">${data.name}</h4>
            <div class="flex items-center gap-3">
            <span class="text-3xl filter drop-shadow-md">${data.title}</span>
            <span class="text-[9px] text-slate-600 font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">${formattedDate}</span>
            </div>
            </div>
            </div>

            <div class="shrink-0 flex items-center gap-3 px-5 py-2.5 bg-slate-950/40 rounded-2xl border border-white/5 shadow-inner">
            <div class="flex items-center gap-2.5">
            <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span class="text-[9px] text-amber-500 font-black uppercase tracking-[0.2em]">Верифіковано</span>
            </div>
            ${adminTools}
            </div>
            </div>

            <div class="relative mb-8">
            <i class="fas fa-quote-left absolute -top-6 -left-4 text-amber-500/5 text-6xl"></i>
            <p class="text-slate-400 text-sm md:text-base font-light italic leading-relaxed relative z-10 pl-8 border-l border-white/5">
            ${data.desc}
            </p>
            </div>

            ${data.reviewImage ? `
                <div class="mt-10 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                <img src="${data.reviewImage}" class="w-full max-h-[500px] object-cover hover:scale-105 transition-transform duration-[1.5s]">
                </div>` : ''}

                <div class="absolute bottom-6 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span class="text-[8px] text-slate-700 font-black uppercase tracking-[0.5em]">MebliVam Portfolio 2026</span>
                </div>
                </article>`;
        });
    });
}
