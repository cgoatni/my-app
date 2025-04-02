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

socket.addEventListener("open", () => console.log("WebSocket connection established."));
socket.addEventListener("close", () => {
    console.warn("WebSocket connection closed.");
    isWebSocketActive = false;
    dashboardDataInterval = setInterval(fetchDashboardData, 5000);  // Re-enable polling if WebSocket closes
});
socket.addEventListener("error", (err) => console.error("WebSocket error:", err));

// Function to fetch dashboard data (e.g., user stats) for real-time updates
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard-data');  // Modify with your actual endpoint
        const data = await response.json();

        // Update your dashboard with the fetched data
        // Example: document.getElementById('userCount').innerText = data.userCount;

    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}
