document.addEventListener("DOMContentLoaded", () => {
    fetchUserData();
});

// Fetch user data and populate the profile page
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        if (data.email) {
            // Populate profile fields with user data
            document.getElementById('profile-name').innerText = data.firstName + ' ' + data.lastName || 'N/A';
            document.getElementById('dob').innerText = data.dob || 'N/A';
            document.getElementById('profile-email').innerText = data.email || 'N/A';
            document.getElementById('profile-contact').innerText = data.contact || 'N/A';
            document.getElementById('profile-address').innerText = data.address || 'N/A';
            // Add other profile data if needed
        } else {
            // Redirect to login if no user is found
            window.location.href = '/login';
        }
    } catch (err) {
        console.error('Error loading user data:', err);
        window.location.href = '/login';  // Redirect to login if error occurs
    }
}


