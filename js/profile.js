// Function to fetch and display profile data
window.onload = function() {
    fetchUserData();
    fetchMenuData();
    fetchDashboardData();
    setupLogoutButton();
};

// Check if the user is logged in and has admin access
fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        const dashboardLink = document.getElementById('dashboard-link');
        
        if (data.role === 'Admin') {
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

async function fetchMenuData() {
    try {
        const response = await fetch('/menu', { credentials: "include" });

        if (!response.ok) {
            throw new Error("Failed to fetch menu data");
        }

        const menuItems = await response.json();

        const menuContainer = document.getElementById('menu-items');
        const mobileMenuContainer = document.getElementById('mobile-menu-items');

        menuContainer.innerHTML = '';
        mobileMenuContainer.innerHTML = '';

        // Fetch the current user's role
        const userResponse = await fetch('/api/user');
        const user = await userResponse.json();
        const userRole = user.role; // This is either 'Admin', 'userOnly', etc.

        menuItems.forEach(item => {
            const isLogout = item.name.toLowerCase() === 'logout';
            const isRoleAllowed = item.role.some(role => userRole === role);  // Check if the user's role is allowed for this item

            if (!isRoleAllowed) return; // Skip menu item if the user role doesn't match

            // Desktop menu
            const desktopLi = document.createElement('li');
            const desktopA = document.createElement('a');
            desktopA.classList.add('text-white', 'transition');
            desktopA.classList.add(isLogout ? 'hover:text-red-400' : 'hover:text-blue-400');
            desktopA.href = item.path || '#';
            if (item.id) desktopA.id = item.id;

            const icon = document.createElement('i');
            icon.className = item.icon;
            desktopA.appendChild(icon);
            desktopA.appendChild(document.createTextNode(` ${item.name}`));
            desktopLi.appendChild(desktopA);
            menuContainer.appendChild(desktopLi);

            // Mobile menu
            const mobileLi = document.createElement('li');
            const mobileA = document.createElement('a');
            mobileA.classList.add('text-white', 'transition');
            mobileA.classList.add(isLogout ? 'hover:text-red-400' : 'hover:text-blue-400');
            mobileA.href = item.path || '#';
            if (item.id) mobileA.id = `${item.id}-mobile`; // Avoid duplicate ID

            const mobileIcon = document.createElement('i');
            mobileIcon.className = item.icon;
            mobileA.appendChild(mobileIcon);
            mobileLi.appendChild(mobileA);
            mobileMenuContainer.appendChild(mobileLi);

            // Handle Logout functionality
            if (isLogout) {
                desktopA.addEventListener("click", async (e) => {
                    e.preventDefault();  // Prevent default anchor behavior
                    await logoutUser();
                });
                mobileA.addEventListener("click", async (e) => {
                    e.preventDefault();  // Prevent default anchor behavior
                    await logoutUser();
                });
            }
        });

        // 👇 Call this after menus are generated
        setupLogoutButton();

    } catch (error) {
        console.error("Error fetching menu data:", error);
    }
}

// Fetch user data and populate the profile page
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        console.log('User data:', data);  // Debugging line to check the response

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

// Fetch dashboard data function to be used by both WebSocket and polling
async function fetchDashboardData() {
    try {
        const response = await fetch('/api/dashboard-data');  // Modify with the actual endpoint
        const data = await response.json();

    } catch (err) {
        console.error('Error loading dashboard data:', err);
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


