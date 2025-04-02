// Function to fetch and display profile data
window.onload = function() {
    fetchUserData();
    setupLogoutButton();
};

// Fetch user data and populate the profile page
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        if (data.email) {
            // Populate profile fields with user data
            document.getElementById('profile-name').innerText = data.fullName || 'N/A';
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

// Set up logout functionality
function setupLogoutButton() {
    const logoutButtons = document.querySelectorAll("#logout-btn, .logout-btn");

    logoutButtons.forEach(button => {
        button.addEventListener("click", async () => {
            try {
                await fetch("/logout", { method: "POST" });
                window.location.href = "/login";  // Redirect to login after successful logout
            } catch (error) {
                console.error("Logout failed:", error);
            }
        });
    });
}

// Real-time updates handling with WebSocket and polling as fallback
let isWebSocketActive = false;
let dashboardDataInterval = setInterval(fetchDashboardData, 5000); // Fallback polling every 5 seconds

// WebSocket connection for real-time updates
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("message", async () => {
    await fetchDashboardData();  // Refresh dashboard stats when a message is received
    if (!isWebSocketActive) {
        isWebSocketActive = true;
        clearInterval(dashboardDataInterval);  // Disable polling once WebSocket is active
    }
});

socket.addEventListener("open", () => console.log("WebSocket connection established."));
socket.addEventListener("close", () => {
    console.warn("WebSocket connection closed.");
    isWebSocketActive = false;
    dashboardDataInterval = setInterval(fetchDashboardData, 5000);  // Re-enable polling if WebSocket closes
});
socket.addEventListener("error", (err) => console.error("WebSocket error:", err));

// Fetch dashboard data function to be used by both WebSocket and polling
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard-data');  // Modify with the actual endpoint
        const data = await response.json();
        
        // Update your dashboard statistics here based on the response
        // Example: document.getElementById('userCount').innerText = data.userCount;

    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}
