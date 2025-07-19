document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    const pathTitleEl = document.getElementById('path-title');
    const pathDescriptionEl = document.getElementById('path-description');
    const lessonListEl = document.getElementById('lesson-list');

    // Helper function to get the 'id' from the URL query string
    const getPathIdFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    };

    const fetchAndRenderLessons = async () => {
        const pathId = getPathIdFromUrl();
        if (!pathId) {
            pathTitleEl.textContent = 'Error: No Learning Path Specified.';
            // lessonListEl.innerHTML = '<li>Please return to the domain page and select a path.</li>';
            return;
        }

         // --- LOADING STATE ---
        // Set initial loading messages before the API call
        pathTitleEl.textContent = 'Loading Path...';
        lessonListEl.innerHTML = '<li>Loading lessons...</li>';

        try {
             // --- We now need to make TWO API calls in parallel ---
            const lessonsPromise = fetch(`${API_BASE_URL}/content/lessons/${pathId}`);
            
            // Only fetch completed lessons if the user is logged in
            const completedPromise = token 
                ? fetch(`${API_BASE_URL}/profiles/me/completed-lessons`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                : Promise.resolve({ ok: true, json: () => Promise.resolve([]) }); // Return empty array if not logged in

            // Wait for both promises to resolve
            const [lessonsRes, completedRes] = await Promise.all([lessonsPromise, completedPromise]);

            if (!lessonsRes.ok) throw new Error('Could not fetch lessons.');
            if (!completedRes.ok) throw new Error('Could not fetch user progress.');

            const lessonsData = await lessonsRes.json();
            const completedLessonIds = await completedRes.json();

            // --- SUCCESS STATE ---
            pathTitleEl.textContent = lessonsData.path.title;
            pathDescriptionEl.textContent = lessonsData.path.description;
            
            // Pass the completed IDs to the render function
            renderLessons(lessonsData.lessons, completedLessonIds);
            

        } catch (error) {
            console.error('Error fetching path data:', error);
            pathTitleEl.textContent = 'Error';
            lessonListEl.innerHTML = `<li>Could not load lessons. Please try again later.</li>`;
        }
    };

     const renderLessons = (lessons, completedLessonIds = []) => {
        lessonListEl.innerHTML = ''; 
        if (lessons.length === 0) {
            lessonListEl.innerHTML = '<li>No lessons have been added to this path yet.</li>'; 

            
            return;
        }

        lessons.forEach(lesson => {
            const listItem = document.createElement('li');
            listItem.className = 'lesson-list-item';

            const link = document.createElement('a');
            link.className = 'lesson-link';
            // Use the YouTube video ID for the link, as this is our lesson identifier
            link.href = `lesson.html?id=${lesson.youtubeVideoId}`;

            // --- CHECK IF LESSON IS COMPLETED ---
            if (completedLessonIds.includes(lesson.youtubeVideoId)) {
                link.classList.add('completed');
            }
            
            // The rest of the rendering logic is the same
            link.innerHTML = `
                <div class="lesson-info">
                    <h4>${lesson.title}</h4>
                </div>
            `;

            listItem.appendChild(link);
            lessonListEl.appendChild(listItem);
        });
    };

     

    // Run the function when the page loads
    fetchAndRenderLessons();
});