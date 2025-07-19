document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const domainNameEl = document.getElementById('domain-name');
    const domainDescriptionEl = document.getElementById('domain-description');
    const pathListEl = document.getElementById('path-list');

    const getDomainSlugFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('slug'); 
    };

    const fetchPaths = async (slug) => {
        if (!slug) {
            pathListEl.innerHTML = '<p>No domain specified. Please select one from the <a href="index.html">homepage</a>.</p>';
            return;
        }

        

        try {
            const response = await fetch(`${API_BASE_URL}/content/paths/${slug}`);
            if (!response.ok) {
                throw new Error('Domain not found or server error.');
            }
            const data = await response.json();
            renderPage(data.domain, data.paths);
        } catch (error) {
            console.error('Failed to fetch paths:', error);
            pathListEl.innerHTML = '<p>Could not load learning paths for this domain.</p>';
        }
    };

    const renderPage = (domain, paths) => {
        
        document.title = `${domain.name} - Skillpath`;
        domainNameEl.textContent = domain.name;
        domainDescriptionEl.textContent = domain.description;

        
        pathListEl.innerHTML = ''; 

        if (paths.length === 0) {
            pathListEl.innerHTML = '<p>No learning paths are available for this domain yet.</p>';
            return;
        }

        paths.forEach(path => {
            const pathLink = document.createElement('a');
            pathLink.className = 'path-item';
          
            pathLink.href = `path.html?id=${path._id}`;

            pathLink.innerHTML = `
                <div class="path-item-info">
                    <h3>${path.title}</h3>
                    <p>${path.description}</p>
                </div>
                <div class="path-item-action">
                    <span class="button-primary">View Path</span>
                </div>
            `;
            pathListEl.appendChild(pathLink);
        });
    };

    const mainNav = document.getElementById('main-nav');
    const token = localStorage.getItem('token');
    if (token) {
        mainNav.innerHTML = `<a href="profile.html">My Profile</a><a href="#" id="logout-btn">Logout</a>`;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    } else {
        mainNav.innerHTML = `<a href="login.html">Login</a><a href="signup.html">Sign Up</a>`;
    }

    
    const domainSlug = getDomainSlugFromURL();
    fetchPaths(domainSlug);
});