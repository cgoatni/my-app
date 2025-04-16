document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData();
    loadUserList();
});

// ================== DASHBOARD FUNCTIONS ==================

// Fetch and display dashboard stats
async function loadDashboardData() {
    try {
        const [userRes, activeRes] = await Promise.all([
            fetch("/count"),
            fetch("/activeUsers")
        ]);

        if (!userRes.ok || !activeRes.ok) throw new Error("Failed to fetch dashboard data");

        const { userCount } = await userRes.json();
        const { activeUsers } = await activeRes.json();

        updateText("userCount", userCount?.toLocaleString() ?? "N/A");
        updateText("activeUsers", activeUsers?.toLocaleString() ?? "N/A");
    } catch (err) {
        console.error("Dashboard error:", err);
        updateText("userCount", "Error");
        updateText("activeUsers", "Error");
    }
}

// ================== USER LIST FUNCTIONS ==================

// Fetch and render user list
async function loadUserList() {
    const container = document.getElementById("userList");
    toggleLoader(true);
    try {
        const res = await fetch("/users");
        if (!res.ok) throw new Error("Failed to fetch user list");

        const users = await res.json();
        container.innerHTML = users.map(renderUserRow).join('');
    } catch (err) {
        console.error("User list error:", err);
        container.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Failed to load users</td></tr>`;
    } finally {
        toggleLoader(false);
    }
}

// Render a single user row
function renderUserRow(user) {
    return `
        <tr>
            <td class="px-4 py-2 border">${user.lastName} ${user.firstName}</td>
            <td class="px-4 py-2 border">${user.email}</td>
            <td class="px-4 py-2 border">${user.role}</td>
            <td class="px-4 py-2 border space-x-2">
                <button onclick="editUser('${user._id}')" class="bg-green-400 text-white px-3 py-1 rounded hover:bg-green-500">Update</button>
                <button onclick="deleteUser('${user._id}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
            </td>
        </tr>
    `;
}

// ================== USER MODAL FUNCTIONS ==================

// Open the modal
function openModal(user = null) {
    showUserModal(user);
}

// Show modal with user data for add or update
function showUserModal(user = null) {
    const form = document.getElementById("userForm");
    const modal = document.getElementById("userModal");
    const modalContent = document.getElementById("modal-content");
    const title = document.getElementById("modalTitle");
    const submitBtn = document.getElementById("submitBtn");

    // Reset modal state
    modal.classList.remove("hidden", "opacity-0", "scale-95");
    modal.classList.add("opacity-100", "scale-100");

    // Set modal title and button text
    title.innerText = user ? "Update User" : "Add User";
    submitBtn.innerText = user ? "Update User" : "Add User";

    // Reset form fields
    form.reset();

    // Populate form fields if updating a user
    if (user) {
        form.dataset.userId = user._id;
        const fields = ["firstName", "lastName", "email", "contact", "address", "gender", "dob", "role", "username"];
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) input.value = user[field] ?? '';
        });
    }

    // Show modal with fade-in effect
    modal.classList.remove("hidden");
    setTimeout(() => modalContent.classList.remove("opacity-0"), 50);
}

// Close the modal
function closeModal() {
    const modal = document.getElementById("userModal");
    const modalContent = document.getElementById("modal-content");

    // Start closing animation
    modalContent.classList.add("opacity-0");
    modal.classList.remove("opacity-100", "scale-100");
    modal.classList.add("opacity-0", "scale-95");

    // Hide modal after animation
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}

// ================== UTILITY FUNCTIONS ==================

// Update text content of an element
function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Toggle loader visibility
function toggleLoader(show) {
    const loader = document.getElementById("loadingIndicator");
    if (loader) loader.style.display = show ? "block" : "none";
}

// Close modal when clicking outside of the modal box
document.getElementById("userModal").addEventListener("click", function (event) {
    const modalBox = this.querySelector(".bg-white");
    if (modalBox && !modalBox.contains(event.target)) {
        closeModal();
    }
});

// Close modal when clicking the close button (&times;)
document.querySelector(".absolute.top-2.right-2").addEventListener("click", closeModal);

// Close modal on pressing Escape key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal();
    }
});
