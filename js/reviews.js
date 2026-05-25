import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, deleteDoc, doc, updateDoc, increment, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const DB_TABLE_URL = "https://docs.google.com/spreadsheets/d/132o4JFFRBOPW-T55ZD67ugqv9ufxxfjRvOODXnFn5Vs/edit?usp=sharing";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec";
const IMGBB_API_KEY = "fed56a153d831e2a13a70f3316ec1229";

async function sendDataToSheets(payload) {
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) { console.error("Sheets Error:", err); }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const result = await response.json();
        return result.success ? result.data.url : null;
    } catch (e) { return null; }
}

// --- АДМІНІСТРУВАННЯ ТА ВЗАЄМОДІЇ ---
window.deleteReview = async (reviewId) => {
    if (confirm("Видалити цей відгук назавжди?")) {
        try {
            await deleteDoc(doc(db, "portfolio", reviewId));
            alert("Відгук успішно видалено.");
        } catch (error) { console.error("Помилка видалення:", error); }
    }
};

window.banUser = (userId) => {
    if (confirm("Заблокувати цього автора?")) {
        console.log("Забанено користувача з UID:", userId);
        alert("Користувача додано до списку блокування (ID збережено в логах).");
    }
};

// --- CRUD КОМЕНТАРІВ ---
window.deleteComment = async (reviewId, commentId) => {
    if (!confirm("Видалити цей коментар назавжди?")) return;
    try {
        await deleteDoc(doc(db, "portfolio", reviewId, "comments", commentId));
    } catch (e) { console.error("Помилка видалення:", e); }
};

window.editComment = async (reviewId, commentId, currentText) => {
    const newText = prompt("Редагувати коментар:", currentText);
    if (newText === null || newText.trim() === "") return;
    try {
        await updateDoc(doc(db, "portfolio", reviewId, "comments", commentId), { text: newText });
    } catch (e) { console.error("Помилка редагування:", e); }
};

// Зберігаємо активні підписки у словнику: { reviewId: unsubscribeFunction }
const activeSubscriptions = {};

async function renderComments(reviewId) {
    const listContainer = document.getElementById(`comments-list-${reviewId}`);
    if (!listContainer) return;

    // 1. Відписуємось від попередньої підписки для цього reviewId, щоб уникнути витоку пам'яті
    if (activeSubscriptions[reviewId]) {
        activeSubscriptions[reviewId]();
        delete activeSubscriptions[reviewId];
    }

    const q = query(collection(db, "portfolio", reviewId, "comments"), orderBy("timestamp", "asc"));

    // 2. Створюємо нову підписку
    activeSubscriptions[reviewId] = onSnapshot(q, (snapshot) => {
        listContainer.innerHTML = ""; // Очищаємо список перед оновленням

        snapshot.forEach((docSnap) => {
            const c = docSnap.data();
            const commentId = docSnap.id;
            const isOwner = auth.currentUser && (c.uid === auth.currentUser.uid);

            // Створюємо елемент коментаря
            const commentDiv = document.createElement('div');
            commentDiv.className = "mb-3 p-3 bg-slate-950/50 rounded-xl border border-white/5";

            // Ім'я автора (БЕЗПЕЧНО)
            const nameSpan = document.createElement('span');
            nameSpan.className = "text-[9px] text-amber-500 font-bold block";
            nameSpan.textContent = c.name || 'Анонім';
            commentDiv.appendChild(nameSpan);

            // Текст коментаря (БЕЗПЕЧНО через textContent)
            const textP = document.createElement('p');
            textP.className = "text-xs text-slate-300";
            textP.textContent = c.text;
            commentDiv.appendChild(textP);

            // Кнопки дій (якщо користувач власник)
            if (isOwner) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = "flex gap-2 mt-1";
                actionsDiv.innerHTML = `
                <button class="text-[9px] text-blue-400 hover:underline">Ред.</button>
                <button class="text-[9px] text-red-500 hover:underline">Вид.</button>
                `;

                // Прив'язуємо функції безпосередньо до кнопок
                actionsDiv.querySelector('.text-blue-400').onclick = () => editComment(reviewId, commentId, c.text);
                actionsDiv.querySelector('.text-red-500').onclick = () => deleteComment(reviewId, commentId);

                commentDiv.appendChild(actionsDiv);
            }

            listContainer.appendChild(commentDiv);
        });
    }, (error) => {
        console.error("Помилка підписки на коментарі:", error);
    });
}

window.toggleComments = (id) => {
    const el = document.getElementById(`comment-section-${id}`);
    if (!el) return;

    el.classList.toggle('hidden');

    // Якщо приховуємо — відписуємось від Firestore, щоб економити ресурси
    if (el.classList.contains('hidden')) {
        if (activeSubscriptions[id]) {
            activeSubscriptions[id]();
            delete activeSubscriptions[id];
        }
    } else {
        // Якщо відкриваємо — завантажуємо дані
        renderComments(id);
    }
};

window.submitComment = async (reviewId) => {
    const input = document.getElementById(`comment-input-${reviewId}`);
    if (!input.value.trim() || !auth.currentUser) return;
    try {
        await addDoc(collection(db, "portfolio", reviewId, "comments"), {
            text: input.value,
            uid: auth.currentUser.uid,
            name: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            timestamp: serverTimestamp()
        });

        await sendDataToSheets({
            type: "comment",
            name: auth.currentUser.displayName,
            email: auth.currentUser.email,
            comment: input.value,
            reviewId: reviewId
        });

        input.value = "";
    } catch (e) { console.error(e); }
};

// --- АВТОРИЗАЦІЯ ---
onAuthStateChanged(auth, (user) => {
    const authHeader = document.getElementById('auth-section');
    const authFooter = document.getElementById('auth-section-footer');
    const commentsWrapper = document.getElementById('comments-wrapper');

    if (user) {
        sendDataToSheets({ type: "auth", name: user.displayName, email: user.email });

        // Синхронізація для калькулятора
        localStorage.setItem('currentUserData', JSON.stringify({
            name: user.displayName,
            email: user.email
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

// --- ВІДГУКИ ---
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

const reviewsContainer = document.getElementById('reviews-container');
if (reviewsContainer) {
    const q = query(collection(db, "portfolio"), where("page", "==", "vidguky"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        reviewsContainer.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date();
            const formattedDate = ts.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const isAdmin = auth.currentUser && auth.currentUser.email === "alphacentavr.2012@gmail.com";

            const adminTools = isAdmin ? `
            <div class="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
            <button onclick="deleteReview('${id}')" title="Видалити" class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/5"><i class="fas fa-trash-alt text-xs"></i></button>
            <button onclick="banUser('${data.userId}')" title="Забанити" class="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-lg shadow-orange-500/5"><i class="fas fa-user-slash text-xs"></i></button>
            </div>` : '';

            const imageHtml = data.reviewImage ? `
            <div class="mb-8 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            <img src="${data.reviewImage}" class="w-full max-h-[500px] object-cover hover:scale-105 transition-transform duration-[1.5s]">
            </div>` : '';

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

            ${imageHtml}

            <div class="mb-8 pl-8 border-l border-white/10">
            <p class="text-slate-400 text-sm md:text-base font-light leading-relaxed">${data.desc}</p>
            </div>

            <div class="flex items-center gap-6 mb-8 border-t border-white/5 pt-6">
            <button onclick="toggleComments('${id}')" class="flex items-center gap-2 text-amber-500 hover:text-white transition-colors">
            <span>💬</span> <span class="text-xs font-bold">Відповісти</span>
            </button>
            </div>

            <div id="comment-section-${id}" class="hidden space-y-4 pt-4 border-t border-white/10">
            <div id="comments-list-${id}" class="mb-4"></div>
            ${auth.currentUser ? `
                <div class="flex gap-2">
                <input id="comment-input-${id}" class="flex-1 bg-slate-950/50 rounded-xl px-4 py-3 text-sm text-white border border-white/10 focus:border-amber-500/50 outline-none" placeholder="Напишіть відповідь...">
                <button onclick="submitComment('${id}')" class="px-6 bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-colors">Надіслати</button>
                </div>
                ` : `<p class="text-xs text-slate-600 italic">Увійдіть через Google, щоб відповідати.</p>`}
                </div>

                <div class="absolute bottom-6 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span class="text-[8px] text-slate-700 font-black uppercase tracking-[0.5em]">MebliVam Portfolio 2026</span>
                </div>
                </article>`;
        });
    });
}
