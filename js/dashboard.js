// Wait for the DOM to fully load before executing
document.addEventListener("DOMContentLoaded", () => {
    fetchUserData();
    fetchDashboardData();
    setupLogoutButton();
});

// Check if the user is logged in and has admin access
fetch('/api/user')
.then(response => response.json())
.then(data => {
    const dashboardLink = document.getElementById('dashboard-link');
    
    if (data.userAccess === 'Admin') {
        // Allow the link to be clicked for admin users
        dashboardLink.onclick = () => {
            window.location.href = '/dashboard';
        };
    } else {
        // Disable clicking for non-admin users but keep the link visible
        dashboardLink.style.pointerEvents = 'none'; // Disable clicking
    }
})
.catch(() => {
    // Handle any errors, like if the user is not logged in
    console.log('User is not logged in or error occurred');
});


// Fetch and display user data
async function fetchUserData() {
    try {
        const response = await fetch("/api/user", { credentials: "include" });

        if (!response.ok) {
            throw new Error(response.status === 401 ? "Unauthorized" : "Failed to fetch user data");
        }

        const user = await response.json();

        const fullNameElement = document.getElementById("fullname");
        if (fullNameElement) {
            fullNameElement.textContent = user.fullName || "Guest";
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login"; // Redirect if unauthorized
    }
}

// Fetch statistics and update the dashboard
async function fetchDashboardData() {
    try {
        const [userResponse, activeUsersResponse] = await Promise.all([
            fetch("/count"),
            fetch("/activeUsers")
        ]);

        // Check response status and handle errors
        if (!userResponse.ok || !activeUsersResponse.ok) {
            throw new Error("Failed to fetch one or more dashboard data endpoints");
        }

        const userData = await userResponse.json();
        const activeUsersData = await activeUsersResponse.json();

        updateElementText("userCount", userData.userCount?.toLocaleString() ?? "N/A");
        updateElementText("activeUsers", activeUsersData.activeUsers?.toLocaleString() ?? "N/A");
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        updateElementText("userCount", "Error");
        updateElementText("activeUsers", "Error");
    }
}

// Helper function to safely update text content in an element
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Element with ID '${elementId}' not found.`);
    }
}

// Set up logout functionality
function setupLogoutButton() {
    const logoutButtons = document.querySelectorAll("#logout-btn, .logout-btn");

    logoutButtons.forEach(button => {
        button.addEventListener("click", async () => {
            try {
                await fetch("/logout", { method: "POST" });
                window.location.href = "/login";
            } catch (error) {
                console.error("Logout failed:", error);
            }
        });
    });
}

// WebSocket for real-time active user updates with fallback polling
let isWebSocketActive = false;
let dashboardDataInterval = setInterval(fetchDashboardData, 5000); // Fallback polling every 5 seconds

// WebSocket Connection for Real-Time Updates
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("message", async () => {
    await fetchDashboardData(); // Refresh stats when a message is received
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
