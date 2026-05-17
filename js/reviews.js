import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Чиста назва поточної сторінки (index, kuhni, shafy тощо)
const currentPage = window.location.pathname.split('/').pop().split('.')[0] || 'index';

// --- ГЛОБАЛЬНІ ФУНКЦІЇ ---
window.togglePostModal = () => {
    const modal = document.getElementById('post-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        // Автоматично виставляємо сторінку в селекті форми
        const select = document.getElementById('post-page');
        if (select) select.value = currentPage;
    }
};

window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

window.deleteProject = async (id) => {
    if (confirm("Видалити цей об'єкт з портфоліо?")) {
        try { await deleteDoc(doc(db, "portfolio", id)); }
        catch (err) { alert("Помилка видалення: " + err.message); }
    }
};

// --- АВТОРИЗАЦІЯ ТА ШАПКА ---
onAuthStateChanged(auth, async (user) => {
    const authSection = document.getElementById('auth-section');
    const mainLogo = document.getElementById('main-logo') || document.querySelector('nav a');
    if (!authSection) return;

    if (user) {
        if (mainLogo) mainLogo.classList.add('max-md:hidden');
        const isAdmin = user.email === adminEmail;
        authSection.innerHTML = `
        <div class="flex items-center gap-3 bg-black/40 backdrop-blur-xl p-1.5 rounded-full border ${isAdmin ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10'} shadow-xl">
        <img src="${user.photoURL}" class="w-8 h-8 rounded-full border-2 ${isAdmin ? 'border-amber-500' : 'border-white/20'}">
        <div class="hidden md:flex flex-col text-left leading-none">
        <span class="text-white text-[9px] font-black uppercase tracking-tighter">${user.displayName.split(' ')[0]}</span>
        <span class="${isAdmin ? 'text-amber-500' : 'text-blue-400'} text-[7px] font-black uppercase tracking-widest">${isAdmin ? 'ГОЛОВНИЙ' : 'КЛІЄНТ'}</span>
        </div>
        <div class="flex items-center gap-2 ml-1 pr-1">
        ${isAdmin ? `<button onclick="togglePostModal()" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-black text-[9px] font-black uppercase transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap">➕ ДОДАТИ ОБ'ЄКТ</button>` : ""}
        <button onclick="logout()" class="p-1 text-white/30 hover:text-red-500 transition-all"><i class="fas fa-power-off text-xs"></i></button>
        </div>
        </div>`;
    } else {
        if (mainLogo) mainLogo.classList.remove('max-md:hidden');
        authSection.innerHTML = `<button onclick="login()" class="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-black uppercase text-[9px] text-white transition-all shadow-lg shadow-blue-600/20">УВІЙТИ</button>`;
    }
});

// --- ЛОГІКА CMS ---
const postForm = document.getElementById('post-form');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('post-submit-btn');
        const imageInput = document.getElementById('post-image');
        if (!imageInput.files[0]) return alert("Спершу обери фото!");

        btn.disabled = true;
        btn.textContent = "ЗАВАНТАЖЕННЯ...";

        try {
            const formData = new FormData();
            formData.append("image", imageInput.files[0]);
            const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const imgJson = await imgRes.json();
            if (!imgJson.success) throw new Error("Помилка ImgBB");

            await addDoc(collection(db, "portfolio"), {
                page: document.getElementById('post-page').value,
                         title: document.getElementById('post-title').value,
                         desc: document.getElementById('post-desc').value,
                         image: imgJson.data.url,
                         timestamp: serverTimestamp()
            });

            alert("ОПУБЛІКОВАНО УСПІШНО!");
            window.togglePostModal();
            postForm.reset();
            document.getElementById('post-file-name').textContent = "Обрати фото об'єкта";
        } catch (err) { alert("Помилка: " + err.message); }
        finally {
            btn.disabled = false;
            btn.textContent = "ОПУБЛІКУВАТИ НА САЙТІ";
        }
    });

    document.getElementById('post-image')?.addEventListener('change', (e) => {
        const fileName = e.target.files[0] ? e.target.files[0].name : "Обрати фото об'єкта";
        document.getElementById('post-file-name').textContent = fileName;
    });
}

// --- ВІДОБРАЖЕННЯ КАРТОК ---
const grid = document.getElementById('dynamic-portfolio-grid') || document.querySelector('main .grid');
if (grid) {
    onSnapshot(query(collection(db, "portfolio"), where("page", "==", currentPage), orderBy("timestamp", "desc")), (snap) => {
        document.querySelectorAll('.dynamic-card').forEach(el => el.remove());
        let newCardsHTML = "";
        snap.forEach((postDoc) => {
            const data = postDoc.data();
            const isAdmin = auth.currentUser?.email === adminEmail;
            newCardsHTML += `
            <div class="dynamic-card group relative bg-zinc-900/50 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-500 shadow-2xl">
            <div class="aspect-square overflow-hidden relative">
            <img src="${data.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            ${isAdmin ? `<button onclick="window.deleteProject('${postDoc.id}')" class="absolute top-4 right-4 bg-red-600/80 hover:bg-red-600 text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg"><i class="fas fa-trash-alt"></i></button>` : ""}
            </div>
            <div class="p-8 relative">
            <h3 class="text-white text-xl font-black uppercase italic tracking-tighter mb-3 leading-none">${data.title}</h3>
            <p class="text-slate-400 text-xs font-light leading-relaxed uppercase tracking-widest">${data.desc}</p>
            <div class="mt-6 flex items-center gap-2 border-t border-white/5 pt-4">
            <span class="text-amber-500 text-[8px] font-black uppercase tracking-[0.3em] italic">MebliVam Portfolio</span>
            </div>
            </div>
            </div>`;
        });
        if (grid.children.length >= 1) grid.children[0].insertAdjacentHTML('afterend', newCardsHTML);
        else grid.innerHTML = newCardsHTML;
    });
}
