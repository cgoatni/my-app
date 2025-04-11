// Wait for the DOM to fully load before executing
document.addEventListener("DOMContentLoaded", () => {
    fetchUserData();
    fetchMenuData();
    fetchDashboardData();
    fetchUserList(); 
    setupLogoutButton();
});

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

// Fetch and display menu data from the backend
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

// Fetch and display the user list
async function fetchUserList() {
    try {
        const response = await fetch('/users'); // Fetch user data from the backend
        if (!response.ok) {
            throw new Error("Failed to fetch user list");
        }
        const users = await response.json();
        
        const userListContainer = document.getElementById('userList');
        userListContainer.innerHTML = ''; // Clear any existing data
        
        // Loop through each user and create a table row
        users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="px-4 py-2 border">${user.lastName + ' ' + user.firstName}</td>
                <td class="px-4 py-2 border">${user.email}</td>
                <td class="px-4 py-2 border">${user.role}</td>
            `;

            userListContainer.appendChild(row); // Append row to the table body
        });
    } catch (error) {
        console.error("Error fetching user list:", error);
        const userListContainer = document.getElementById('userList');
        userListContainer.innerHTML = '<tr><td colspan="3" class="text-center text-red-500">Failed to load users</td></tr>';
    }
}

// Fetch the user list when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
    fetchUserList();
});


// Open Modal
function openModal() {
    const modal = document.getElementById("addUserModal");
    const modalContent = document.getElementById("modal-content");

    modal.classList.remove("hidden");
    modalContent.classList.remove("opacity-0");
    modalContent.classList.add("opacity-100");

    // Focus on the first input field
    document.querySelector("input[name='lastName']").focus();
}

// Close Modal
function closeModal() {
    const modal = document.getElementById("addUserModal");
    const modalContent = document.getElementById("modal-content");

    modal.classList.add("hidden");
    modalContent.classList.remove("opacity-100");
    modalContent.classList.add("opacity-0");
}

// Update icon dynamically based on the input
function updateIcon(field) {
    const fieldValue = document.getElementById(field).value;
    const iconElement = document.getElementById(`${field}Icon`);
    if (fieldValue) {
        iconElement.classList.add("text-blue-500");
    } else {
        iconElement.classList.remove("text-blue-500");
    }
}

// Validate Contact Number
function validateContactNumber() {
    const contactInput = document.getElementById('contact');
    const contactIcon = document.getElementById('contactIcon');
    const regex = /^[0-9]{10}$/;

    if (regex.test(contactInput.value)) {
        contactIcon.classList.add("text-blue-500");
    } else {
        contactIcon.classList.remove("text-blue-500");
    }
}

// Validate Passwords
function validatePasswords() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return false;
    }
    return true;
}

// Form validation
function validateForm() {
    const lastName = document.getElementById('lastName').value;
    const firstName = document.getElementById('firstName').value;
    const email = document.getElementById('email').value;
    const contact = document.getElementById('contact').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const role = document.getElementById('role').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Basic Field Validation
    if (!lastName || !firstName || !email || !contact || !gender || !dob || !role || !username || !password || !confirmPassword) {
        alert("All fields are required!");
        return false;
    }

    // Password confirmation validation
    if (!validatePasswords()) {
        return false;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    // Validate Contact Number
    if (!/^[0-9]{10}$/.test(contact)) {
        alert("Please enter a valid 10-digit contact number.");
        return false;
    }

    // If all validations pass, return true to submit form
    return true;
}

// Example to open the modal (can be triggered by button click)
document.getElementById('openModalButton').addEventListener('click', openModal);

// Close modal if clicked outside the modal content
document.getElementById("addUserModal").addEventListener("click", function(event) {
    if (event.target === this) {
        closeModal();
    }
});

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

    console.log("Setting up logout buttons:", logoutButtons); // Debugging line

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
