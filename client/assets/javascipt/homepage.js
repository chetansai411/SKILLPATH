document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const domainGrid = document.getElementById('domain-grid');

    const fetchDomains = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/content/domains`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const domains = await response.json();
            renderDomains(domains);
        } catch (error) {
            console.error('Failed to fetch domains:', error);
            domainGrid.innerHTML = '<p>Could not load learning domains. Please try again later.</p>';
        }
    };

    const renderDomains = (domains) => {
        domainGrid.innerHTML = ''; 

        if (domains.length === 0) {
            domainGrid.innerHTML = '<p>No learning domains are available yet.</p>';
            return;
        }

        domains.forEach(domain => {
            const card = document.createElement('a');
            card.className = 'domain-card';
        
            card.href = `domain.html?slug=${domain.slug}`; 

            card.innerHTML = `
                <img src="${domain.imageUrl}" alt="${domain.name}" class="domain-icon">
                <div class="domain-card-content">
                    <h3>${domain.name}</h3>
                    <p>${domain.description}</p>
                </div>
            `;
            domainGrid.appendChild(card);
        });
    };

    const mainNav = document.getElementById('main-nav');
    const token = localStorage.getItem('token');
    
    if (token) {
        
        mainNav.innerHTML = `
            <a href="profile.html">My Profile</a>
            <a href="#" id="logout-btn">Logout</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    } else {
        
        mainNav.innerHTML = `
            <a href="login.html">Login</a>
            <a href="signup.html">Sign Up</a>
        `;
    }

   
    fetchDomains();
});