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

    const adminModal = document.getElementById('admin-post-modal');
    const adminForm = document.getElementById('admin-post-form');
    const closeAdminBtn = document.getElementById('close-admin-modal-btn');
    const imageInput = document.getElementById('post-image-input');
    const imageLabel = document.getElementById('post-image-label');

    const viewModal = document.getElementById('full-post-modal');
    const closeViewBtn = document.getElementById('close-view-modal-btn');
    const commentsList = document.getElementById('blog-comments-list');
    const commentsCount = document.getElementById('comments-count');

    // Елементи лайків/дизлайків у модалці
    const modalLikeBtn = document.getElementById('like-btn');
    const modalLikesCount = document.getElementById('likes-count');
    const modalDislikeBtn = document.getElementById('dislike-btn');
    const modalDislikesCount = document.getElementById('dislikes-count');

    // Елементи форми коментарів
    const commentForm = document.getElementById('blog-comment-form');
    const commentInput = document.getElementById('blog-comment-text');
    const sendCommentBtn = document.getElementById('send-comment-btn');
    const commentAuthTip = document.getElementById('comment-auth-tip');

    // --- 1. АВТОРИЗАЦІЯ ---
    function checkAuth() {
        const savedData = localStorage.getItem('currentUserData');
        if (savedData) {
            currentUser = JSON.parse(savedData);
            if (currentUser.email === ADMIN_EMAIL) {
                if(adminCreateBtn) adminCreateBtn.classList.remove('hidden');
            }
            if(commentInput && sendCommentBtn && commentAuthTip) {
                commentInput.disabled = false;
                sendCommentBtn.disabled = false;
                sendCommentBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                commentAuthTip.innerText = "Ви можете залишити коментар.";
                commentAuthTip.classList.replace('text-slate-500', 'text-amber-500/70');
            }
        } else {
            if(commentInput && sendCommentBtn && commentAuthTip) {
                commentInput.disabled = true;
                sendCommentBtn.disabled = true;
                sendCommentBtn.classList.add('opacity-50', 'cursor-not-allowed');
                commentAuthTip.innerText = "Увійдіть через Google у шапці сайту, щоб коментувати.";
            }
        }
    }

    setTimeout(checkAuth, 1000);

    // --- 2. ЗАВАНТАЖЕННЯ ПОСТІВ ---
    function fetchPosts() {
        if(loadingIndicator) loadingIndicator.classList.remove('hidden');
        if(postsContainer) postsContainer.classList.add('hidden');
        if(emptyState) emptyState.classList.add('hidden');

        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: 'get_posts' })
        })
        .then(res => res.json())
        .then(data => {
            if(loadingIndicator) loadingIndicator.classList.add('hidden');
            if (data.result === 'success' && data.posts && data.posts.length > 0) {
                postsData = data.posts.reverse();
                renderPosts();
            } else {
                if(emptyState) emptyState.classList.remove('hidden');
            }
        })
        .catch(err => {
            console.error("Помилка завантаження постів:", err);
            if(loadingIndicator) loadingIndicator.classList.add('hidden');
            if(emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.innerHTML = '<p class="text-rose-500 text-sm">Помилка завантаження. Спробуйте пізніше.</p>';
            }
        });
    }

    // --- 3. РЕНДЕР КАРТОК ---
    function renderPosts() {
        if(!postsContainer) return;
        postsContainer.innerHTML = '';
        const filtered = currentCategory === 'all'
        ? postsData
        : postsData.filter(p => p.category === currentCategory);

        if (filtered.length === 0) {
            postsContainer.classList.add('hidden');
            if(emptyState) emptyState.classList.remove('hidden');
            return;
        }

        postsContainer.classList.remove('hidden');
        if(emptyState) emptyState.classList.add('hidden');

        const categoryNames = { 'tips': '💡 Поради експерта', 'cases': '🛠 Наш досвід', 'trends': '🎨 Тренди', 'materials': '🔩 Матеріали' };

        filtered.forEach(post => {
            const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
            const adminButtons = isAdmin ? `
            <div class="absolute top-4 right-4 flex gap-2 z-10">
            <button data-edit-id="${post.id}" class="edit-post-btn w-8 h-8 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center hover:scale-110 shadow-lg"><i class="fas fa-pen text-xs"></i></button>
            <button data-delete-id="${post.id}" class="delete-post-btn w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 shadow-lg"><i class="fas fa-trash text-xs"></i></button>
            </div>
            ` : '';

            const imgUrl = post.imageUrl || 'assets/images/logo-meblivam.png';

            // Перевіряємо стан лайка для цієї картки (зелений якщо лайкнув)
            const userVote = (currentUser && post.voters && post.voters[currentUser.email]) ? post.voters[currentUser.email] : null;
            const likeBtnClass = userVote === 'like' ? 'text-emerald-500 liked' : 'text-slate-400';

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
            <div class="flex items-center gap-3">
            <span class="text-slate-500 text-[10px] tracking-wider">${post.date}</span>
            <button data-like-id="${post.id}" class="like-btn-card ${likeBtnClass} hover:text-emerald-500 transition-colors text-xs flex items-center gap-1">
            <i class="fas fa-thumbs-up"></i> <span>${post.likes || 0}</span>
            </button>
            </div>
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
            if(adminForm) adminForm.reset();
            document.getElementById('edit-post-id').value = '';
            document.getElementById('modal-title').innerText = 'Нова публікація';
            if(imageLabel) imageLabel.innerText = "📷 Оберіть файл обкладинки";
            if(adminModal) adminModal.classList.remove('hidden');
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
                        alert("Помилка від сервера: " + data.message);
                    } else {
                        adminModal.classList.add('hidden');
                        fetchPosts();
                    }
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

    // --- 7. ДЕЛЕГУВАННЯ ПОДІЙ ---
    if(postsContainer) {
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

            // Логіка кліку по лайку на самій картці
            const likeBtnCard = e.target.closest('.like-btn-card');
            if (likeBtnCard) {
                e.preventDefault();
                e.stopPropagation();
                if (!currentUser) return alert("Будь ласка, увійдіть, щоб ставити лайки!");

                const postId = likeBtnCard.dataset.likeId;
                const post = postsData.find(p => p.id === postId);
                if (!post) return;

                if (!post.voters) post.voters = {};
                const currentVote = post.voters[currentUser.email];

                if (currentVote === 'like') {
                    post.likes = Math.max(0, (post.likes || 1) - 1);
                    delete post.voters[currentUser.email];
                } else {
                    if (currentVote === 'dislike') post.dislikes = Math.max(0, (post.dislikes || 1) - 1);
                    post.likes = (post.likes || 0) + 1;
                    post.voters[currentUser.email] = 'like';
                }

                renderPosts();

                fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ type: 'toggle_like', id: postId, userEmail: currentUser.email })
                });
            }
        });
    }

    // --- ОБРОБКА ЛАЙКА ТА ДИЗЛАЙКА В МОДАЛЦІ ---
    if(modalLikeBtn) {
        modalLikeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentUser) return alert("Будь ласка, увійдіть, щоб ставити лайки!");

            const postId = modalLikeBtn.dataset.postId;
            const post = postsData.find(p => p.id === postId);
            if (!post) return;

            if (!post.voters) post.voters = {};
            const currentVote = post.voters[currentUser.email];

            if (currentVote === 'like') {
                post.likes = Math.max(0, (post.likes || 1) - 1);
                delete post.voters[currentUser.email];
            } else {
                if (currentVote === 'dislike') post.dislikes = Math.max(0, (post.dislikes || 1) - 1);
                post.likes = (post.likes || 0) + 1;
                post.voters[currentUser.email] = 'like';
            }

            openViewModal(postId);
            renderPosts();

            fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ type: 'toggle_like', id: postId, userEmail: currentUser.email })
            });
        });
    }

    if(modalDislikeBtn) {
        modalDislikeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentUser) return alert("Будь ласка, увійдіть, щоб ставити дизлайки!");

            const postId = modalDislikeBtn.dataset.postId;
            const post = postsData.find(p => p.id === postId);
            if (!post) return;

            if (!post.voters) post.voters = {};
            const currentVote = post.voters[currentUser.email];

            if (currentVote === 'dislike') {
                post.dislikes = Math.max(0, (post.dislikes || 1) - 1);
                delete post.voters[currentUser.email];
            } else {
                if (currentVote === 'like') post.likes = Math.max(0, (post.likes || 1) - 1);
                post.dislikes = (post.dislikes || 0) + 1;
                post.voters[currentUser.email] = 'dislike';
            }

            openViewModal(postId);
            renderPosts();

            fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ type: 'toggle_dislike', id: postId, userEmail: currentUser.email })
            });
        });
    }

    // --- ОБРОБКА ВИДАЛЕННЯ КОМЕНТАРІВ АДМІНОМ ---
    if(commentsList) {
        commentsList.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.delete-comment-btn');
            if (delBtn) {
                if(confirm("Ви точно хочете видалити цей коментар?")) {
                    const postId = delBtn.dataset.postId;
                    const commentIndex = delBtn.dataset.commentIndex;

                    const post = postsData.find(p => p.id === postId);
                    if (post && post.comments) {
                        post.comments.splice(commentIndex, 1);
                        openViewModal(postId);
                    }

                    fetch(SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({
                            type: 'delete_comment',
                            postId: postId,
                            commentIndex: commentIndex,
                            adminEmail: currentUser.email
                        })
                    }).then(() => fetchPosts());
                }
            }
        });
    }

    // --- 8. ВІДКРИТТЯ СТАТТІ ТА ЛОГІКА ЧИТАННЯ ---
    function openViewModal(id) {
        const post = postsData.find(p => p.id === id);
        if(!post) return;

        if(commentForm) commentForm.dataset.postId = id;

        const imgEl = document.getElementById('view-post-image');
        if(imgEl) imgEl.src = post.imageUrl || 'assets/images/logo-meblivam.png';

        const categoryNames = { 'tips': '💡 Поради', 'cases': '🛠 Досвід', 'trends': '🎨 Тренди', 'materials': '🔩 Матеріали' };

        const catEl = document.getElementById('view-post-category');
        if(catEl) catEl.innerText = categoryNames[post.category] || post.category;

        const titleEl = document.getElementById('view-post-title');
        if(titleEl) titleEl.innerText = post.title;

        const dateEl = document.getElementById('view-post-date');
        if(dateEl) dateEl.innerText = post.date;

        const contentEl = document.getElementById('view-post-content');
        if(contentEl) contentEl.innerText = post.content;

        const userVote = (currentUser && post.voters && post.voters[currentUser.email]) ? post.voters[currentUser.email] : null;

        if(modalLikeBtn) {
            modalLikeBtn.dataset.postId = id;
            modalLikeBtn.classList.remove('text-emerald-400', 'border-emerald-500/30', 'liked', 'text-slate-400', 'border-white/5');
            if (userVote === 'like') {
                modalLikeBtn.classList.add('text-emerald-400', 'border-emerald-500/30', 'liked');
            } else {
                modalLikeBtn.classList.add('text-slate-400', 'border-white/5');
            }
        }
        if(modalLikesCount) modalLikesCount.innerText = post.likes || 0;

        if(modalDislikeBtn) {
            modalDislikeBtn.dataset.postId = id;
            modalDislikeBtn.classList.remove('text-rose-400', 'border-rose-500/30', 'disliked', 'text-slate-400', 'border-white/5');
            if (userVote === 'dislike') {
                modalDislikeBtn.classList.add('text-rose-400', 'border-rose-500/30', 'disliked');
            } else {
                modalDislikeBtn.classList.add('text-slate-400', 'border-white/5');
            }
        }
        if(modalDislikesCount) modalDislikesCount.innerText = post.dislikes || 0;

        // Рендер коментарів
        const comments = post.comments || [];
        if (commentsCount) commentsCount.innerText = comments.length;

        if (commentsList) {
            commentsList.innerHTML = '';
            if (comments.length === 0) {
                commentsList.innerHTML = '<p class="text-slate-500 text-xs italic font-light text-center py-4">Ще немає коментарів. Будьте першим!</p>';
            } else {
                const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

                comments.forEach((c, index) => {
                    const authorName = c.author || "Анонім";
                    const deleteHtml = isAdmin ? `<button data-post-id="${id}" data-comment-index="${index}" class="delete-comment-btn text-rose-500 hover:text-rose-400 text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"><i class="fas fa-trash"></i> Видалити</button>` : '';

                    commentsList.innerHTML += `
                    <div class="bg-slate-950/60 p-4 rounded-xl border border-white/5 mb-3">
                    <div class="flex justify-between items-start mb-1">
                    <p class="text-amber-500 text-[10px] font-black uppercase tracking-widest">${authorName}</p>
                    ${deleteHtml}
                    </div>
                    <p class="text-slate-300 text-xs font-light">${c.text}</p>
                    </div>`;
                });
            }
        }

        if(viewModal) {
            viewModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    if(closeViewBtn) {
        closeViewBtn.addEventListener('click', () => {
            viewModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    }

    // --- 9. ВІДПРАВКА КОМЕНТАРЯ ---
    if(commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const text = commentInput.value.trim();
            const postId = commentForm.dataset.postId;

            if (!text || !postId) return;

            sendCommentBtn.innerText = "Надсилання...";
            sendCommentBtn.disabled = true;

            fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    type: 'add_comment',
                    id: postId,
                    userEmail: currentUser.email,
                    userName: currentUser.name,
                    userPhoto: currentUser.picture,
                    text: text
                })
            })
            .then(res => res.json())
            .then(data => {
                commentInput.value = '';
                sendCommentBtn.innerText = "Надіслати";
                sendCommentBtn.disabled = false;

                const post = postsData.find(p => p.id === postId);
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.push({ author: currentUser.name, text: text });
                    openViewModal(postId);
                    renderPosts();
                }
            })
            .catch(err => {
                alert("Помилка відправки коментаря!");
                sendCommentBtn.innerText = "Надіслати";
                sendCommentBtn.disabled = false;
            });
        });
    }

    checkAuth();
    fetchPosts();
});
