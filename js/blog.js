document.addEventListener('DOMContentLoaded', () => {
    // --- НАЛАШТУВАННЯ ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPA9DNIUfzVXmaf6AeCXQiSfllENLXGojQgOvXeJbkhQGF2nR3XBs5kr9qT9aD2aPh/exec';
    const ADMIN_EMAIL = 'alphacentavr.2012@gmail.com';

    // --- СТАН ---
    let currentUser = null;
    let postsData = [];
    let currentCategory = 'all';

    // --- ЕЛЕМЕНТИ DOM ---
    const adminCreateBtn = document.getElementById('admin-create-post-btn');
    const postsContainer = document.getElementById('blog-posts-container');
    const loadingIndicator = document.getElementById('blog-loading');
    const emptyState = document.getElementById('blog-empty');

    // Адмін модалка
    const adminModal = document.getElementById('admin-post-modal');
    const adminForm = document.getElementById('admin-post-form');
    const closeAdminBtn = document.getElementById('close-admin-modal-btn');
    const imageInput = document.getElementById('post-image-input');
    const imageLabel = document.getElementById('post-image-label');

    // Модалка перегляду
    const viewModal = document.getElementById('full-post-modal');
    const closeViewBtn = document.getElementById('close-view-modal-btn');

    // Елементи форми коментарів
    const commentForm = document.getElementById('blog-comment-form');
    const commentInput = document.getElementById('blog-comment-text');
    const sendCommentBtn = document.getElementById('send-comment-btn');
    const commentAuthTip = document.getElementById('comment-auth-tip');

    // --- 1. АВТОРИЗАЦІЯ (Тільки перевірка прав) ---
    // Ми не чіпаємо кнопку Вхід, цим керує reviews.js!
    function checkAuth() {
        const savedData = localStorage.getItem('currentUserData');
        if (savedData) {
            currentUser = JSON.parse(savedData);

            // Якщо це АДМІН - показуємо кнопку створення посту
            if (currentUser.email === ADMIN_EMAIL) {
                adminCreateBtn.classList.remove('hidden');
            }

            // Розблоковуємо коментарі
            commentInput.disabled = false;
            sendCommentBtn.disabled = false;
            sendCommentBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            commentAuthTip.innerText = "Ви можете залишити коментар.";
            commentAuthTip.classList.replace('text-slate-500', 'text-amber-500/70');
        } else {
            // Блокуємо коментарі
            commentInput.disabled = true;
            sendCommentBtn.disabled = true;
            sendCommentBtn.classList.add('opacity-50', 'cursor-not-allowed');
            commentAuthTip.innerText = "Увійдіть через Google у шапці сайту, щоб коментувати.";
        }
    }

    // Оскільки reviews.js може підвантажити користувача трохи пізніше,
    // ми будемо слухати зміни в localStorage, або просто перевіримо через секунду
    setTimeout(checkAuth, 1000);

    // --- 2. ЗАВАНТАЖЕННЯ ПОСТІВ З GOOGLE SCRIPT ---
    function fetchPosts() {
        loadingIndicator.classList.remove('hidden');
        postsContainer.classList.add('hidden');
        emptyState.classList.add('hidden');

        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: 'get_posts' })
        })
        .then(res => res.json())
        .then(data => {
            loadingIndicator.classList.add('hidden');
            if (data.result === 'success' && data.posts && data.posts.length > 0) {
                postsData = data.posts.reverse(); // Нові зверху
                renderPosts();
            } else {
                emptyState.classList.remove('hidden');
            }
        })
        .catch(err => {
            console.error("Помилка завантаження постів:", err);
            loadingIndicator.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.innerHTML = '<p class="text-rose-500 text-sm">Помилка завантаження. Спробуйте пізніше.</p>';
        });
    }

    // --- 3. РЕНДЕР КАРТОК ---
    function renderPosts() {
        postsContainer.innerHTML = '';
        const filtered = currentCategory === 'all'
        ? postsData
        : postsData.filter(p => p.category === currentCategory);

        if (filtered.length === 0) {
            postsContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        postsContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');

        const categoryNames = {
            'tips': '💡 Поради експерта',
            'cases': '🛠 Наш досвід',
            'trends': '🎨 Тренди',
            'materials': '🔩 Матеріали'
        };

        filtered.forEach(post => {
            const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
            const adminButtons = isAdmin ? `
            <div class="absolute top-4 right-4 flex gap-2 z-10">
            <button data-edit-id="${post.id}" class="edit-post-btn w-8 h-8 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center hover:scale-110 shadow-lg"><i class="fas fa-pen text-xs"></i></button>
            <button data-delete-id="${post.id}" class="delete-post-btn w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 shadow-lg"><i class="fas fa-trash text-xs"></i></button>
            </div>
            ` : '';

            const imgUrl = post.imageUrl || 'assets/images/logo-meblivam.png';

            const card = document.createElement('div');
            card.className = "group relative bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-amber-500/30 transition-all duration-500 flex flex-col h-full shadow-xl";
            card.innerHTML = `
            ${adminButtons}
            <div class="h-48 overflow-hidden bg-slate-950 relative">
            <img src="${imgUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" alt="Cover">
            </div>
            <div class="p-6 flex flex-col flex-grow">
            <span class="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-2">${categoryNames[post.category] || 'Стаття'}</span>
            <h4 class="text-white text-lg font-bold leading-tight mb-3 line-clamp-2">${post.title}</h4>
            <p class="text-slate-400 text-xs font-light line-clamp-3 mb-6 flex-grow">${post.shortDesc}</p>
            <div class="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
            <span class="text-slate-500 text-[10px] tracking-wider">${post.date}</span>
            <button data-view-id="${post.id}" class="view-post-btn text-amber-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
            Читати <i class="fas fa-arrow-right"></i>
            </button>
            </div>
            </div>
            `;
            postsContainer.appendChild(card);
        });
    }

    // --- 4. ФІЛЬТРАЦІЯ КАТЕГОРІЙ ---
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-filter-btn').forEach(b => {
                b.classList.remove('bg-amber-500', 'text-slate-950');
                b.classList.add('bg-slate-950/60', 'text-slate-400');
            });
            e.currentTarget.classList.add('bg-amber-500', 'text-slate-950');
            e.currentTarget.classList.remove('bg-slate-950/60', 'text-slate-400');
            currentCategory = e.currentTarget.dataset.category;
            renderPosts();
        });
    });

    // --- 5. КЕРУВАННЯ АДМІН-МОДАЛКОЮ ---
    if(adminCreateBtn) {
        adminCreateBtn.addEventListener('click', () => {
            adminForm.reset();
            document.getElementById('edit-post-id').value = '';
            document.getElementById('modal-title').innerText = 'Нова публікація';
            imageLabel.innerText = "📷 Оберіть файл обкладинки";
            adminModal.classList.remove('hidden');
        });
    }

    if(closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            adminModal.classList.add('hidden');
        });
    }

    if(imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            imageLabel.innerText = file ? `📎 ${file.name}` : "📷 Оберіть файл обкладинки";
        });
    }

    // --- 6. ВІДПРАВКА ДАНИХ (СТВОРЕННЯ/РЕДАГУВАННЯ) ---
    if(adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
                alert("Помилка прав доступу!");
                return;
            }

            const submitBtn = document.getElementById('save-post-btn');
            submitBtn.innerText = "Збереження...";
            submitBtn.disabled = true;

            const file = imageInput.files[0];

            const payload = {
                type: "save_post",
                id: document.getElementById('edit-post-id').value || Date.now().toString(),
                                   title: document.getElementById('post-title').value,
                                   category: document.getElementById('post-category').value,
                                   shortDesc: document.getElementById('post-short-desc').value,
                                   content: document.getElementById('post-full-content').value,
                                   adminEmail: currentUser.email
            };

            const sendReq = () => {
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.result === 'error') {
                        // Якщо Гугл виплюнув помилку, ми її побачимо!
                        alert("Помилка від сервера: " + data.message);
                        submitBtn.innerText = "Опублікувати";
                        submitBtn.disabled = false;
                    } else {
                        alert("Публікацію успішно збережено!");
                        adminModal.classList.add('hidden');
                        submitBtn.innerText = "Опублікувати";
                        submitBtn.disabled = false;
                        fetchPosts(); // Оновлюємо стрічку
                    }
                })
                .catch(err => {
                    alert("Сталася помилка мережі!");
                    submitBtn.innerText = "Опублікувати";
                    submitBtn.disabled = false;
                });
            };

            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    payload.fileData = event.target.result.split(',')[1];
                    payload.fileName = file.name;
                    sendReq();
                };
                reader.readAsDataURL(file);
            } else {
                sendReq();
            }
        });
    }

    // --- 7. ДЕЛЕГУВАННЯ ПОДІЙ (ПЕРЕГЛЯД, РЕДАГУВАННЯ, ВИДАЛЕННЯ) ---
    postsContainer.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-post-btn');
        if (viewBtn) openViewModal(viewBtn.dataset.viewId);

        const editBtn = e.target.closest('.edit-post-btn');
        if (editBtn) {
            const post = postsData.find(p => p.id === editBtn.dataset.editId);
            if (post) {
                document.getElementById('edit-post-id').value = post.id;
                document.getElementById('modal-title').innerText = 'Редагування публікації';
                document.getElementById('post-title').value = post.title;
                document.getElementById('post-category').value = post.category;
                document.getElementById('post-short-desc').value = post.shortDesc;
                document.getElementById('post-full-content').value = post.content;
                adminModal.classList.remove('hidden');
            }
        }

        const delBtn = e.target.closest('.delete-post-btn');
        if (delBtn) {
            if(confirm("Точно видалити цю статтю?")) {
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ type: 'delete_post', id: delBtn.dataset.deleteId, adminEmail: currentUser.email })
                }).then(() => fetchPosts());
            }
        }
    });

    // --- 8. ВІДКРИТТЯ СТАТТІ ТА ЛОГІКА ЧИТАННЯ ---
    function openViewModal(id) {
        const post = postsData.find(p => p.id === id);
        if(!post) return;

        document.getElementById('view-post-image').src = post.imageUrl || 'assets/images/logo-meblivam.png';
        const categoryNames = { 'tips': '💡 Поради', 'cases': '🛠 Досвід', 'trends': '🎨 Тренди', 'materials': '🔩 Матеріали' };
        document.getElementById('view-post-category').innerText = categoryNames[post.category] || post.category;
        document.getElementById('view-post-title').innerText = post.title;
        document.getElementById('view-post-date').innerText = post.date;
        document.getElementById('view-post-content').innerText = post.content;

        viewModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Ховаємо скрол
    }

    if(closeViewBtn) {
        closeViewBtn.addEventListener('click', () => {
            viewModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }

    // ІНІЦІАЛІЗАЦІЯ
    checkAuth();
    fetchPosts();
});
