document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    // Get username from URL, e.g., "profile.html?user=johndoe"
    // For now, let's assume we are viewing our own profile.
    // A more robust solution would parse the URL.
    // We'll get our own username from the /auth/me endpoint.
    
    const fullNameEl = document.getElementById('profile-fullName');
    const usernameEl = document.getElementById('profile-username');
    const bioEl = document.getElementById('profile-bio');
    const socialsEl = document.getElementById('profile-socials');
    const avatarEl = document.getElementById('profile-avatar');
    const currentStreakEl = document.getElementById('streak-current');
    const longestStreakEl = document.getElementById('streak-longest');


    const fetchProfileData = async () => {
        if (!token) {
            // If no token, redirect to login. The user shouldn't be here.
            window.location.href = 'login.html';
            return;
        }
         // --- 1. SET LOADING STATE ---
    fullNameEl.textContent = 'Loading...';
    usernameEl.textContent = 'loading';
    bioEl.textContent = 'Loading bio...';
    // You can also add a loading message to the calendar div
    document.getElementById('cal-heatmap').innerHTML = '<p>Loading activity calendar...</p>';
        try {
            // First, get the logged-in user's info to find their username
            const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!meRes.ok) throw new Error('Could not fetch user identity.');
            const meData = await meRes.json();
            const username = meData.username;

            // Now, fetch the full public profile using the username
            const profileRes = await fetch(`${API_BASE_URL}/profiles/${username}`);
            if (!profileRes.ok) throw new Error('Could not fetch profile data.');
            const profileData = await profileRes.json();

            // Populate the page with profile data
            populateProfile(profileData);

            // Fetch the calendar data for this user
            const calendarRes = await fetch(`${API_BASE_URL}/activity/calendar/${username}`);
            if (!calendarRes.ok) throw new Error('Could not fetch calendar data.');
            const calendarData = await calendarRes.json();
            
            // Render the calendar with the fetched data
            document.getElementById('cal-heatmap').innerHTML = '';
            renderCalendar(calendarData);

        } catch (error) {
            console.error('Error fetching profile:', error);
            fullNameEl.textContent = 'Could not load profile.';
             bioEl.textContent = 'Could not load profile data. Please try refreshing the page.';
        document.getElementById('cal-heatmap').innerHTML = '<p>Could not load activity.</p>';
        }
    };

    const populateProfile = (data) => {
        fullNameEl.textContent = data.profile.fullName || 'New User';
        usernameEl.textContent = data.username;
        bioEl.textContent = data.profile.bio || 'No bio yet.';
        avatarEl.src = data.profile.avatarUrl;
        currentStreakEl.textContent = data.streak.current;
        longestStreakEl.textContent = data.streak.longest;
        
        // Populate social links
        socialsEl.innerHTML = ''; // Clear previous links
        const links = data.profile.socialLinks;
        if (links.github) socialsEl.innerHTML += `<a href="${links.github}" target="_blank">GitHub</a>`;
        if (links.linkedin) socialsEl.innerHTML += `<a href="${links.linkedin}" target="_blank">LinkedIn</a>`;
        if (links.website) socialsEl.innerHTML += `<a href="${links.website}" target="_blank">Website</a>`;
    };

    const renderCalendar = (data) => {
    console.log("Data from API:", data);
    // Data formatting remains the same and is correct
    const formattedData = data.map(item => ({
        date: item.activityDate.split('T')[0],
        value: item.completionCount
    }));
    // console.log("Data after formatting (for calendar):", formattedData);
    let calendarStartDate;
    if (formattedData.length > 0) {
        // If we have data, start the calendar 1 month before the first data point
        const firstDate = new Date(formattedData[0].date);
        calendarStartDate = new Date(firstDate.setMonth(firstDate.getMonth() - 1));
    } else {
        // If no data, default to showing the last year
        const today = new Date();
        calendarStartDate = new Date(today.setFullYear(today.getFullYear() - 1));
    }
    
    const cal = new CalHeatmap();
    

    // *** THE FIX IS HERE: Use a single configuration object ***
    cal.paint({
        // --- DATA ---
        data: {
            source: formattedData,
            x: 'date',
            y: 'value'
        },
        // --- APPEARANCE ---
        date: { start: calendarStartDate },
        range: 12,
        scale: {
            color: {
                type: 'threshold',
                range: ['#cce5cc', '#66b266', '#338033', '#1a4d1a'], // A slightly different green ramp
                domain: [1, 3, 5, 8] // 1-2, 3-4, 5-7, 8+
            }
        },
        domain: {
            type: 'month',
            gutter: 4,
            label: { text: 'MMM', position: 'top' } // e.g., Jan, Feb
        },
        subDomain: {
            type: 'day',
            radius: 2,
            width: 11,
            height: 11,
        },
        // --- PLUGINS ---
        // The plugins go INSIDE the main config object now.
        plugin: {
            // Tooltip Plugin
            'Tooltip': {
                text: function (date, value, dayjsDate) {
                    return (
                        (value ? value : 'No') +
                        ' contribution' + (value === 1 ? '' : 's') +
                        ' on ' +
                        dayjsDate.format('LL')
                    );
                }
            },
            // Legend Plugin
            'Legend': {
                tickSize: 0,
                itemSelector: '#cal-heatmap-legend',
                label: 'contributions',
                width: 300,
                // Optional: Customize legend colors and labels
                // domain: [1, 3, 5, 8],
                // range: ['#cce5cc', '#66b266', '#338033', '#1a4d1a']
            }
        }
    });
};


    // Initial fetch
    fetchProfileData();
});
const formattedData = data.map(item => ({
    date: item.activityDate.split('T')[0], // from "activityDate" to "date"
    value: item.completionCount           // from "completionCount" to "value"
}));

// document.addEventListener('DOMContentLoaded', async () => {
//     const API_URL = 'http://localhost:5000';
//     console.log('Profile script started.');

//     const getUsernameFromURL = () => {
//         const params = new URLSearchParams(window.location.search);
//         return params.get('user');
//     };

//     const username = getUsernameFromURL();
//     console.log('Fetching profile for username:', username);

//     if (!username) {
//         console.error('No username found in URL.');
//         return;
//     }

//     try {
//         const response = await fetch(`${API_URL}/api/profiles/${username}`);
//         console.log('API Response Status:', response.status);

//         if (!response.ok) {
//             throw new Error(`Failed to fetch profile. Status: ${response.status}`);
//         }

//         const profileData = await response.json();
//         console.log('Received Profile Data:', profileData);

//         // --- Just try to populate one field ---
//         document.getElementById('profile-username').textContent = profileData.username;
//         document.getElementById('loader').classList.add('hidden');
//         document.getElementById('profile-content').classList.remove('hidden');

//     } catch (error) {
//         console.error('An error occurred:', error);
//         document.getElementById('loader').classList.add('hidden');
//         document.getElementById('profile-content').innerHTML = `<h2>Error: ${error.message}</h2>`;
//         document.getElementById('profile-content').classList.remove('hidden');
//     }
// });





// document.addEventListener('DOMContentLoaded', async () => {
//     const API_URL = 'http://localhost:5000';
//     const loader = document.getElementById('loader');
//     const profileContent = document.getElementById('profile-content');

//     const getUsernameFromURL = () => {
//         const params = new URLSearchParams(window.location.search);
//         return params.get('user');
//     };

//     const getLoggedInUser = () => {
//         // ... (this function stays the same)
//     };

//     const username = getUsernameFromURL();
//     const loggedInUser = getLoggedInUser();

//     if (!username) {
//         // ... (this part is fine now)
//     }

//     try {
//         console.log("Fetching data in parallel...");
//         const [profileRes, calendarRes] = await Promise.all([
//             fetch(`${API_URL}/api/profiles/${username}`),
//             fetch(`${API_URL}/api/activity/calendar/${username}`)
//         ]);

//         console.log("Profile Response Status:", profileRes.status);
//         console.log("Calendar Response Status:", calendarRes.status);

//         if (!profileRes.ok) throw new Error('User not found');
//         if (!calendarRes.ok) throw new Error('Could not fetch calendar data');

//         const profileData = await profileRes.json();
//         const calendarData = await calendarRes.json();

//         // --- THIS IS THE CRITICAL DEBUGGING STEP ---
//         console.log("Received Profile Data:", profileData);
//         console.log("Received Calendar Data:", calendarData); // <<< What does this look like? Is it an array?

//         // --- Populate the Page with Data ---
//         // ... (all the document.getElementById calls stay the same) ...

//         // --- Render the Calendar ---
//         if (calendarData && Array.isArray(calendarData)) { // Add a check to ensure data is a valid array
//             const cal = new CalHeatmap();
//             cal.paint({
//                 itemSelector: '#contribution-calendar',
//                 domain: {
//                     type: 'month',
//                     label: { text: 'MMM', textAlign: 'start', position: 'top' },
//                 },
//                 subDomain: { type: 'day', radius: 2 },
//                 data: {
//                     source: calendarData,
//                     x: 'activityDate',
//                     y: 'completionCount', // Simplified 'y' accessor
//                 },
//                 scale: {
//                     color: {
//                         type: 'threshold',
//                         range: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
//                         domain: [1, 3, 5, 10],
//                     },
//                 },
//             });
//             console.log("Calendar painted successfully.");
//         } else {
//             console.error("Calendar data is not in the expected format (array).", calendarData);
//         }
        
//         // Hide loader and show content
//         loader.classList.add('hidden');
//         profileContent.classList.remove('hidden');

//     } catch (error) {
//         console.error("An error occurred in the try block:", error);
//         loader.classList.add('hidden');
//         profileContent.innerHTML = `<h2>Error: ${error.message}</h2>`;
//         profileContent.classList.remove('hidden');
//     }
// });