// Fetch and display user data when the page loads
window.onload = function() {
    fetchUserData();
    setupLogoutButton();
};

// Fetch user data and populate the settings form
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        if (data.email) {
            // Populate form fields with the user data
            document.getElementById('settings-username').value = data.username || '';
            document.getElementById('settings-email').value = data.email || '';
            document.getElementById('settings-contact').value = data.contact || '';
            document.getElementById('settings-address').value = data.address || '';
            document.getElementById('settings-gender').value = data.gender || 'other';
            document.getElementById('settings-dob').value = data.dob || '';
            // Add other fields as needed
        } else {
            // Redirect to login if no user data is found
            window.location.href = '/login';
        }
    } catch (err) {
        console.error('Error loading user data:', err);
        window.location.href = '/login';  // Redirect to login if there's an error
    }
}

const profilePictureInput = document.getElementById('settings-profile-picture');
const profileImg = document.getElementById('profile-img');

// Profile picture preview logic
profilePictureInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    // Hide the image preview first
    profileImg.classList.add('hidden');

    reader.onload = function(event) {
        profileImg.src = event.target.result;
        profileImg.classList.remove('hidden');
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

// Set up logout functionality
function setupLogoutButton() {
    const logoutButtons = document.querySelectorAll("#logout-btn, .logout-btn");

    logoutButtons.forEach(button => {
        button.addEventListener("click", async () => {
            try {
                await fetch("/logout", { method: "POST" });
                window.location.href = "/login";  // Redirect to login after logout
            } catch (error) {
                console.error("Logout failed:", error);
                alert("Logout failed. Please try again.");  // User-friendly message
            }
        });
    });
}

// Real-time updates for dashboard using WebSocket with fallback polling
let isWebSocketActive = false;
let dashboardDataInterval = setInterval(fetchDashboardData, 5000); // Polling every 5 seconds

// WebSocket connection for real-time updates
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("message", async () => {
    await fetchDashboardData();  // Refresh stats when a WebSocket message is received
    if (!isWebSocketActive) {
        isWebSocketActive = true;
        clearInterval(dashboardDataInterval);  // Disable polling once WebSocket is active
    }
});

socket.addEventListener("open", () => {
    console.log("WebSocket connection established.");
    document.getElementById("websocket-status").innerText = "Connected";  // Optional: Show WebSocket status
});
socket.addEventListener("close", () => {
    console.warn("WebSocket connection closed.");
    isWebSocketActive = false;
    dashboardDataInterval = setInterval(fetchDashboardData, 5000);  // Re-enable polling if WebSocket closes
    document.getElementById("websocket-status").innerText = "Disconnected";  // Show status update
});
socket.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
    document.getElementById("websocket-status").innerText = "Error";  // Show status update
});

// Function to fetch dashboard data (e.g., user stats) for real-time updates
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard-data');  // Modify with your actual endpoint
        const data = await response.json();

        // Example of updating dashboard data
        document.getElementById('userCount').innerText = data.userCount || '0';
        document.getElementById('activeSessions').innerText = data.activeSessions || '0';

    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// Validate the old password before updating
async function validateOldPassword(oldPassword) {
    try {
        const response = await fetch('/api/validate-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: oldPassword }),
        });
        const data = await response.json();

        if (data.isValid) {
            return true;
        } else {
            alert('Old password is incorrect!');
            return false;
        }
    } catch (err) {
        console.error('Error validating password:', err);
        alert('An error occurred while validating the password.');
        return false;
    }
}

// Add event listener for the save changes button to validate the old password and change the password
document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;

    // Validate the old password
    const isOldPasswordValid = await validateOldPassword(oldPassword);

    if (isOldPasswordValid) {
        // Proceed with saving changes or updating the password
        // You can send the new password to the server here
        console.log('Old password validated successfully! Proceeding with password change.');
        // Example of sending new password to server
        // await updatePassword(newPassword);
    } else {
        console.log('Old password is invalid.');
    }
});
