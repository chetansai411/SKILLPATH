// This script will be loaded by lesson.html
// It assumes the YouTube Iframe API script is already loaded from the HTML.
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const loggedInUser = token ? parseJwt(token) : null;
    // --- DOM Elements ---
    const lessonTitleEl = document.getElementById('lesson-title');
    const lessonDescriptionEl = document.getElementById('lesson-description');
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    const notesListEl = document.getElementById('notes-list');
    const completeLessonBtn = document.getElementById('complete-lesson-btn');
    const qnaForm = document.getElementById('qna-form');
    const qnaInput = document.getElementById('qna-input');
    const qnaListEl = document.getElementById('qna-list');

    let player; 
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('id');


    // Redirect to login if no token is found
    if (!token) {
        window.location.href = 'login.html';
        return;

    }
    // Handle case where no lesson ID is in the URL

    if (!lessonId) {
        lessonTitleEl.textContent = "Error: No lesson specified.";
        lessonDescriptionEl.textContent = "Please select a lesson from a learning path.";
        // Optionally hide the player, notes, and Q&A panels here
        return;
    }
    function parseJwt(token) {

        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    console.log('Logged In User Payload:', loggedInUser); 
    
    async function initializePage() {
        console.log("--- [1] Page Initializing ---");

        // --- NEW: Fetch lesson details first ---
        try {

            const res = await fetch(`${API_BASE_URL}/content/lesson/${lessonId}`);

            if (!res.ok) {

                // If the lesson isn't in our database, it's not part of a path.
                // We can still show the video but with a generic title.
                lessonTitleEl.textContent = "Untitled Lesson";
                lessonDescriptionEl.textContent = "This video is not part of a formal Skillpath lesson.";

            } else {

                const lessonData = await res.json();
                lessonTitleEl.textContent = lessonData.title;
                // A future improvement could be to add a description field to our Lesson model.
                // For now, we'll leave the description blank or add a placeholder.
                lessonDescriptionEl.textContent = lessonData.description || "Watch this lesson to learn more!";

            }

        } catch (error) {
        console.error("Error fetching lesson details:", error);
        lessonTitleEl.textContent = "Error Loading Lesson";
        }

        console.log("--- [2] Calling fetchNotes() and fetchQnA() ---");
        // --- The rest of the initialization continues as before ---
        fetchNotes();
        fetchQnA();
    }

    // --- YouTube Player Functions ---
    // This function is called by the YouTube Iframe API script when it's ready.
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player('youtube-player', {
            height: '390',
            width: '640',
            // videoId: currentLesson.id,
             videoId: lessonId,
            playerVars: {
                'playsinline': 1
            },
        });
    }

    // --- Notes Functions ---
    async function fetchNotes() {
        console.log("1. Starting fetchNotes() for lesson:", lessonId);
        notesListEl.innerHTML = '<li>Loading notes...</li>';
        try {
            const res = await fetch(`${API_BASE_URL}/activity/notes/${lessonId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("--- [4] API Response Status:", res.status);
            if (!res.ok) throw new Error('Could not fetch notes.');
            const notes = await res.json();
            console.log("2. Successfully fetched notes from API:", notes);
            renderNotes(notes);
        } catch (error) {
            console.error(error);
            notesListEl.innerHTML = '<li>Could not load notes.</li>';
        }
    }

    function renderNotes(notes) {
        console.log("3. Starting renderNotes() with this data:", notes);
        notesListEl.innerHTML = ''; // Clear existing notes
        if (notes.length === 0) {
            notesListEl.innerHTML = '<li>No notes yet. Add one!</li>';
            return;
        }
        console.log(`--- [7b] Found ${notes.length} notes. Starting render loop.`);
        notes.forEach((note,index) => {
            console.log(`   - Rendering note #${index + 1}:`, note.text);
            const li = document.createElement('li');
            li.className = 'note-item';
            li.dataset.timestamp = note.timestamp; // Store timestamp on the element
            // li.innerHTML = `
            //     <span class="note-timestamp">${formatTimestamp(note.timestamp)}</span>
            //     <span class="note-text">${note.text}</span>
            // `;
            

            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'note-timestamp';
            timestampSpan.textContent = formatTimestamp(note.timestamp);

            const textSpan = document.createElement('span');
            textSpan.className = 'note-text';
            textSpan.textContent = note.text;

            li.appendChild(timestampSpan);
            li.appendChild(textSpan);
            notesListEl.appendChild(li);
        });
        console.log("4. Finished rendering notes to the DOM.");
    }
    async function handleAddNote(e) {
        e.preventDefault();
        const noteText = noteInput.value.trim();
        if (!noteText || !player) return;

        const currentTime = Math.floor(player.getCurrentTime());
        noteInput.value = ''; // Clear input immediately for a better feel

        // --- Optimistic UI Part 1: Create the new note element ---
        // We create the HTML element for the note before we even send the API call.
        const tempNoteElement = document.createElement('li');
        tempNoteElement.className = 'note-item optimistic'; // Add a temp class
        tempNoteElement.innerHTML = `
            <span class="note-timestamp">${formatTimestamp(currentTime)}</span>
            <span class="note-text">${noteText}</span>
        `;
        const noNotesMessage = notesListEl.querySelector('li');
        if (noNotesMessage && noNotesMessage.textContent.includes('No notes yet')) {
            notesListEl.innerHTML = '';
        }
    
        
    
        notesListEl.appendChild(tempNoteElement); // Add it to the list immediately

        try {
            const noteData = {
                lessonId: lessonId,
                text: noteText,
                timestamp: currentTime
            };

            const res = await fetch(`${API_BASE_URL}/activity/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(noteData)
            });

            if (!res.ok) {
                // If the save fails, throw an error
                throw new Error('Failed to save note to the server.');
            }
        
            // If save is successful, the UI is already correct. Show a success toast.
            showToast('Note added successfully!', 'success');
        
            // We can now do a "silent" refresh in the background to get the real _id and other data,
            // but for simplicity, the optimistic update is enough. Or just call fetchNotes() again.
            fetchNotes(); // This will replace the optimistic note with the real one from the DB.

        } catch (error) {
            // --- Optimistic UI Part 2: Handle Failure ---
            // If the save failed, remove the temporary note and show an error.
            showToast('Could not save your note.', 'error');
            tempNoteElement.remove(); // Remove the optimistic note we added
            console.error("Error in handleAddNote:", error);
        }
    }


    // --- Q&A Functions --- (vv ADD THIS ENTIRE NEW SECTION vv)
    async function fetchQnA() {
        qnaListEl.innerHTML = '<p>Loading questions...</p>';
        try {
            // This is a public route, so no token is needed in the header
            const res = await fetch(`${API_BASE_URL}/activity/qna/${lessonId}`);
            if (!res.ok) throw new Error('Could not fetch Q&A.');
            const qnaItems = await res.json();
            renderQnA(qnaItems);
        } catch (error) {
            console.error(error);
            qnaListEl.innerHTML = '<p>Could not load questions.</p>';
        }
    }

    function renderQnA(items) {
        qnaListEl.innerHTML = ''; // Clear existing items
        if (items.length === 0) {
            qnaListEl.innerHTML = '<p>Be the first to ask a question!</p>';
            return;
        }

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'qna-item';
            itemDiv.id = `qna-item-${item._id}`;
            // Because our backend pre-populates the user data, we can access it directly!
            const author = item.userId; 

            // let deleteButtonHtml = '';
            // console.log(`Comparing Author ID: ${author?._id} with User ID: ${loggedInUser?.user?.id}`);
            // // Check if user is logged in AND if the author's ID matches the logged-in user's ID
            // if (loggedInUser && author && author._id === loggedInUser.user.id) {
            //     deleteButtonHtml = `<button class="delete-btn" data-qna-id="${item._id}">Delete</button>`;
            // }
            let actionButtonsHtml = '';
            if (loggedInUser && author && author._id === loggedInUser.user.id) {
                actionButtonsHtml = `
                    <button class="edit-btn" data-qna-id="${item._id}">Edit</button>
                    <button class="delete-btn" data-qna-id="${item._id}">Delete</button>
                `;
            }

            itemDiv.innerHTML = `
                <img src="${author.profile.avatarUrl || '/assets/images/default-avatar.png'}" alt="${author.username}" class="qna-avatar">
                <div class="qna-content">
                    <span class="qna-author">${author.username}</span>
                    <p class="qna-text" data-text-id="${item._id}">${item.content}</p>
                    <div class="qna-meta">
                        <span>Posted on: ${new Date(item.createdAt).toLocaleDateString()}</span>
                        <!-- We can add reply/upvote buttons here later -->
                    </div>
                    <div class="qna-actions">
                        <button class="reply-btn" data-question-id="${item._id}">Reply</button>
                        ${actionButtonsHtml}
                     </div>
                    <form class="reply-form" data-form-id="${item._id}">
                        <textarea placeholder="Write a reply..." required></textarea>
                        <button type="submit" class="button-primary">Post Reply</button>
                    </form>
                 <div class="replies-container" id="replies-for-${item._id}"></div>
                </div>
            `;
            qnaListEl.appendChild(itemDiv);
        });
    }


    // We need to use Event Delegation for the new reply buttons
    qnaListEl.addEventListener('click', async (e) => {
    // Handle clicking the "Reply" button
    if (e.target.classList.contains('reply-btn')) {
        const questionId = e.target.dataset.questionId;
        const replyForm = document.querySelector(`.reply-form[data-form-id="${questionId}"]`);
        
        // Toggle the visibility of the reply form
        replyForm.classList.toggle('visible');

        // Fetch and show replies if they haven't been loaded yet
        if (replyForm.classList.contains('visible')) {
            fetchAndRenderReplies(questionId);
        }
    }
    // Handle clicking the "Delete" button
    if(e.target.classList.contains('delete-btn')){
        const qnaId = e.target.dataset.qnaId;
        //optional:confirm with the user 
        if(!confirm('Are you sure you want to delete this post?')){
            return;
        }
        try {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                alert('You are not logged in!');
                return;
            }
            const res = await fetch(`${API_BASE_URL}/activity/qna/${qnaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            if (!res.ok) throw new Error('Failed to delete item.');
            document.getElementById(`qna-item-${qnaId}`).remove();
            showToast('Post deleted.', 'info');

        } catch (error) {
            console.error(error);
            // alert('Could not delete the post');
            showToast('Could not delete the post.', 'error');
            
        }
        
    }
    if (e.target.classList.contains('edit-btn')) {
        const qnaId = e.target.dataset.qnaId;
        const textElement = document.querySelector(`.qna-text[data-text-id="${qnaId}"]`);
        const currentContent = textElement.textContent;

        // Replace the <p> tag with a form
        textElement.outerHTML = `
            <form class="qna-edit-form" data-edit-form-id="${qnaId}">
                <textarea>${currentContent}</textarea>
                <div class="edit-actions">
                    <button type="submit" class="button-primary">Save</button>
                    <button type="button" class="cancel-edit-btn">Cancel</button>
                </div>
            </form>
        `;
    }

    if (e.target.classList.contains('cancel-edit-btn')) {
        const form = e.target.closest('.qna-edit-form');
        const qnaId = form.dataset.editFormId;
        const originalContent = /* We need a way to get the original content back */
        // This is tricky. A simple approach is to just re-fetch everything.
        fetchQnA(); // Simple solution: just refresh the whole Q&A list to cancel.
    }


    
});

// Add a listener for submitting reply forms
qnaListEl.addEventListener('submit', async (e) => {
    if (e.target.classList.contains('reply-form')) {
        e.preventDefault();
        const form = e.target;
        const questionId = form.dataset.formId;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) return;

        // Call the same POST /api/activity/qna endpoint, but now with a parentId
        try {
            const res = await fetch(`${API_BASE_URL}/activity/qna`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lessonId: lessonId,
                    content: content,
                    parentId: questionId // This is the key part for making it a reply
                })
            });
            if (!res.ok) throw new Error('Failed to post reply.');
            
            textarea.value = ''; // Clear textarea
            form.classList.remove('visible'); // Hide form
            fetchAndRenderReplies(questionId); // Refresh the replies for this question

        } catch (error) {
            console.error(error);
            // alert('Could not post your reply.');
            showToast('Could not post your reply.', 'error');
        }
    }

    if (e.target.classList.contains('qna-edit-form')) {
        e.preventDefault();
        const form = e.target;
        const qnaId = form.dataset.editFormId;
        const newContent = form.querySelector('textarea').value.trim();

        if (!newContent) return;

        try {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                // alert('You are not logged in!');
                showToast('You are not logged in.', 'error');
                return;
            }
            const res = await fetch(`${API_BASE_URL}/activity/qna/${qnaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ content: newContent })
            });

            if (!res.ok) throw new Error('Failed to update post.');
            
            const updatedItem = await res.json();

            // Replace the form with the updated text
            form.outerHTML = `<p class="qna-text" data-text-id="${updatedItem._id}">${updatedItem.content}</p>`;
            
            showToast('Post updated successfully!', 'success');

        } catch (error) {
            console.error(error);
            // alert('Could not update the post.');
            showToast('Could not update the post.', 'error');
            
            fetchQnA(); // Refresh the list on error to revert changes
        }
    }
});

// NEW Function to fetch and render replies for a specific question
async function fetchAndRenderReplies(questionId) {
    const repliesContainer = document.getElementById(`replies-for-${questionId}`);
    repliesContainer.innerHTML = '<p>Loading replies...</p>';

    try {
        const res = await fetch(`${API_BASE_URL}/activity/qna/replies/${questionId}`);
        if (!res.ok) throw new Error('Could not fetch replies.');
        const replies = await res.json();
        
        repliesContainer.innerHTML = ''; // Clear loading message
        replies.forEach(reply => {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'qna-item'; // We can reuse the same style
            const author = reply.userId;
            replyDiv.innerHTML = `
                <img src="${author.profile.avatarUrl || '/assets/images/default-avatar.png'}" alt="${author.username}" class="qna-avatar">
                <div class="qna-content">
                    <span class="qna-author">${author.username}</span>
                    <p class="qna-text">${reply.content}</p>
                    <div class="qna-meta">
                        <span>Replied on: ${new Date(reply.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
            repliesContainer.appendChild(replyDiv);
        });

    } catch (error) {
        console.error(error);
        repliesContainer.innerHTML = '<p>Could not load replies.</p>';
    }
}

    
    async function handlePostQuestion(e) {
        e.preventDefault();
        const content = qnaInput.value.trim();
        if (!content) return;

        try {
            const res = await fetch(`${API_BASE_URL}/activity/qna`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Posting requires auth
                },
                body: JSON.stringify({
                    // lessonId: currentLesson.id,
                    lessonId: lessonId,
                    content: content
                })
            });

            if (!res.ok) throw new Error('Failed to post question.');
            
            qnaInput.value = ''; // Clear the input
            fetchQnA(); // Re-fetch all questions to show the new one at the top

        } catch (error) {
            console.error(error);
            // alert('Could not post your question.');
            showToast('Could not post your question.', 'error');
            qnaInput.value = '';
            fetchQnA();
            showToast('Question posted successfully!', 'success');
        }
    }

    // --- Event Listeners ---
    noteForm.addEventListener('submit', handleAddNote);

    // Event delegation for clicking on a note
    notesListEl.addEventListener('click', (e) => {
        const noteItem = e.target.closest('.note-item');
        if (noteItem && player) {
            const timestamp = noteItem.dataset.timestamp;
            player.seekTo(timestamp, true); // Seek to the timestamp and play
        }
    });

    // "Mark as Complete" button listener
    completeLessonBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/activity/complete-lesson`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lessonId: lessonId }) 
            });
            if (!res.ok) throw new Error('Could not update progress.');
            
            completeLessonBtn.textContent = 'Progress Saved!';
            showToast('Progress saved!', 'success');
            completeLessonBtn.disabled = true;
            setTimeout(() => {
                completeLessonBtn.textContent = 'Mark as Complete';
                completeLessonBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error(error);
            // alert('There was an error saving your progress.');
            showToast('There was an error saving your progress.', 'error');
            
        }
        
    });

    qnaForm.addEventListener('submit', handlePostQuestion);


    // --- Helper Functions ---
    function formatTimestamp(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    

    

    // --- Run Initialization ---
    initializePage();
});