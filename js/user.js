document.addEventListener("DOMContentLoaded", () => fetchUserData());

// Fetch user data and populate UI
async function fetchUserData() {
    try {
        const response = await fetch("/api/user", { credentials: "include" });
        if (!response.ok) throw new Error(response.status === 401 ? "Unauthorized" : "Failed to fetch user data");

        const user = await response.json();
        updateFullName(user);
        toggleDashboardLink(user);
        populateSettingsForm(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login"; // Redirect to login on error
    }
}

// Update full name display
function updateFullName(user) {
    const fullNameElement = document.getElementById("fullName");
    if (fullNameElement) fullNameElement.textContent = `${user.firstName} ${user.lastName}` || "Guest";
}

// Show or hide dashboard link for admin users
function toggleDashboardLink(user) {
    const dashboardLink = document.getElementById("dashboard-link");
    if (user.role?.toLowerCase() === "admin" && dashboardLink) {
        dashboardLink.classList.remove("hidden");
        dashboardLink.addEventListener("click", () => (window.location.href = "/dashboard"));
    }
}

// Populate settings form fields with user data
function populateSettingsForm(user) {
    const settingsFields = {
        'settings-lastname': user.lastName,
        'settings-firstname': user.firstName,
        'settings-username': user.username,
        'settings-email': user.email,
        'settings-contact': user.contact,
        'settings-address': user.address,
        'settings-gender': user.gender || 'other',
        'settings-dob': user.dob
    };

    Object.entries(settingsFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    });
}

// Insert a new user
async function insertUser() {
    try {
        const res = await fetch("/insert/user", { method: "POST" });
        if (!res.ok) throw new Error("Failed to insert user");
        showUserModal(await res.json());
    } catch (err) {
        console.error("Insert error:", err);
    }
}

// Edit a user
async function editUser(userId) {
    try {
        const res = await fetch(`/user/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        showUserModal(await res.json());
    } catch (err) {
        console.error("Edit error:", err);
    }
}

// Delete a user
async function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
        try {
            const res = await fetch(`/delete/user/${userId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete user");
            loadUserList();
        } catch (err) {
            console.error("Delete error:", err);
        }
    }
}

// Submit the user form
async function submitForm(event) {
    event.preventDefault();
    const form = document.getElementById("userForm");
    const formData = new FormData(form);
    const userId = form.dataset.userId;

    if (!validateUserForm(formData)) return;

    const data = Object.fromEntries(formData);
    if (userId) data.userId = userId;

    toggleLoader(true);
    try {
        const res = await fetch(userId ? "/update/user" : "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to save user");
        closeModal();
        loadUserList();
        alert("User saved successfully!");
    } catch (err) {
        console.error("Save error:", err);
        alert("Failed to save user.");
    } finally {
        toggleLoader(false);
    }
}

// Validate user form
function validateUserForm(data) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return false;
    }
    return true;
}