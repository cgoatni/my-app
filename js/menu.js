document.addEventListener("DOMContentLoaded", () => {
    fetchMenuForHeaderData();
    updateDashboardTitle(); // Update dashboard title based on device type
    menuItem();
});

window.addEventListener("resize", () => {
    const menuItems = JSON.parse(sessionStorage.getItem("menuItems")) || []; // Cache menu items
    const userRole = sessionStorage.getItem("userRole") || "Guest"; // Cache user role
    updateDashboardTitle(); // Update dashboard title based on device type
    renderMenu(menuItems, userRole, 'menu-items');
    renderMenu(menuItems, userRole, 'mobile-menu-items');
});

// Fetch menu data for header
async function fetchMenuForHeaderData() {
    try {
        const [menuRes, userRes] = await Promise.all([
            fetch('/menu', { credentials: "include" }),
            fetch('/api/user')
        ]);
        if (!menuRes.ok || !userRes.ok) throw new Error("Failed to fetch menu or user data");

        const menuItems = await menuRes.json();
        const user = await userRes.json();
        const userRole = user.role;

        sessionStorage.setItem("menuItems", JSON.stringify(menuItems)); // Cache menu items
        sessionStorage.setItem("userRole", userRole); // Cache user role

        renderMenu(menuItems, userRole, 'menu-items');
        renderMenu(menuItems, userRole, 'mobile-menu-items', true);
    } catch (error) {
        console.error("Error fetching menu data:", error);
    }
}

// Render menu items
function renderMenu(menuItems, userRole, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const isMobile = isMobileDevice(); // Check if the device is mobile

    menuItems
        .filter(item => item.role.includes(userRole)) // Filter items based on user role
        .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort items by order
        .forEach(item => {
            const li = document.createElement('li');
            li.className = "menu-item"; // Add a class for styling

            // Render icon only for mobile, icon + text for desktop
            li.innerHTML = `
                <a href="${item.path || '#'}" class="text-white transition ${item.name.toLowerCase() === 'logout' ? 'hover:text-red-400' : 'hover:text-blue-900'}">
                    <i class="${item.icon}"></i> ${!isMobile ? item.name : ''}
                </a>`;
            container.appendChild(li);

            // Add logout functionality
            if (item.name.toLowerCase() === 'logout') {
                li.querySelector('a').addEventListener("click", async (e) => {
                    e.preventDefault();
                    await logoutUser();
                });
            }
        });

    // Add or remove mobile-specific class
    if (isMobile) {
        container.classList.add('mobile-menu');
    } else {
        container.classList.remove('mobile-menu');
    }
}

function updateDashboardTitle() {
    const dashboardLink = document.getElementById("dashboard-link");
    if (!dashboardLink) return;

    if (isMobileDevice()) {
        dashboardLink.innerHTML = '<i class="fa-brands fa-wolf-pack-battalion"></i>';
        dashboardLink.classList.remove("text-2xl", "font-semibold");
        dashboardLink.classList.add("text-xl");
    } else {
        dashboardLink.textContent = 'Dashboard';
        dashboardLink.classList.add("text-2xl", "font-semibold");
    }
}

// Logout user
async function logoutUser() {
    try {
        await fetch("/logout", { method: "POST", credentials: "include" });
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

// Fetch and display menu items
async function menuItem() {
    const menuContainer = document.getElementById("menu-items-container");
    if (!menuContainer) return;
    try {
        const response = await fetch('/menu', { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch menu items");

        const menuItems = await response.json();
        menuContainer.innerHTML = menuItems
            .sort((a, b) => a.order - b.order)
            .map(item => `
                <tr>
                    <td class="p-4 border-b">${item.name || "N/A"}</td>
                    <td class="p-4 border-b">
                        <button class="text-blue-600 hover:underline text-sm" onclick="editMenuItem('${item._id}')">Edit</button>
                        <button class="text-red-600 hover:underline text-sm" onclick="deleteMenuItem('${item._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
    } catch (error) {
        console.error("Error loading menu items:", error);
        menuContainer.innerHTML = `<p class="text-red-600 p-4">Failed to load menu items.</p>`;
    }
}

// Edit menu item
async function editMenuItem(itemId) {
    try {
        // Fetch all menu items
        const response = await fetch(`/menu`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch menu items");

        const menuItems = await response.json();

        // Find the specific menu item by ID
        const item = menuItems.find(menuItem => menuItem._id === itemId);
        if (!item) throw new Error("Menu item not found");

        openMenuModal(item); // Open the modal with the item data

        // Handle form submission for updating the item
        document.getElementById("menu-form").onsubmit = async (e) => {
            e.preventDefault();
            const payload = getMenuFormData();
            try {
                const res = await fetch(`/update/menu/${itemId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Failed to update menu item");
                closeMenuModal();
                menuItem(); // Refresh the menu items list
                window.location.reload(); // Reload the page to reflect changes
            } catch (err) {
                console.error("Error updating menu item:", err);
            }
        };
    } catch (err) {
        console.error("Error fetching menu items:", err);
    }
}

// Delete menu item
async function deleteMenuItem(itemId) {
    if (confirm("Are you sure you want to delete this menu item?")) {
        try {
            const res = await fetch(`/delete/menu/${itemId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete menu item");
            menuItem();
        } catch (err) {
            console.error("Error deleting menu item:", err);
        }
    }
}

// Open menu modal
function openMenuModal(item = null) {
    console.log(item); // Debugging step
    const modal = document.getElementById("menu-modal");
    modal.classList.remove("hidden");
    document.getElementById("menu-modal-overlay").classList.remove("hidden");
    document.getElementById("modal-title").textContent = item ? "Edit Menu Item" : "Add Menu Item";
    setMenuFormData(item);
}


// Close menu modal
function closeMenuModal() {
    document.getElementById("menu-modal").classList.add("hidden");
    document.getElementById("menu-modal-overlay").classList.add("hidden");
    document.getElementById("menu-form").reset();
}

// Get form data
function getMenuFormData() {
    return {
        name: document.getElementById("menu-name").value,
        path: document.getElementById("menu-path").value,
        icon: document.getElementById("menu-icon").value,
        class: document.getElementById("menu-class").value,
        role: document.getElementById("menu-role").value.split(",").map(r => r.trim()),
        order: parseInt(document.getElementById("menu-order").value)
    };
}

// Set form data
function setMenuFormData(item) {
    if (!item) {
        console.error("No item data provided to set in form.");
        return;
    }
    document.getElementById("menu-id").value = item._id || "";
    document.getElementById("menu-name").value = item.name || "";
    document.getElementById("menu-path").value = item.path || "";
    document.getElementById("menu-icon").value = item.icon || "";
    document.getElementById("menu-class").value = item.class || "";
    document.getElementById("menu-role").value = item.role?.join(",") || "";
    document.getElementById("menu-order").value = item.order || "";
}


// Utility function to check if the device is mobile
function isMobileDevice() {
    return window.innerWidth <= 1025; // Adjust breakpoint as needed (e.g., 768px for tablets and below)
}
