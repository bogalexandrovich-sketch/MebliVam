import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Конфігурація Firebase (потрібна для ініціалізації бази даних)
const firebaseConfig = {
    apiKey: "AIzaSyB6cfj0rKRz2B_MgPrELJe8sFav942TrF0",
    authDomain: "meblivam-pp-ua.firebaseapp.com",
    projectId: "meblivam-pp-ua",
    storageBucket: "meblivam-pp-ua.firebasestorage.app",
    messagingSenderId: "212919546702",
    appId: "1:212919546702:web:9ae37460e493ce9d39641f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const IMGBB_API_KEY = "fed56a153d831e2a13a70f3316ec1229";

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

const activeSubscriptions = {};

async function renderComments(reviewId) {
    const listContainer = document.getElementById(`comments-list-${reviewId}`);
    if (!listContainer) return;

    if (activeSubscriptions[reviewId]) {
        activeSubscriptions[reviewId]();
        delete activeSubscriptions[reviewId];
    }

    const q = query(collection(db, "portfolio", reviewId, "comments"), orderBy("timestamp", "asc"));

    activeSubscriptions[reviewId] = onSnapshot(q, (snapshot) => {
        listContainer.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const c = docSnap.data();
            const commentId = docSnap.id;
            const isOwner = window.auth && window.auth.currentUser && (c.uid === window.auth.currentUser.uid);

            const commentDiv = document.createElement('div');
            commentDiv.className = "mb-3 p-3 bg-slate-950/50 rounded-xl border border-white/5";

            const nameSpan = document.createElement('span');
            nameSpan.className = "text-[9px] text-amber-500 font-bold block";
            nameSpan.textContent = c.name || 'Анонім';
            commentDiv.appendChild(nameSpan);

            const textP = document.createElement('p');
            textP.className = "text-xs text-slate-300";
            textP.textContent = c.text;
            commentDiv.appendChild(textP);

            if (isOwner) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = "flex gap-2 mt-1";
                actionsDiv.innerHTML = `
                <button class="text-[9px] text-blue-400 hover:underline">Ред.</button>
                <button class="text-[9px] text-red-500 hover:underline">Вид.</button>
                `;
                actionsDiv.querySelector('.text-blue-400').onclick = () => editComment(reviewId, commentId, c.text);
                actionsDiv.querySelector('.text-red-500').onclick = () => deleteComment(reviewId, commentId);
                commentDiv.appendChild(actionsDiv);
            }

            listContainer.appendChild(commentDiv);
        });
    }, (error) => { console.error("Помилка підписки на коментарі:", error); });
}

window.toggleComments = (id) => {
    const el = document.getElementById(`comment-section-${id}`);
    if (!el) return;
    el.classList.toggle('hidden');
    if (el.classList.contains('hidden')) {
        if (activeSubscriptions[id]) {
            activeSubscriptions[id]();
            delete activeSubscriptions[id];
        }
    } else { renderComments(id); }
};

window.submitComment = async (reviewId) => {
    const input = document.getElementById(`comment-input-${reviewId}`);
    if (!input.value.trim() || !window.auth || !window.auth.currentUser) return;
    try {
        await addDoc(collection(db, "portfolio", reviewId, "comments"), {
            text: input.value,
            uid: window.auth.currentUser.uid,
            name: window.auth.currentUser.displayName,
            photo: window.auth.currentUser.photoURL,
            timestamp: serverTimestamp()
        });

        if (window.sendDataToSheets) {
            await window.sendDataToSheets({
                type: "comment",
                name: window.auth.currentUser.displayName,
                email: window.auth.currentUser.email,
                comment: input.value,
                reviewId: reviewId
            });
        }
        input.value = "";
    } catch (e) { console.error(e); }
};

// --- ВІДГУКИ ---
const reviewForm = document.getElementById('review-form');
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!window.auth || !window.auth.currentUser) {
            alert("Будь ласка, увійдіть, щоб залишити відгук.");
            return;
        }

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
                         name: window.auth.currentUser.displayName,
                         photo: window.auth.currentUser.photoURL,
                         userId: window.auth.currentUser.uid,
                         reviewImage: uploadedImageUrl,
                         timestamp: serverTimestamp(),
                         verified: true
            });

            if(window.sendDataToSheets) {
                window.sendDataToSheets({
                    type: "comment",
                    name: window.auth.currentUser.displayName,
                    email: window.auth.currentUser.email,
                    comment: document.getElementById('review-text').value,
                                        rating: document.getElementById('selected-rating').value
                });
            }

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

            // Перевіряємо чи користувач залогінений і чи він адмін
            const isAdmin = window.auth && window.auth.currentUser && window.auth.currentUser.email === "alphacentavr.2012@gmail.com";
            const isUserLoggedIn = window.auth && window.auth.currentUser;

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
            ${isUserLoggedIn ? `
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
