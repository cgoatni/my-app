
document.addEventListener("DOMContentLoaded", () => {
    fetchMenuData();
    setupLogoutButton();
});

async function fetchMenuData() {
    try {
        const response = await fetch('/menu', { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch menu data");

        const menuItems = await response.json();
        const menuContainer = document.getElementById('menu-items');
        const mobileMenuContainer = document.getElementById('mobile-menu-items');

        menuContainer.innerHTML = '';
        mobileMenuContainer.innerHTML = '';

        const userResponse = await fetch('/api/user');
        const user = await userResponse.json();
        const userRole = user.role;

        menuItems.forEach(item => {
            const isLogout = item.name.toLowerCase() === 'logout';
            const isRoleAllowed = item.role.some(role => userRole === role);
            if (!isRoleAllowed) return;

            // Desktop menu
            const desktopLi = document.createElement('li');
            const desktopA = document.createElement('a');
            desktopA.classList.add('text-white', 'transition');
            desktopA.classList.add(isLogout ? 'hover:text-red-400' : 'hover:text-blue-900');
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
            mobileA.classList.add(isLogout ? 'hover:text-red-400' : 'hover:text-blue-900');
            mobileA.href = item.path || '#';
            if (item.id) mobileA.id = `${item.id}-mobile`;

            const mobileIcon = document.createElement('i');
            mobileIcon.className = item.icon;
            mobileA.appendChild(mobileIcon);
            mobileA.title = item.name; // Tooltip
            mobileLi.appendChild(mobileA);
            mobileMenuContainer.appendChild(mobileLi);

            if (isLogout) {
                desktopA.addEventListener("click", async (e) => {
                    e.preventDefault();
                    await logoutUser();
                });
                mobileA.addEventListener("click", async (e) => {
                    e.preventDefault();

                    await logoutUser();
                });
            }
        });

        setupLogoutButton();
    } catch (error) {
        console.error("Error fetching menu data:", error);
    }
}

function setupLogoutButton() {
    document.querySelectorAll("#logout-btn, .logout-btn").forEach(button => {
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

async function logoutUser() {
    try {
        await fetch("/logout", {
            method: "POST",
            credentials: "include"  // <- VERY important for session-based logout
        });
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

