import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- АВТОМАТИЧНА ВІДПРАВКА В GOOGLE ТАБЛИЦЮ ---
async function sendToTable(user, type = "auth", additionalData = {}) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec";
    try {
        await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                name: user.displayName || "Анонім",
                email: user.email,
                ...additionalData
            })
        });
    } catch (e) {
        console.error("Помилка відправки в таблицю:", e);
    }
}

window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

// --- ФУНКЦІЯ ЕКСПОРТУ БАЗИ ---
window.exportUserEmails = async () => {
    if (auth.currentUser?.email !== adminEmail) return;
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        let emails = "Ім'я;Email;Останній візит\n";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.lastSeen ? new Date(data.lastSeen.toDate()).toLocaleString() : "Невідомо";
            emails += `${data.name};${data.email};${date}\n`;
        });
        const blob = new Blob([emails], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "meblivam_users_base.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) { console.error(err); }
};

window.deleteReview = async (id, authorEmail) => {
    const isOwner = auth.currentUser?.email === authorEmail;
    const isAdmin = auth.currentUser?.email === adminEmail;
    if (isAdmin || isOwner) {
        if (confirm("Видалити цей відгук?")) {
            try { await deleteDoc(doc(db, "reviews", id)); } catch (err) { console.error(err); }
        }
    }
};

window.deleteReply = async (reviewId, replyObj) => {
    if (auth.currentUser?.email !== adminEmail) return;
    if (confirm("Видалити цю відповідь?")) {
        try {
            await updateDoc(doc(db, "reviews", reviewId), {
                replies: arrayRemove(replyObj)
            });
        } catch (err) { console.error(err); }
    }
};

window.editReview = async (id, authorEmail, oldText) => {
    if (auth.currentUser?.email !== authorEmail) return;
    const newText = prompt("Відредагуйте ваш відгук:", oldText);
    if (!newText || newText.trim() === "" || newText === oldText) return;
    try { await updateDoc(doc(db, "reviews", id), { text: newText.trim() }); } catch (err) { console.error(err); }
};

window.toggleReplyForm = (id) => {
    if (!auth.currentUser) return alert("Увійдіть, щоб відповісти!");
    const form = document.getElementById(`reply-form-${id}`);
    form.classList.toggle('hidden');
};

window.submitReply = async (id) => {
    const input = document.getElementById(`reply-input-${id}`);
    const replyText = input.value.trim();
    if (!replyText) return;
    try {
        const isAdmin = auth.currentUser.email === adminEmail;
        await updateDoc(doc(db, "reviews", id), {
            replies: arrayUnion({
                name: auth.currentUser.displayName,
                text: replyText,
                isAdmin: isAdmin,
                timestamp: Date.now()
            })
        });
        input.value = "";
        window.toggleReplyForm(id);
    } catch (err) { console.error(err); }
};

window.vote = async (id, type) => {
    if (!auth.currentUser) return alert("Увійдіть, щоб проголосувати!");
    const userId = auth.currentUser.uid;
    const reviewRef = doc(db, "reviews", id);
    const docSnap = await getDoc(reviewRef);
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const likedBy = data.likedBy || [];
    const dislikedBy = data.dislikedBy || [];
    if (type === 'likes') {
        likedBy.includes(userId) ? await updateDoc(reviewRef, { likedBy: arrayRemove(userId) }) : await updateDoc(reviewRef, { likedBy: arrayUnion(userId), dislikedBy: arrayRemove(userId) });
    } else {
        dislikedBy.includes(userId) ? await updateDoc(reviewRef, { dislikedBy: arrayRemove(userId) }) : await updateDoc(reviewRef, { dislikedBy: arrayUnion(userId), likedBy: arrayRemove(userId) });
    }
};

onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    const formWrapper = document.getElementById('review-form-wrapper');
    if (!authSection) return;
    if (user) {
        // --- ВІДПРАВКА ДАНИХ ПРИ ВХОДІ (type: auth) ---
        sendToTable(user, "auth");

        const userRef = doc(db, "users", user.uid);
        try { await setDoc(userRef, { name: user.displayName, email: user.email, photo: user.photoURL, lastSeen: serverTimestamp() }, { merge: true }); } catch (err) {}

        const isAdmin = user.email === adminEmail;
        const adminBtn = isAdmin ? `
        <a href="https://docs.google.com/spreadsheets/d/132o4JFFRBOPW-T55ZD67ugqv9ufxxfjRvOODXnFn5Vs/edit?usp=sharing"
        target="_blank"
        class="ml-4 px-3 py-1 bg-green-600/20 border border-green-500/50 rounded-lg text-green-400 text-[9px] font-black uppercase hover:bg-green-600 hover:text-white transition-all inline-flex items-center gap-1">
        📥 БАЗА
        </a>` : "";

        authSection.innerHTML = `<div class="flex items-center justify-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 max-w-fit mx-auto"><img src="${user.photoURL}" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full border border-amber-500"><span class="text-white text-[10px] uppercase font-bold">Привіт, ${user.displayName}</span>${adminBtn}<button onclick="logout()" class="text-amber-500 text-[10px] font-black uppercase hover:text-white transition-colors">Вийти</button></div>`;
        if (formWrapper) formWrapper.style.display = 'block';
    } else {
        authSection.innerHTML = `<button onclick="login()" class="px-10 py-5 bg-amber-600 hover:bg-amber-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-white">Увійти через Google</button>`;
        if (formWrapper) formWrapper.style.display = 'none';
    }
});

const container = document.getElementById('reviews-container');
if (container) {
    onAuthStateChanged(auth, () => {
        onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (snap) => {
            container.innerHTML = "";
            snap.forEach(reviewDoc => {
                const d = reviewDoc.data();
                const id = reviewDoc.id;
                const user = auth.currentUser;
                const isAdmin = user?.email === adminEmail;
                const canEdit = user?.email === d.email && (Date.now() - (d.timestamp?.toDate().getTime() || 0) < 3600000);

                // Форматування дати
                const formattedDate = d.timestamp ? new Date(d.timestamp.toDate()).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";

                let repliesHtml = "";
                if (d.replies) {
                    d.replies.forEach(r => {
                        const replyDate = r.timestamp ? new Date(r.timestamp).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
                        const delBtn = isAdmin ? `<button onclick='deleteReply("${id}", ${JSON.stringify(r)})' class="ml-auto text-red-500 text-[8px] font-bold uppercase hover:text-white">Видалити</button>` : "";
                        repliesHtml += `<div class="mt-3 ml-6 p-3 border-l-2 ${r.isAdmin ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/10'} rounded-r-xl text-left flex justify-between items-start"><div><p class="text-[9px] font-black uppercase ${r.isAdmin ? 'text-amber-500' : 'text-slate-400'} mb-1">${r.isAdmin ? "Відповідь MebliVam" : r.name} <span class="ml-2 text-[8px] lowercase opacity-50 font-light">${replyDate}</span>:</p><p class="text-sm text-slate-200 font-light">"${r.text}"</p></div>${delBtn}</div>`;
                    });
                }
                container.innerHTML += `<div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6 relative shadow-xl text-left"><div class="flex items-center gap-4 mb-4"><img src="${d.photo}" class="w-10 h-10 rounded-xl border border-amber-500/20 shadow-md"><div><h4 class="text-[10px] font-black uppercase text-amber-500 tracking-widest">${d.name} <span class="ml-2 text-xl">${d.rating || ""}</span></h4><p class="text-[8px] text-slate-500 uppercase tracking-tighter">${formattedDate}</p></div><div class="ml-auto flex gap-3">${canEdit ? `<button onclick="editReview('${id}', '${d.email}', '${d.text.replace(/'/g, "\\'")}')" class="text-blue-400 text-[10px] uppercase font-bold hover:text-white transition-colors">✏️ Змінити</button>` : ''}${(isAdmin || user?.email === d.email) ? `<button onclick="deleteReview('${id}', '${d.email}')" class="text-red-500 text-[10px] uppercase font-bold hover:text-white transition-colors">Видалити</button>` : ''}</div></div><p class="text-sm italic text-slate-300 font-light leading-relaxed">"${d.text}"</p>${repliesHtml}<div id="reply-form-${id}" class="hidden mt-4 animate-fade-in"><textarea id="reply-input-${id}" class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-all" placeholder="Ваша відповідь..."></textarea><div class="flex justify-end mt-2"><button onclick="submitReply('${id}')" class="px-4 py-2 bg-amber-600 rounded-lg text-[9px] font-black uppercase text-white hover:bg-amber-500 transition-all">Надіслати</button></div></div><div class="mt-5 flex items-center gap-3 border-t border-white/5 pt-4"><button onclick="vote('${id}', 'likes')" class="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90 group"><span class="text-sm">👍</span><span class="text-[11px] font-bold text-slate-400 group-hover:text-white">${d.likedBy?.length || 0}</span></button><button onclick="vote('${id}', 'dislikes')" class="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-all active:scale-90 group"><span class="text-sm">👎</span><span class="text-[11px] font-bold text-slate-400 group-hover:text-white">${d.dislikedBy?.length || 0}</span></button><button onclick="toggleReplyForm('${id}')" class="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full hover:bg-blue-500/20 transition-all active:scale-90 group"><span class="text-sm">💬</span><span class="text-[10px] font-bold text-blue-400 uppercase tracking-tighter group-hover:text-blue-300">Відповісти</span></button></div></div>`;
            });
        });
    });
}

document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('review-text');
    const ratingInput = document.getElementById('selected-rating');
    if (!input.value.trim() || !auth.currentUser) return;

    const ratingValue = ratingInput ? ratingInput.value : "😍";

    try {
        await addDoc(collection(db, "reviews"), {
            name: auth.currentUser.displayName,
            email: auth.currentUser.email,
            photo: auth.currentUser.photoURL,
            text: input.value,
            rating: ratingValue,
            timestamp: serverTimestamp(),
                     likedBy: [], dislikedBy: [], replies: []
        });

        // Відправка сповіщення в Google Таблицю (type: comment)
        sendToTable(auth.currentUser, "comment", {
            comment: input.value,
            rating: ratingValue
        });

        input.value = "";
    } catch (err) { console.error(err); }
});
