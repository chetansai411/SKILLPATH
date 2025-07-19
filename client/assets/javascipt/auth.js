document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const messageContainer = document.getElementById('message-container');

    const API_URL = 'http://localhost:5000'; // Your backend server URL

    // Function to display messages
    const showMessage = (message, type = 'error') => {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`;
    };

    // --- SIGNUP LOGIC ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = signupForm.username.value;
            const email = signupForm.email.value;
            const password = signupForm.password.value;

            try {
                const response = await fetch(`${API_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // If response is not 2xx, throw an error to be caught by the catch block
                    throw new Error(data.message || 'Something went wrong');
                }

                // --- SUCCESS ---
                // Save the token to localStorage
                localStorage.setItem('token', data.token);
                // Redirect to profile page or dashboard
                window.location.href = 'profile.html'; // Or maybe a 'welcome' page

            } catch (error) {
                showMessage(error.message);
            }
        });
    }

    // --- LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Invalid credentials');
                }

                // --- SUCCESS ---
                localStorage.setItem('token', data.token);
                window.location.href = 'profile.html';

            } catch (error) {
                showMessage(error.message);
            }
        });
    }
});