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
            fullNameElement.textContent = user.lastName + " " + user.firstName || "Guest";
        }
        console.log("User data:", user.role.toLowerCase()); // Debugging line to check the response    

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
