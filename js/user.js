document.addEventListener("DOMContentLoaded", () => {
    fetchUserData();
});

async function fetchUserData() {
    try {
        // Fetch user data
        const response = await fetch("/api/user", { credentials: "include" });

        if (!response.ok) {
            // Handle unauthorized or failed requests
            throw new Error(response.status === 401 ? "Unauthorized" : "Failed to fetch user data");
        }

        const user = await response.json();

        // Update full name display
        const fullNameElement = document.getElementById("fullName");
        if (fullNameElement) {
            fullNameElement.textContent = user.firstName + " " + user.lastName || "Guest";
        }

        if (user.role && user.role.toLowerCase() === "admin") {
            const dashboardLink = document.getElementById("dashboard-link");
            if (dashboardLink) {
                dashboardLink.classList.remove("hidden");
        
                // Add click event to redirect to /dashboard
                dashboardLink.addEventListener("click", () => {
                    window.location.href = "/dashboard";
                });
            }
        }               

        // Populate settings form fields with user data
        const settingsElements = {
            'settings-lastname': user.lastName || '',
            'settings-firstname': user.firstName || '',
            'settings-username': user.username || '',
            'settings-email': user.email || '',
            'settings-contact': user.contact || '',
            'settings-address': user.address || '',
            'settings-gender': user.gender || 'other',
            'settings-dob': user.dob || ''
        };

        // Loop through the fields and populate them
        Object.keys(settingsElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = settingsElements[id];
            }
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login"; // Redirect to login page if there's an error
    }
}

async function insertUser() {
    try {
        const res = await fetch("/insert/user", { method: "POST" });
        if (!res.ok) throw new Error("Failed to insert user");

        const user = await res.json();
        showUserModal(user);
    } catch (err) {
        console.error("Insert error:", err);
    }
}


// ================== USER ACTIONS ==================

// Edit a user
async function editUser(userId) {
    try {
        const res = await fetch(`/user/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user");

        const user = await res.json();
        showUserModal(user);
    } catch (err) {
        console.error("Edit error:", err);
    }
}

// Delete a user
async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const res = await fetch(`/delete/user/${userId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete user");

        loadUserList();
    } catch (err) {
        console.error("Delete error:", err);
    }
}

// Submit the user form
function submitForm(event) {
    event.preventDefault();

    const form = document.getElementById("userForm");
    const formData = new FormData(form);
    const userId = form.dataset.userId;

    if (!validateUserForm(formData)) return;

    const data = Object.fromEntries(formData);
    if (userId) data.userId = userId;

    toggleLoader(true);

    fetch(userId ? "/update/user" : "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(() => {
            closeModal();
            loadUserList();
            alert("User saved successfully!");
        })
        .catch(err => {
            console.error("Save error:", err);
            alert("Failed to save user.");
        })
        .finally(() => toggleLoader(false));
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