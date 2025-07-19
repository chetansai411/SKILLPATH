function showToast(message, type = 'info', duration = 3000) {
    // Check if the container exists, if not, create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // e.g., 'toast success'
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Small delay to allow for CSS transition

    // Animate out and remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove the element from the DOM after the transition ends
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}

// At the top of your DOMContentLoaded event listener...
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const htmlElement = document.documentElement; // Get the <html> element

    // ... (keep the theme toggle code) ...
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
            themeToggleButton.textContent = '☀️'; // Sun icon
        } else {
            htmlElement.removeAttribute('data-theme');
            themeToggleButton.textContent = '🌙'; // Moon icon
        }
    };

    // Check localStorage for a saved theme when the page loads
    const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
    applyTheme(savedTheme);

    // Add the click event listener for the button
    themeToggleButton.addEventListener('click', () => {
        // Check the current theme by looking at the attribute
        const currentTheme = htmlElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            // If it's dark, switch to light
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        } else {
            // If it's light, switch to dark
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // --- NEW: DYNAMIC NAVIGATION LOGIC ---
    const mainNav = document.getElementById('main-nav');
    const token = localStorage.getItem('token');
    if (token) {
        // User is logged in
        mainNav.innerHTML = `
            <a href="/profile.html">My Profile</a>
            <button id="logout-btn">Logout</button>
        `;
        
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });

    } else {
        // User is logged out
        mainNav.innerHTML = `
            <a href="login.html">Login</a>
            <a href="signup.html">Sign Up</a>
        `;
    }


    
    // ... (the rest of your theme toggle code remains exactly the same)
});