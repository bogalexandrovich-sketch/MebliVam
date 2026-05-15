import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const IMGBB_API_KEY = "fed56a153d831e2a13a70f3316ec1229";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec";

// Твоя оригінальна логіка видалення
window.deleteReview = async (id) => {
    if (confirm("Видалити цей відгук остаточно?")) {
        try {
            await deleteDoc(doc(db, "reviews", id));
        } catch (err) {
            console.error("Помилка видалення:", err);
        }
    }
};

// Твоя оригінальна логіка бану
window.banUser = async (email) => {
    if (confirm(`Забанити користувача ${email}?`)) {
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ type: "ban", email: email })
            });
            alert("Запит на бан надіслано в таблицю.");
        } catch (err) {
            console.error("Помилка бану:", err);
        }
    }
};

// Логіка реакцій та відповідей без зміни стилів
window.likeReview = async (id) => {
    try { await updateDoc(doc(db, "reviews", id), { likes: increment(1) }); } catch (e) {}
};

window.dislikeReview = async (id) => {
    try { await updateDoc(doc(db, "reviews", id), { dislikes: increment(1) }); } catch (e) {}
};

window.replyReview = (id) => {
    const user = auth.currentUser;
    if (!user) return;
    const replyText = prompt("Введіть вашу відповідь:");
    if (!replyText || !replyText.trim()) return;
    try {
        updateDoc(doc(db, "reviews", id), {
            replies: arrayUnion({
                name: user.displayName,
                photo: user.photoURL,
                text: replyText.trim(),
                                timestamp: new Date().toISOString()
            })
        });
    } catch (e) {}
};

window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

async function checkUserStatus(email) {
    try {
        const response = await fetch(`${SCRIPT_URL}?email=${encodeURIComponent(email)}`);
        return await response.json();
    } catch (e) {
        return { banned: false, status: "Новачок" };
    }
}

function getStatusBadge(status) {
    const badges = {
        "Амбасадор 💎": "bg-amber-500/20 text-amber-500 border-amber-500/50",
        "Експерт 🏆": "bg-slate-500/20 text-slate-300 border-slate-500/50",
        "Поціновувач 🏅": "bg-blue-500/10 text-blue-400 border-blue-500/30"
    };
    if (!badges[status]) return "";
    return `<span class="ml-2 px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg ${badges[status]}">${status}</span>`;
}

onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    const formWrapper = document.getElementById('review-form-wrapper');
    if (!authSection) return;

    if (user) {
        const info = await checkUserStatus(user.email);
        if (info.banned) {
            alert("Доступ обмежено.");
            logout();
            return;
        }

        const isAdmin = user.email === adminEmail;
        authSection.innerHTML = `
        <div class="flex items-center justify-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 max-w-fit mx-auto">
        <img src="${user.photoURL}" class="w-8 h-8 rounded-full border border-amber-500">
        <div class="text-left">
        <p class="text-white text-[10px] uppercase font-bold">${user.displayName}</p>
        ${getStatusBadge(info.status)}
        </div>
        ${isAdmin ? `<a href="https://docs.google.com/spreadsheets/d/132o4JFFRBOPW-T55ZD67ugqv9ufxxfjRvOODXnFn5Vs/edit" target="_blank" class="px-2 py-1 bg-green-600/20 border border-green-500/50 rounded text-green-400 text-[8px] font-black uppercase">БАЗА</a>` : ""}
        <button onclick="logout()" class="text-amber-500 text-[10px] font-black uppercase hover:text-white ml-2">Вийти</button>
        </div>`;
        if (formWrapper) formWrapper.classList.remove('hidden');
    } else {
        authSection.innerHTML = `<button onclick="login()" class="px-10 py-5 bg-amber-600 hover:bg-amber-500 rounded-2xl font-black uppercase text-[10px] text-white">Увійти через Google</button>`;
        if (formWrapper) formWrapper.classList.add('hidden');
    }
});

// Оригінальний дизайн карток з першого скріншоту
onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    container.innerHTML = "";

    snap.forEach((reviewDoc) => {
        const d = reviewDoc.data();
        const id = reviewDoc.id;
        const currentUserEmail = auth.currentUser?.email;
        const isAdmin = currentUserEmail === adminEmail;
        const isOwner = currentUserEmail === d.email || isAdmin;
        const date = d.timestamp ? new Date(d.timestamp.toDate()).toLocaleString('uk-UA') : "Щойно";

        let repliesHTML = "";
        if (d.replies && d.replies.length > 0) {
            d.replies.forEach(r => {
                repliesHTML += `
                <div class="mt-3 ml-10 p-3 bg-white/5 rounded-xl border border-white/5 text-left flex gap-3 items-start">
                <img src="${r.photo}" class="w-6 h-6 rounded-full">
                <div>
                <p class="text-[9px] font-bold text-amber-500 uppercase">${r.name}</p>
                <p class="text-xs text-slate-300 mt-1">${r.text}</p>
                </div>
                </div>`;
            });
        }

        container.innerHTML += `
        <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6 relative group shadow-xl">
        <div class="flex items-center gap-4 mb-4">
        <img src="${d.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20">
        <div class="flex-grow text-left">
        <h4 class="text-[10px] font-black uppercase text-amber-500 tracking-widest">
        ${d.name} <span class="text-xl ml-2">${d.rating || "😍"}</span>
        </h4>
        <p class="text-[8px] text-slate-500 uppercase">${date}</p>
        </div>

        <div class="text-[10px] font-bold uppercase tracking-wider flex gap-3">
        ${isAdmin && currentUserEmail !== d.email ? `<button onclick="banUser('${d.email}')" class="text-red-500/60 hover:text-red-500 transition-colors"><i class="fas fa-ban mr-1"></i>Бан</button>` : ""}
        ${isOwner ? `<button onclick="deleteReview('${id}')" class="text-red-500/60 hover:text-red-500 transition-colors">Видалити</button>` : ""}
        </div>
        </div>

        <p class="text-sm italic text-slate-300 font-light text-left">"${d.text}"</p>
        ${d.reviewImage ? `<img src="${d.reviewImage}" class="mt-4 rounded-2xl border border-white/10 max-h-96 w-auto">` : ""}

        <div class="mt-6 flex items-center gap-2 border-t border-white/5 pt-4">
        <button onclick="likeReview('${id}')" class="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-slate-400 text-xs transition-colors">
        <span class="text-amber-500 text-[10px]">👍</span> <span class="text-[10px] font-bold">${d.likes || 0}</span>
        </button>
        <button onclick="dislikeReview('${id}')" class="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-slate-400 text-xs transition-colors">
        <span class="text-amber-500 text-[10px]">👎</span> <span class="text-[10px] font-bold">${d.dislikes || 0}</span>
        </button>
        <button onclick="replyReview('${id}')" class="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-1.5 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-wider transition-colors ml-2">
        <i class="fas fa-comment-alt text-[9px]"></i> Відповісти
        </button>
        </div>

        <div class="replies-container">
        ${repliesHTML}
        </div>
        </div>`;
    });
});

document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btn = e.target.querySelector('button[type="submit"]');
    const textInput = document.getElementById('review-text');
    const imageInput = document.getElementById('review-image');

    btn.disabled = true;
    btn.textContent = "ЗАВАНТАЖЕННЯ...";

    let uploadedImageUrl = "";

    try {
        if (imageInput.files[0]) {
            const formData = new FormData();
            formData.append("image", imageInput.files[0]);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const imgData = await res.json();
            uploadedImageUrl = imgData.data.url;
        }

        await addDoc(collection(db, "reviews"), {
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            text: textInput.value,
            rating: document.getElementById('selected-rating').value,
                     reviewImage: uploadedImageUrl,
                     timestamp: serverTimestamp(),
                     likes: 0,
                     dislikes: 0,
                     replies: []
        });

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ type: "comment", name: user.displayName, email: user.email, comment: textInput.value })
        });

        textInput.value = "";
        imageInput.value = "";
        document.getElementById('file-chosen').textContent = "";
    } catch (err) {
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = "ОПУБЛІКУВАТИ";
    }
});
