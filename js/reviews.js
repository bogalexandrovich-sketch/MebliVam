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

window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

window.deleteReview = async (id) => {
    if (confirm("Видалити цей відгук?")) {
        try {
            await deleteDoc(doc(db, "reviews", id));
        } catch (err) { console.error("Помилка видалення:", err); }
    }
};

window.sendReply = async (id) => {
    if (!auth.currentUser) return alert("Увійдіть, щоб відповісти!");
    const replyText = prompt("Ваша відповідь:");
    if (!replyText || !replyText.trim()) return;

    try {
        const isAdmin = auth.currentUser.email === adminEmail;
        await updateDoc(doc(db, "reviews", id), {
            replies: arrayUnion({
                name: auth.currentUser.displayName,
                text: replyText.trim(),
                                isAdmin: isAdmin,
                                timestamp: Date.now()
            })
        });
    } catch (err) { console.error(err); }
};

window.vote = async (id, type) => {
    if (!auth.currentUser) return alert("Увійдіть, щоб проголосувати!");
    try {
        await updateDoc(doc(db, "reviews", id), {
            [type]: increment(1)
        });
    } catch (err) { console.error(err); }
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
        <button onclick="logout()" class="text-amber-500 text-[10px] font-black uppercase hover:text-white transition-colors">Вийти</button>
        </div>`;
        if (formWrapper) formWrapper.style.display = 'block';
    } else {
        authSection.innerHTML = `<button onclick="login()" class="px-10 py-5 bg-amber-600 hover:bg-amber-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-white">Увіййти через Google</button>`;
        if (formWrapper) formWrapper.style.display = 'none';
    }
});

const container = document.getElementById('reviews-container');
if (container) {
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = "";
        snap.forEach(reviewDoc => {
            const d = reviewDoc.data();
            const id = reviewDoc.id;
            const currentIsAdmin = auth.currentUser?.email === adminEmail;

            let repliesHtml = "";
            if (d.replies && d.replies.length > 0) {
                d.replies.forEach(r => {
                    const bgClass = r.isAdmin ? "bg-amber-500/10 border-amber-500" : "bg-white/5 border-white/10";
                    const label = r.isAdmin ? "Відповідь MebliVam" : r.name;
                    repliesHtml += `
                    <div class="mt-3 ml-6 p-3 border-l-2 ${bgClass} rounded-r-xl">
                    <p class="text-[9px] font-black uppercase ${r.isAdmin ? 'text-amber-500' : 'text-slate-400'} mb-1">${label}:</p>
                    <p class="text-sm text-slate-200 font-light leading-relaxed">"${r.text}"</p>
                    </div>`;
                });
            }

            container.innerHTML += `
            <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6 relative shadow-xl">
            <div class="flex items-center gap-4 mb-4">
            <img src="${d.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20 shadow-md">
            <div>
            <h4 class="text-[10px] font-black uppercase text-amber-500 tracking-widest">${d.name}</h4>
            </div>
            <div class="ml-auto">
            ${currentIsAdmin ? `<button onclick="deleteReview('${id}')" class="text-red-500 text-[10px] uppercase font-bold hover:text-white transition-colors">Видалити</button>` : ''}
            </div>
            </div>

            <p class="text-sm italic text-slate-300 font-light leading-relaxed">"${d.text}"</p>

            ${repliesHtml}

            <div class="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
            <button onclick="vote('${id}', 'likes')" class="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90 group">
            <span class="text-sm">👍</span>
            <span class="text-[11px] font-bold text-slate-400 group-hover:text-white">${d.likes || 0}</span>
            </button>
            <button onclick="vote('${id}', 'dislikes')" class="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90 group">
            <span class="text-sm">👎</span>
            <span class="text-[11px] font-bold text-slate-400 group-hover:text-white">${d.dislikes || 0}</span>
            </button>

            <button onclick="sendReply('${id}')" class="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full hover:bg-blue-500/20 transition-all active:scale-90 group">
            <span class="text-sm">💬</span>
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-tighter group-hover:text-blue-300">Відповісти</span>
            </button>
            </div>
            </div>`;
        });
    });
}

document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('review-text');
    if (!input.value.trim() || !auth.currentUser) return;

    try {
        await addDoc(collection(db, "reviews"), {
            name: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            text: input.value,
            timestamp: serverTimestamp(),
                     likes: 0,
                     dislikes: 0,
                     replies: []
        });
        input.value = "";
    } catch (err) { console.error("Помилка збереження:", err); }
});
