document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION & STATE ---
    const API = {
        admin: 'http://localhost:5000/api/admin',
        content: 'http://localhost:5000/api/content'
    };
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    let allDomainsData = [];
    let allPathsData = [];
    let allLessonsData = [];

    
    function getYouTubeID(url) {
        if (!url) return null;
        let ID = '';
        const urlParts = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        if (urlParts[2] !== undefined) {
            ID = urlParts[2].split(/[^0-9a-z_\-]/i);
            ID = ID[0];
        } else {
            
            ID = urlParts[0];
        }
        // Check if the result is a valid ID format (11 characters)
        return /^[a-zA-Z0-9_-]{11}$/.test(ID) ? ID : null;
    }

    // --- 3. DOM ELEMENT SELECTORS ---
    const addDomainForm = document.getElementById('add-domain-form');
    const domainFormMessage = document.getElementById('domain-form-message');
    const addPathForm = document.getElementById('add-path-form');
    const pathFormMessage = document.getElementById('path-form-message');
    const addLessonForm = document.getElementById('add-lesson-form');
    const lessonFormMessage = document.getElementById('lesson-form-message');

    const domainsTableBody = document.getElementById('domains-table-body');
    const pathsTableBody = document.getElementById('paths-table-body');
    const lessonsTableBody = document.getElementById('lessons-table-body');

    const editDomainModal = document.getElementById('edit-domain-modal');
    const editPathModal = document.getElementById('edit-path-modal');
    const editLessonModal = document.getElementById('edit-lesson-modal');
    const editDomainForm = document.getElementById('edit-domain-form');
    const editPathForm = document.getElementById('edit-path-form');
    const editLessonForm = document.getElementById('edit-lesson-form');

    // --- 4. MAIN DATA FETCH & RENDER ---
    const fetchAndRenderAll = async () => {
        try {
            const [domainsRes, pathsRes, lessonsRes] = await Promise.all([
                fetch(`${API.content}/domains`),
                fetch(`${API.content}/paths-all`),
                fetch(`${API.content}/lessons-all`)
            ]);
            if (!domainsRes.ok || !pathsRes.ok || !lessonsRes.ok) throw new Error('Failed to load initial admin data.');
            
            allDomainsData = await domainsRes.json();
            allPathsData = await pathsRes.json();
            allLessonsData = await lessonsRes.json();
            
            renderDomainsTable(allDomainsData);
            renderPathsTable(allPathsData);
            renderLessonsTable(allLessonsData);
            populateAllDropdowns(allDomainsData, allPathsData);

        } catch (error) {
            console.error('Error on initial load:', error);
            showToast('Could not load admin data.', 'error');
        }
    };

    // --- 5. RENDER & POPULATE FUNCTIONS ---
    function renderDomainsTable(domains) {
        domainsTableBody.innerHTML = '';
        domains.forEach(domain => {
            const row = domainsTableBody.insertRow();
            row.innerHTML = `<td>${domain.name}</td><td>${domain.slug}</td><td><button class="action-btn edit-btn" data-id="${domain._id}" data-type="domain">Edit</button><button class="action-btn delete-btn" data-id="${domain._id}" data-type="domain">Delete</button></td>`;
        });
    }

    function renderPathsTable(paths) {
        pathsTableBody.innerHTML = '';
        paths.forEach(path => {
            const row = pathsTableBody.insertRow();
            const domainName = path.domain ? path.domain.name : 'N/A';
            row.innerHTML = `<td>${path.title}</td><td>${domainName}</td><td><button class="action-btn edit-btn" data-id="${path._id}" data-type="path">Edit</button><button class="action-btn delete-btn" data-id="${path._id}" data-type="path">Delete</button></td>`;
        });
    }

    function renderLessonsTable(lessons) {
        lessonsTableBody.innerHTML = '';
        lessons.forEach(lesson => {
            const row = lessonsTableBody.insertRow();
            const pathTitle = lesson.path ? lesson.path.title : 'N/A';
            row.innerHTML = `<td>${lesson.title}</td><td>${pathTitle}</td><td>${lesson.order}</td><td><button class="action-btn edit-btn" data-id="${lesson._id}" data-type="lesson">Edit</button><button class="action-btn delete-btn" data-id="${lesson._id}" data-type="lesson">Delete</button></td>`;
        });
    }

    function populateAllDropdowns(domains, paths) {
        const domainDropdown = document.getElementById('parent-domain');
        const editDomainDropdown = document.getElementById('edit-parent-domain');
        const pathDropdown = document.getElementById('parent-path');
        const editPathDropdown = document.getElementById('edit-parent-path');

        domainDropdown.innerHTML = '<option value="">-- Select a Domain --</option>';
        editDomainDropdown.innerHTML = '<option value="">-- Select a Domain --</option>';
        domains.forEach(d => {
            const optionHtml = `<option value="${d._id}">${d.name}</option>`;
            domainDropdown.innerHTML += optionHtml;
            editDomainDropdown.innerHTML += optionHtml;
        });

        pathDropdown.innerHTML = '<option value="">-- Select a Path --</option>';
        editPathDropdown.innerHTML = '<option value="">-- Select a Path --</option>';
        paths.forEach(p => {
            const optionHtml = `<option value="${p._id}">${p.domain.name} - ${p.title}</option>`;
            pathDropdown.innerHTML += optionHtml;
            editPathDropdown.innerHTML += optionHtml;
        });
    }

    // --- 6. FORM SUBMIT HANDLERS (for creating new content) ---
    addDomainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = { name: e.target.elements.name.value, slug: e.target.elements.slug.value, description: e.target.elements.description.value, imageUrl: e.target.elements.imageUrl.value };
        try {
            const res = await fetch(`${API.admin}/domains`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(`Domain "${data.name}" created.`, 'success');
            addDomainForm.reset();
            fetchAndRenderAll();
        } catch (error) { showToast(error.message, 'error'); }
    });

    addPathForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = { title: e.target.elements['path-title'].value, description: e.target.elements['path-description'].value, domainId: e.target.elements['parent-domain'].value };
        try {
            const res = await fetch(`${API.admin}/paths`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(`Path "${data.title}" created.`, 'success');
            addPathForm.reset();
            fetchAndRenderAll();
        } catch (error) { showToast(error.message, 'error'); }
    });
    
    addLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawVideoInput = e.target.elements['yt-video-id'].value;
        const finalVideoId = getYouTubeID(rawVideoInput);

        if (!finalVideoId) {
            return showToast('Invalid YouTube URL or Video ID provided.', 'error');
        }

        const formData = { title: e.target.elements['lesson-title'].value, youtubeVideoId: finalVideoId, order: e.target.elements['lesson-order'].value, pathId: e.target.elements['parent-path'].value };
        try {
            const res = await fetch(`${API.admin}/lessons`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(`Lesson "${data.title}" created.`, 'success');
            addLessonForm.reset();
            fetchAndRenderAll();
        } catch (error) { showToast(error.message, 'error'); }
    });

    // --- 7. CLICK HANDLERS (for Edit and Delete buttons in tables) ---
    document.getElementById('admin-content-container').addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;
        const type = target.dataset.type;
        if (!id || !type) return;

        if (target.classList.contains('delete-btn')) {
            const resourceName = type === 'domain' ? 'domain and ALL its content' : type === 'path' ? 'path and ALL its lessons' : 'lesson';
            if (!confirm(`Are you sure you want to delete this ${resourceName}?`)) return;
            try {
                const res = await fetch(`${API.admin}/${type}s/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error(`Failed to delete ${type}`);
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`, 'success');
                fetchAndRenderAll();
            } catch (error) { showToast(error.message, 'error'); }
        }

        if (target.classList.contains('edit-btn')) {
            if (type === 'domain') {
                const domain = allDomainsData.find(d => d._id === id);
                if (domain) {
                    document.getElementById('edit-domain-id').value = domain._id;
                    document.getElementById('edit-domain-name').value = domain.name;
                    document.getElementById('edit-domain-slug').value = domain.slug;
                    document.getElementById('edit-domain-description').value = domain.description;
                    document.getElementById('edit-domain-imageUrl').value = domain.imageUrl;
                    editDomainModal.style.display = 'block';
                }
            } else if (type === 'path') {
                const path = allPathsData.find(p => p._id === id);
                if (path) {
                    document.getElementById('edit-path-id').value = path._id;
                    document.getElementById('edit-path-title').value = path.title;
                    document.getElementById('edit-path-description').value = path.description;
                    document.getElementById('edit-parent-domain').value = path.domain._id;
                    editPathModal.style.display = 'block';
                }
            } else if (type === 'lesson') {
                const lesson = allLessonsData.find(l => l._id === id);
                if (lesson) {
                    document.getElementById('edit-lesson-id').value = lesson._id;
                    document.getElementById('edit-lesson-title').value = lesson.title;
                    document.getElementById('edit-yt-video-id').value = lesson.youtubeVideoId;
                    document.getElementById('edit-lesson-order').value = lesson.order;
                    document.getElementById('edit-parent-path').value = lesson.path._id;
                    editLessonModal.style.display = 'block';
                }
            }
        }
    });
    
    // --- 8. MODAL HANDLERS ---
    document.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => {
        editDomainModal.style.display = 'none';
        editPathModal.style.display = 'none';
        editLessonModal.style.display = 'none';
    });
    window.onclick = (event) => {
        if (event.target == editDomainModal) editDomainModal.style.display = 'none';
        if (event.target == editPathModal) editPathModal.style.display = 'none';
        if (event.target == editLessonModal) editLessonModal.style.display = 'none';
    };

    editDomainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-domain-id').value;
        const data = { name: document.getElementById('edit-domain-name').value, slug: document.getElementById('edit-domain-slug').value, description: document.getElementById('edit-domain-description').value, imageUrl: document.getElementById('edit-domain-imageUrl').value };
        try {
            const res = await fetch(`${API.admin}/domains/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Failed to update domain');
            editDomainModal.style.display = 'none';
            showToast('Domain updated successfully!', 'success');
            fetchAndRenderAll();
        } catch (error) { showToast(error.message, 'error'); }
    });

    editPathForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-path-id').value;
        const data = { title: document.getElementById('edit-path-title').value, description: document.getElementById('edit-path-description').value, domainId: document.getElementById('edit-parent-domain').value };
        try {
            const res = await fetch(`${API.admin}/paths/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Failed to update path');
            editPathModal.style.display = 'none';
            showToast('Path updated successfully!', 'success');
            fetchAndRenderAll();
        } catch (error) { showToast(error.message, 'error'); }
    });

    editLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-lesson-id').value;
        const rawVideoInput = document.getElementById('edit-yt-video-id').value;
        const finalVideoId = getYouTubeID(rawVideoInput);
        if (!finalVideoId) return showToast('Invalid YouTube URL or Video ID.', 'error');

        const data = { title: document.getElementById('edit-lesson-title').value, youtubeVideoId: finalVideoId, order: document.getElementById('edit-lesson-order').value, pathId: document.getElementById('edit-parent-path').value };
        try {
            const res = await fetch(`${API.admin}/lessons/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Failed to update lesson');
            editLessonModal.style.display = 'none';
            showToast('Lesson updated successfully!', 'success');
            fetchAndRenderAll();
        } catch (error) { showToast(error.message, 'error'); }
    });

    // --- 9. INITIAL LOAD ---
    fetchAndRenderAll();
});
// document.addEventListener('DOMContentLoaded', () => {
//     // --- 1. CONFIGURATION & STATE ---
//     const API = {
//         admin: 'http://localhost:5000/api/admin',
//         content: 'http://localhost:5000/api/content'
//     };
//     const token = localStorage.getItem('token');
//     if (!token) {
//         window.location.href = 'login.html';
//         return;
//     }
//     let allDomainsData = [];
//     let allPathsData = [];
//     let allLessonsData = [];

//     // --- 2. DOM ELEMENT SELECTORS ---
//     const addDomainForm = document.getElementById('add-domain-form');
//     const domainFormMessage = document.getElementById('domain-form-message');
//     const addPathForm = document.getElementById('add-path-form');
//     const pathFormMessage = document.getElementById('path-form-message');
//     const addLessonForm = document.getElementById('add-lesson-form');
//     const lessonFormMessage = document.getElementById('lesson-form-message');

//     const domainsTableBody = document.getElementById('domains-table-body');
//     const pathsTableBody = document.getElementById('paths-table-body');
//     const lessonsTableBody = document.getElementById('lessons-table-body');

//     const editDomainModal = document.getElementById('edit-domain-modal');
//     const editPathModal = document.getElementById('edit-path-modal');
//     const editLessonModal = document.getElementById('edit-lesson-modal');
//     const editDomainForm = document.getElementById('edit-domain-form');
//     const editPathForm = document.getElementById('edit-path-form');
//     const editLessonForm = document.getElementById('edit-lesson-form');

//     // --- 3. MAIN DATA FETCH & RENDER ---
//     const fetchAndRenderAll = async () => {
//         try {
//             const [domainsRes, pathsRes, lessonsRes] = await Promise.all([
//                 fetch(`${API.content}/domains`),
//                 fetch(`${API.content}/paths-all`),
//                 fetch(`${API.content}/lessons-all`)
//             ]);
//             if (!domainsRes.ok || !pathsRes.ok || !lessonsRes.ok) throw new Error('Failed to load initial admin data.');
            
//             allDomainsData = await domainsRes.json();
//             allPathsData = await pathsRes.json();
//             allLessonsData = await lessonsRes.json();
            
//             renderDomainsTable(allDomainsData);
//             renderPathsTable(allPathsData);
//             renderLessonsTable(allLessonsData);
//             populateAllDropdowns(allDomainsData, allPathsData);

//         } catch (error) {
//             console.error('Error on initial load:', error);
//             showToast('Could not load admin data.', 'error');
//         }
//     };

//     // --- 4. RENDER & POPULATE FUNCTIONS ---
//     function renderDomainsTable(domains) {
//         domainsTableBody.innerHTML = '';
//         domains.forEach(domain => {
//             const row = domainsTableBody.insertRow();
//             row.innerHTML = `<td>${domain.name}</td><td>${domain.slug}</td><td><button class="action-btn edit-btn" data-id="${domain._id}" data-type="domain">Edit</button><button class="action-btn delete-btn" data-id="${domain._id}" data-type="domain">Delete</button></td>`;
//         });
//     }

//     function renderPathsTable(paths) {
//         pathsTableBody.innerHTML = '';
//         paths.forEach(path => {
//             const row = pathsTableBody.insertRow();
//             const domainName = path.domain ? path.domain.name : 'N/A';
//             row.innerHTML = `<td>${path.title}</td><td>${domainName}</td><td><button class="action-btn edit-btn" data-id="${path._id}" data-type="path">Edit</button><button class="action-btn delete-btn" data-id="${path._id}" data-type="path">Delete</button></td>`;
//         });
//     }

//     function renderLessonsTable(lessons) {
//         lessonsTableBody.innerHTML = '';
//         lessons.forEach(lesson => {
//             const row = lessonsTableBody.insertRow();
//             const pathTitle = lesson.path ? lesson.path.title : 'N/A';
//             row.innerHTML = `<td>${lesson.title}</td><td>${pathTitle}</td><td>${lesson.order}</td><td><button class="action-btn edit-btn" data-id="${lesson._id}" data-type="lesson">Edit</button><button class="action-btn delete-btn" data-id="${lesson._id}" data-type="lesson">Delete</button></td>`;
//         });
//     }

//     function populateAllDropdowns(domains, paths) {
//         const domainDropdown = document.getElementById('parent-domain');
//         const editDomainDropdown = document.getElementById('edit-parent-domain');
//         const pathDropdown = document.getElementById('parent-path');
//         const editPathDropdown = document.getElementById('edit-parent-path');

//         domainDropdown.innerHTML = '<option value="">-- Select a Domain --</option>';
//         editDomainDropdown.innerHTML = '<option value="">-- Select a Domain --</option>';
//         domains.forEach(d => {
//             const optionHtml = `<option value="${d._id}">${d.name}</option>`;
//             domainDropdown.innerHTML += optionHtml;
//             editDomainDropdown.innerHTML += optionHtml;
//         });

//         pathDropdown.innerHTML = '<option value="">-- Select a Path --</option>';
//         editPathDropdown.innerHTML = '<option value="">-- Select a Path --</option>';
//         paths.forEach(p => {
//             const optionHtml = `<option value="${p._id}">${p.domain.name} - ${p.title}</option>`;
//             pathDropdown.innerHTML += optionHtml;
//             editPathDropdown.innerHTML += optionHtml;
//         });
//     }

//     // --- 5. FORM SUBMIT HANDLERS (for creating new content) ---
//     addDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = { name: e.target.elements.name.value, slug: e.target.elements.slug.value, description: e.target.elements.description.value, imageUrl: e.target.elements.imageUrl.value };
//         try {
//             const res = await fetch(`${API.admin}/domains`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             showToast(`Domain "${data.name}" created.`, 'success');
//             addDomainForm.reset();
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     addPathForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = { title: e.target.elements['path-title'].value, description: e.target.elements['path-description'].value, domainId: e.target.elements['parent-domain'].value };
//         console.log("submitting path data",formData);
//         try {
//             const res = await fetch(`${API.admin}/paths`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             showToast(`Path "${data.title}" created.`, 'success');
//             addPathForm.reset();
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });
    
//     addLessonForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = { title: e.target.elements['lesson-title'].value, youtubeVideoId: e.target.elements['yt-video-id'].value, order: e.target.elements['lesson-order'].value, pathId: e.target.elements['parent-path'].value };
//         try {
//             const res = await fetch(`${API.admin}/lessons`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             showToast(`Lesson "${data.title}" created.`, 'success');
//             addLessonForm.reset();
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     // --- 6. CLICK HANDLERS (for Edit and Delete buttons in tables) ---
//     document.getElementById('admin-content-container').addEventListener('click', async (e) => {
//         const target = e.target;
//         const id = target.dataset.id;
//         const type = target.dataset.type;
//         if (!id || !type) return;

//         if (target.classList.contains('delete-btn')) {
//             const resourceName = type === 'domain' ? 'domain and ALL its content' : type === 'path' ? 'path and ALL its lessons' : 'lesson';
//             if (!confirm(`Are you sure you want to delete this ${resourceName}?`)) return;
//             try {
//                 const res = await fetch(`${API.admin}/${type}s/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
//                 if (!res.ok) throw new Error(`Failed to delete ${type}`);
//                 showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`, 'success');
//                 fetchAndRenderAll();
//             } catch (error) { showToast(error.message, 'error'); }
//         }

//         if (target.classList.contains('edit-btn')) {
//             if (type === 'domain') {
//                 const domain = allDomainsData.find(d => d._id === id);
//                 if (domain) {
//                     document.getElementById('edit-domain-id').value = domain._id;
//                     document.getElementById('edit-domain-name').value = domain.name;
//                     document.getElementById('edit-domain-slug').value = domain.slug;
//                     document.getElementById('edit-domain-description').value = domain.description;
//                     document.getElementById('edit-domain-imageUrl').value = domain.imageUrl;
//                     editDomainModal.style.display = 'block';
//                 }
//             } else if (type === 'path') {
//                 const path = allPathsData.find(p => p._id === id);
//                 if (path) {
//                     document.getElementById('edit-path-id').value = path._id;
//                     document.getElementById('edit-path-title').value = path.title;
//                     document.getElementById('edit-path-description').value = path.description;
//                     document.getElementById('edit-parent-domain').value = path.domain._id;
//                     editPathModal.style.display = 'block';
//                 }
//             } else if (type === 'lesson') {
//                 const lesson = allLessonsData.find(l => l._id === id);
//                 if (lesson) {
//                     document.getElementById('edit-lesson-id').value = lesson._id;
//                     document.getElementById('edit-lesson-title').value = lesson.title;
//                     document.getElementById('edit-yt-video-id').value = lesson.youtubeVideoId;
//                     document.getElementById('edit-lesson-order').value = lesson.order;
//                     document.getElementById('edit-parent-path').value = lesson.path._id;
//                     editLessonModal.style.display = 'block';
//                 }
//             }
//         }
//     });
    
//     // --- 7. MODAL HANDLERS ---
//     document.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => {
//         editDomainModal.style.display = 'none';
//         editPathModal.style.display = 'none';
//         editLessonModal.style.display = 'none';
//     });
//     window.onclick = (event) => {
//         if (event.target == editDomainModal) editDomainModal.style.display = 'none';
//         if (event.target == editPathModal) editPathModal.style.display = 'none';
//         if (event.target == editLessonModal) editLessonModal.style.display = 'none';
//     };

//     editDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const id = document.getElementById('edit-domain-id').value;
//         const data = { name: document.getElementById('edit-domain-name').value, slug: document.getElementById('edit-domain-slug').value, description: document.getElementById('edit-domain-description').value, imageUrl: document.getElementById('edit-domain-imageUrl').value };
//         try {
//             const res = await fetch(`${API.admin}/domains/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(data) });
//             if (!res.ok) throw new Error('Failed to update domain');
//             editDomainModal.style.display = 'none';
//             showToast('Domain updated successfully!', 'success');
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     editPathForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const id = document.getElementById('edit-path-id').value;
//         const data = { title: document.getElementById('edit-path-title').value, description: document.getElementById('edit-path-description').value, domainId: document.getElementById('edit-parent-domain').value };
//         try {
//             const res = await fetch(`${API.admin}/paths/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(data) });
//             if (!res.ok) throw new Error('Failed to update path');
//             editPathModal.style.display = 'none';
//             showToast('Path updated successfully!', 'success');
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     editLessonForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const id = document.getElementById('edit-lesson-id').value;
//         const data = { title: document.getElementById('edit-lesson-title').value, youtubeVideoId: document.getElementById('edit-yt-video-id').value, order: document.getElementById('edit-lesson-order').value, pathId: document.getElementById('edit-parent-path').value };
//         try {
//             const res = await fetch(`${API.admin}/lessons/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(data) });
//             if (!res.ok) throw new Error('Failed to update lesson');
//             editLessonModal.style.display = 'none';
//             showToast('Lesson updated successfully!', 'success');
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     // --- 8. INITIAL LOAD ---
//     fetchAndRenderAll();
// });

// document.addEventListener('DOMContentLoaded', () => {
//     // --- 1. CONFIGURATION & STATE ---
//     const API = {
//         admin: 'http://localhost:5000/api/admin',
//         content: 'http://localhost:5000/api/content'
//     };
//     const token = localStorage.getItem('token');
//     if (!token) {
//         window.location.href = '/login.html';
//         return;
//     }
//     let allDomainsData = [];
//     let allPathsData = [];

//     // --- 2. DOM ELEMENT SELECTORS ---
//     // Forms & Messages
//     const addDomainForm = document.getElementById('add-domain-form');
//     const domainFormMessage = document.getElementById('domain-form-message');
//     const addPathForm = document.getElementById('add-path-form');
//     const pathFormMessage = document.getElementById('path-form-message');
//     const addLessonForm = document.getElementById('add-lesson-form');
//     const lessonFormMessage = document.getElementById('lesson-form-message');

//     // Tables
//     const domainsTableBody = document.getElementById('domains-table-body');
//     const pathsTableBody = document.getElementById('paths-table-body');

//     // Modals & Modal Forms
//     const editDomainModal = document.getElementById('edit-domain-modal');
//     const editPathModal = document.getElementById('edit-path-modal');
//     const editDomainForm = document.getElementById('edit-domain-form');
//     const editPathForm = document.getElementById('edit-path-form');
    
//     // --- 3. MAIN DATA FETCH & RENDER ---
//     const fetchAndRenderAll = async () => {
//         try {
//             const [domainsRes, pathsRes] = await Promise.all([
//                 fetch(`${API.content}/domains`),
//                 fetch(`${API.content}/paths-all`)
//             ]);
//             if (!domainsRes.ok || !pathsRes.ok) throw new Error('Failed to load initial data.');
            
//             allDomainsData = await domainsRes.json();
//             allPathsData = await pathsRes.json();
            
//             renderDomainsTable(allDomainsData);
//             renderPathsTable(allPathsData);
//             populateAllDropdowns(allDomainsData, allPathsData);

//         } catch (error) {
//             console.error('Error on initial load:', error);
//             showToast('Could not load admin data.', 'error');
//         }
//     };

//     // --- 4. RENDER & POPULATE FUNCTIONS ---
//     function renderDomainsTable(domains) {
//         domainsTableBody.innerHTML = '';
//         domains.forEach(domain => {
//             const row = domainsTableBody.insertRow();
//             row.innerHTML = `
//                 <td>${domain.name}</td>
//                 <td>${domain.slug}</td>
//                 <td>
//                     <button class="action-btn edit-btn" data-id="${domain._id}" data-type="domain">Edit</button>
//                     <button class="action-btn delete-btn" data-id="${domain._id}" data-type="domain">Delete</button>
//                 </td>`;
//         });
//     }

//     function renderPathsTable(paths) {
//         pathsTableBody.innerHTML = '';
//         paths.forEach(path => {
//             const row = pathsTableBody.insertRow();
//             const domainName = path.domain ? path.domain.name : 'N/A';
//             row.innerHTML = `
//                 <td>${path.title}</td>
//                 <td>${domainName}</td>
//                 <td>
//                     <button class="action-btn edit-btn" data-id="${path._id}" data-type="path">Edit</button>
//                     <button class="action-btn delete-btn" data-id="${path._id}" data-type="path">Delete</button>
//                 </td>`;
//         });
//     }

//     function populateAllDropdowns(domains, paths) {
//         const domainDropdown = document.getElementById('parent-domain');
//         const editDomainDropdown = document.getElementById('edit-parent-domain');
//         const pathDropdown = document.getElementById('parent-path');

//         domainDropdown.innerHTML = '<option value="">-- Select a Domain --</option>';
//         editDomainDropdown.innerHTML = '<option value="">-- Select a Domain --</option>';
//         domains.forEach(d => {
//             const optionHtml = `<option value="${d._id}">${d.name}</option>`;
//             domainDropdown.innerHTML += optionHtml;
//             editDomainDropdown.innerHTML += optionHtml;
//         });

//         pathDropdown.innerHTML = '<option value="">-- Select a Path --</option>';
//         paths.forEach(p => {
//             pathDropdown.innerHTML += `<option value="${p._id}">${p.domain.name} - ${p.title}</option>`;
//         });
//     }

//     // --- 5. FORM SUBMIT HANDLERS (for creating new content) ---
//     addDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = { name: e.target.elements.name.value, slug: e.target.elements.slug.value, description: e.target.elements.description.value, imageUrl: e.target.elements.imageUrl.value };
//         try {
//             const res = await fetch(`${API.admin}/domains`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             showToast(`Domain "${data.name}" created.`, 'success');
//             addDomainForm.reset();
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     addPathForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = { title: e.target.elements['path-title'].value, description: e.target.elements['path-description'].value, domainId: e.target.elements['parent-domain'].value };
//         try {
//             const res = await fetch(`${API.admin}/paths`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             showToast(`Path "${data.title}" created.`, 'success');
//             addPathForm.reset();
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });
    
//     addLessonForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = { title: e.target.elements['lesson-title'].value, youtubeVideoId: e.target.elements['yt-video-id'].value, order: e.target.elements['lesson-order'].value, pathId: e.target.elements['parent-path'].value };
//         try {
//             const res = await fetch(`${API.admin}/lessons`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             showToast(`Lesson "${data.title}" created.`, 'success');
//             addLessonForm.reset();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     // --- 6. CLICK HANDLERS (for Edit and Delete buttons in tables) ---
//     document.querySelector('.admin-container').addEventListener('click', async (e) => {
//         const target = e.target;
//         const id = target.dataset.id;
//         const type = target.dataset.type; // This will be 'domain' or 'path'

//         if (!id || !type) return;

//         // --- DELETE LOGIC ---
//         if (target.classList.contains('delete-btn')) {
//             const resourceName = type === 'domain' ? 'domain and ALL its content' : 'path and ALL its lessons';
//             if (!confirm(`Are you sure you want to delete this ${resourceName}?`)) return;
//             try {
//                 const res = await fetch(`${API.admin}/${type}s/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
//                 if (!res.ok) throw new Error(`Failed to delete ${type}`);
//                 showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`, 'success');
//                 fetchAndRenderAll();
//             } catch (error) { showToast(error.message, 'error'); }
//         }

//         // --- EDIT LOGIC (opening the modal) ---
//         if (target.classList.contains('edit-btn')) {
//             if (type === 'domain') {
//                 const domainToEdit = allDomainsData.find(d => d._id === id);
//                 if (domainToEdit) {
//                     document.getElementById('edit-domain-id').value = domainToEdit._id;
//                     document.getElementById('edit-domain-name').value = domainToEdit.name;
//                     document.getElementById('edit-domain-slug').value = domainToEdit.slug;
//                     document.getElementById('edit-domain-description').value = domainToEdit.description;
//                     document.getElementById('edit-domain-imageUrl').value = domainToEdit.imageUrl;
//                     editDomainModal.style.display = 'block';
//                 }
//             } else if (type === 'path') {
//                 const pathToEdit = allPathsData.find(p => p._id === id);
//                 if (pathToEdit) {
//                     document.getElementById('edit-path-id').value = pathToEdit._id;
//                     document.getElementById('edit-path-title').value = pathToEdit.title;
//                     document.getElementById('edit-path-description').value = pathToEdit.description;
//                     document.getElementById('edit-parent-domain').value = pathToEdit.domain._id;
//                     editPathModal.style.display = 'block';
//                 }
//             }
//         }
//     });
    
//     // --- 7. MODAL HANDLERS ---
//     // Close Modals
//     document.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => {
//         editDomainModal.style.display = 'none';
//         editPathModal.style.display = 'none';
//     });
//     window.onclick = (event) => { // Also close if user clicks outside the modal
//         if (event.target == editDomainModal) editDomainModal.style.display = 'none';
//         if (event.target == editPathModal) editPathModal.style.display = 'none';
//     };

//     // Handle Edit Domain Form Submission
//     editDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const id = document.getElementById('edit-domain-id').value;
//         const updatedData = { name: document.getElementById('edit-domain-name').value, slug: document.getElementById('edit-domain-slug').value, description: document.getElementById('edit-domain-description').value, imageUrl: document.getElementById('edit-domain-imageUrl').value };
//         try {
//             const res = await fetch(`${API.admin}/domains/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(updatedData) });
//             if (!res.ok) throw new Error('Failed to update domain');
//             editDomainModal.style.display = 'none';
//             showToast('Domain updated successfully!', 'success');
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     // Handle Edit Path Form Submission
//     editPathForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const id = document.getElementById('edit-path-id').value;
//         const updatedData = { title: document.getElementById('edit-path-title').value, description: document.getElementById('edit-path-description').value, domainId: document.getElementById('edit-parent-domain').value };
//         try {
//             const res = await fetch(`${API.admin}/paths/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(updatedData) });
//             if (!res.ok) throw new Error('Failed to update path');
//             editPathModal.style.display = 'none';
//             showToast('Path updated successfully!', 'success');
//             fetchAndRenderAll();
//         } catch (error) { showToast(error.message, 'error'); }
//     });

//     // --- 8. INITIAL LOAD ---
//     fetchAndRenderAll();
// });


// document.addEventListener('DOMContentLoaded', () => {
//     const API = {
//         admin: 'http://localhost:5000/api/admin',
//         content: 'http://localhost:5000/api/content'
//     };
//     const token = localStorage.getItem('token');
//     if (!token) { window.location.href = '/login.html'; return; }

//     const addDomainForm = document.getElementById('add-domain-form');
//     const domainFormMessage = document.getElementById('domain-form-message');
//     const addPathForm = document.getElementById('add-path-form');
//     const pathFormMessage = document.getElementById('path-form-message');
//     const parentDomainSelect = document.getElementById('parent-domain');
//     const addLessonForm = document.getElementById('add-lesson-form');
//     const lessonFormMessage = document.getElementById('lesson-form-message');
//     const parentPathSelect = document.getElementById('parent-path');
//     const domainsTableBody = document.getElementById('domains-table-body');
//     const editModal = document.getElementById('edit-domain-modal');
//     const editForm = document.getElementById('edit-domain-form');
//     const closeModalBtn = document.querySelector('.close-btn');
//     const pathsTableBody = document.getElementById('paths-table-body');




//     let allDomainsData = []; 

//     let allPathsData = []; // Cache paths
//     const fetchAndRenderContent = async () => {
//         // ... (this function is mostly the same) ...
//         // Add this line inside the try block:
//         allPathsData = await pathsRes.clone().json();
//         renderPathsTable(allPathsData);
//     };
//     const fetchAndRenderContent = async () => {
//         try {
//             const [domainsRes, pathsRes] = await Promise.all([
//                 fetch(`${API.content}/domains`),
//                 fetch(`${API.content}/paths-all`)
//             ]);
//             // ... (keep the dropdown population logic) ...
//             const populateDropdowns = async () => {
//         try {
//             const [domainsRes, pathsRes] = await Promise.all([
//                 fetch(`${API.content}/domains`),
//                 fetch(`${API.content}/paths-all`)
//             ]);
//             const domains = await domainsRes.json();
//             const paths = await pathsRes.json();

//             // Populate Domains Dropdown
//             parentDomainSelect.innerHTML = '<option value="">-- Select a Domain --</option>';
//             domains.forEach(d => parentDomainSelect.innerHTML += `<option value="${d._id}">${d.name}</option>`);

//             // Populate Paths Dropdown
//             parentPathSelect.innerHTML = '<option value="">-- Select a Path --</option>';
//             paths.forEach(p => parentPathSelect.innerHTML += `<option value="${p._id}">${p.domain.name} - ${p.title}</option>`);

//         } catch (error) {
//             console.error('Failed to load data for forms', error);
//         }
//     };

//             // --- Render the Domains Table ---
//             allDomainsData = await domainsRes.clone().json(); // Clone response to use it twice
//             renderDomainsTable(allDomainsData);

//         } catch (error) { /* ... */ }
//     };
    
//     function renderDomainsTable(domains) {
//         domainsTableBody.innerHTML = '';
//         domains.forEach(domain => {
//             const row = domainsTableBody.insertRow();
//             row.innerHTML = `
//                 <td>${domain.name}</td>
//                 <td>${domain.slug}</td>
//                 <td>
//                     <button class="action-btn edit-btn" data-id="${domain._id}">Edit</button>
//                     <button class="action-btn delete-btn" data-id="${domain._id}">Delete</button>
//                 </td>
//             `;
//         });
//     }

    // const populateDropdowns = async () => {
    //     try {
    //         const [domainsRes, pathsRes] = await Promise.all([
    //             fetch(`${API.content}/domains`),
    //             fetch(`${API.content}/paths-all`)
    //         ]);
    //         const domains = await domainsRes.json();
    //         const paths = await pathsRes.json();

    //         // Populate Domains Dropdown
    //         parentDomainSelect.innerHTML = '<option value="">-- Select a Domain --</option>';
    //         domains.forEach(d => parentDomainSelect.innerHTML += `<option value="${d._id}">${d.name}</option>`);

    //         // Populate Paths Dropdown
    //         parentPathSelect.innerHTML = '<option value="">-- Select a Path --</option>';
    //         paths.forEach(p => parentPathSelect.innerHTML += `<option value="${p._id}">${p.domain.name} - ${p.title}</option>`);

    //     } catch (error) {
    //         console.error('Failed to load data for forms', error);
    //     }
    // };
    
    // --- Form Submit Handlers ---
//     addDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = {
//             name: e.target.elements.name.value,
//             slug: e.target.elements.slug.value,
//             description: e.target.elements.description.value,
//             imageUrl: e.target.elements.imageUrl.value,
//         };
//         try {
//             const res = await fetch(`${API.admin}/domains`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             domainFormMessage.textContent = `Success! Domain "${data.name}" created.`;
//             domainFormMessage.style.color = 'green';
//             addDomainForm.reset();
//             populateDropdowns(); // Refresh dropdowns
//         } catch (error) {
//             domainFormMessage.textContent = error.message;
//             domainFormMessage.style.color = 'red';
//         }
//     });

//     addPathForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = {
//             title: e.target.elements['path-title'].value,
//             description: e.target.elements['path-description'].value,
//             domainId: e.target.elements['parent-domain'].value,
//         };
//         try {
//             const res = await fetch(`${API.admin}/paths`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             pathFormMessage.textContent = `Success! Path "${data.title}" created.`;
//             pathFormMessage.style.color = 'green';
//             addPathForm.reset();
//             populateDropdowns(); // Refresh dropdowns
//         } catch (error) {
//             pathFormMessage.textContent = error.message;
//             pathFormMessage.style.color = 'red';
//         }
//     });
    
//     addLessonForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = {
//             title: e.target.elements['lesson-title'].value,
//             youtubeVideoId: e.target.elements['yt-video-id'].value,
//             order: e.target.elements['lesson-order'].value,
//             pathId: e.target.elements['parent-path'].value,
//         };
//         try {
//             const res = await fetch(`${API.admin}/lessons`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(formData) });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message);
//             lessonFormMessage.textContent = `Success! Lesson "${data.title}" created.`;
//             lessonFormMessage.style.color = 'green';
//             addLessonForm.reset();
//         } catch (error) {
//             lessonFormMessage.textContent = error.message;
//             lessonFormMessage.style.color = 'red';
//         }
//     });


//     // --- Event Listener for Table Actions (Edit/Delete) ---
//     domainsTableBody.addEventListener('click', async (e) => {
//         const domainId = e.target.dataset.id;

//         // Handle Delete
//         if (e.target.classList.contains('delete-btn')) {
//             if (!confirm('Are you sure you want to delete this domain and ALL its content?')) return;

//             try {
//                 const res = await fetch(`${API.admin}/domains/${domainId}`, {
//                     method: 'DELETE',
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });
//                 if (!res.ok) throw new Error('Failed to delete domain');
//                 showToast('Domain deleted successfully.', 'success');
//                 fetchAndRenderContent(); // Refresh all content
//             } catch (error) {
//                 showToast(error.message, 'error');
//             }
//         }
        
//         // Handle Edit
//         if (e.target.classList.contains('edit-btn')) {
//             const domainToEdit = allDomainsData.find(d => d._id === domainId);
//             if (domainToEdit) {
//                 // Populate and show the modal
//                 document.getElementById('edit-domain-id').value = domainToEdit._id;
//                 document.getElementById('edit-domain-name').value = domainToEdit.name;
//                 document.getElementById('edit-domain-slug').value = domainToEdit.slug;
//                 document.getElementById('edit-domain-description').value = domainToEdit.description;
//                 document.getElementById('edit-domain-imageUrl').value = domainToEdit.imageUrl;
//                 editModal.style.display = 'block';
//             }
//         }
//     });

//     // --- Event Listeners for Modal ---
//     closeModalBtn.addEventListener('click', () => editModal.style.display = 'none');
//     editForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const domainId = document.getElementById('edit-domain-id').value;
//         const updatedData = {
//             name: document.getElementById('edit-domain-name').value,
//             slug: document.getElementById('edit-domain-slug').value,
//             description: document.getElementById('edit-domain-description').value,
//             imageUrl: document.getElementById('edit-domain-imageUrl').value,
//         };

//         try {
//             const res = await fetch(`${API.admin}/domains/${domainId}`, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify(updatedData)
//             });
//             if (!res.ok) throw new Error('Failed to update domain');
//             editModal.style.display = 'none';
//             showToast('Domain updated successfully!', 'success');
//             fetchAndRenderContent(); // Refresh all content
//         } catch (error) {
//             showToast(error.message, 'error');
//         }
//     });

//     // --- Initial Load ---
//     // populateDropdowns();
//     fetchAndRenderContent();
// });
// document.addEventListener('DOMContentLoaded', () => {
//     const API_BASE_URL = 'http://localhost:5000/api/admin';
//     const token = localStorage.getItem('token');
    
//     const addDomainForm = document.getElementById('add-domain-form');
//     const messageEl = document.querySelector('.form-message');

//     if (!token) {
//         // Simple redirect if not logged in at all
//         window.location.href = 'login.html';
//         return;
//     }

//     addDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
        
//         const domainData = {
//             name: document.getElementById('name').value,
//             slug: document.getElementById('slug').value,
//             description: document.getElementById('description').value,
//             imageUrl: document.getElementById('imageUrl').value,
//         };

//         try {
//             const res = await fetch(`${API_BASE_URL}/domains`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify(domainData)
//             });
            
//             const data = await res.json();

//             if (!res.ok) {
//                 // The 'message' will come from our backend's error response
//                 throw new Error(data.message || 'Failed to create domain');
//             }
            
//             messageEl.textContent = `Success! Domain "${data.name}" created.`;
//             messageEl.style.color = 'green';
//             addDomainForm.reset(); // Clear the form

//         } catch (error) {
//             messageEl.textContent = error.message;
//             messageEl.style.color = 'red';
//         }
//     });
// });


// document.addEventListener('DOMContentLoaded', () => {
//     // Changed to an object for better organization
//     const API = {
//         admin: 'http://localhost:5000/api/admin',
//         content: 'http://localhost:5000/api/content' // For fetching public domains
//     };
//     const token = localStorage.getItem('token');
    
    
//     // --- Element Selectors ---
//     const addDomainForm = document.getElementById('add-domain-form');
//     const domainFormMessage = document.getElementById('domain-form-message');
//     const addPathForm = document.getElementById('add-path-form');
//     const pathFormMessage = document.getElementById('path-form-message');
//     const parentDomainSelect = document.getElementById('parent-domain');
//     const addLessonForm = document.getElementById('add-lesson-form');
//     const lessonFormMessage = document.getElementById('lesson-form-message');
//     const parentPathSelect = document.getElementById('parent-path');

//     if (!token) {
//         window.location.href = '/login.html';
//         return;
//     }

//     // --- Function to populate the domains dropdown ---
//     const populateDomainsDropdown = async () => {
//         try {
//             const res = await fetch(`${API.content}/domains`);
//             if (!res.ok) throw new Error('Could not fetch domains');
//             const domains = await res.json();
            
//             parentDomainSelect.innerHTML = '<option value="">-- Select a Domain --</option>'; // Reset
//             domains.forEach(domain => {
//                 const option = document.createElement('option');
//                 option.value = domain._id; // The value will be the domain's ID
//                 option.textContent = domain.name;
//                 parentDomainSelect.appendChild(option);
//             });
//         } catch (error) {
//             parentDomainSelect.innerHTML = `<option value="">Error loading domains</option>`;
//             console.error(error);
//         }
//     };

//     // --- Event Listener for Domain Form ---
//     addDomainForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         // ... (your existing domain form logic is here)
//         // Make sure to use 'domainFormMessage' instead of the generic 'messageEl'
//         try {
//             // ...
//             domainFormMessage.textContent = `Success! Domain "${data.name}" created.`;
//             addDomainForm.reset();
//             populateDomainsDropdown(); // Refresh dropdown after adding a new domain
//         } catch(error) {
//             domainFormMessage.textContent = error.message;
//         }
//     });

//     // --- Event Listener for Path Form ---
//     addPathForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         pathFormMessage.textContent = ''; // Clear previous messages

//         const pathData = {
//             title: document.getElementById('path-title').value,
//             description: document.getElementById('path-description').value,
//             domainId: parentDomainSelect.value,
//         };

//         if (!pathData.domainId) {
//             pathFormMessage.textContent = 'Please select a parent domain.';
//             return;
//         }

//         try {
//             const res = await fetch(`${API.admin}/paths`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify(pathData)
//             });

//             const data = await res.json();
//             if (!res.ok) throw new Error(data.message || 'Failed to create path');
            
//             pathFormMessage.textContent = `Success! Path "${data.title}" created.`;
//             pathFormMessage.style.color = 'green';
//             addPathForm.reset();

//         } catch (error) {
//             pathFormMessage.textContent = error.message;
//             pathFormMessage.style.color = 'red';
//         }
//     });

//     // --- Initial setup when page loads ---
//     populateDomainsDropdown();
// });