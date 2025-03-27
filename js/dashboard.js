async function fetchUserData() {
    try {
        const response = await fetch('/api/user', { credentials: "include" });

        if (!response.ok) {
            throw new Error(response.status === 401 ? "Unauthorized" : "Failed to fetch user data");
        }

        const user = await response.json();
        document.getElementById("fullname").textContent = user.fullName;
    } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = '/login'; // Redirect if unauthorized
    }
}

fetchUserData(); // Fetch user data when the page loads

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await fetch('/logout', { method: "POST" });
        window.location.href = "/login"; // Redirect to login page after logout
    });
} else {
    console.warn("Logout button not found");
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('expanded');
}



