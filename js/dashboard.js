document.addEventListener("DOMContentLoaded", () => {
    fetchDashboardData();
    fetchUserList();
});

async function fetchDashboardData() {
    try {
        const [userResponse, activeUsersResponse] = await Promise.all([
            fetch("/count"),
            fetch("/activeUsers")
        ]);
        if (!userResponse.ok || !activeUsersResponse.ok) throw new Error("Failed to fetch dashboard data");

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

async function fetchUserList() {
    try {
        const response = await fetch('/users');
        if (!response.ok) throw new Error("Failed to fetch user list");

        const users = await response.json();
        const userListContainer = document.getElementById('userList');
        userListContainer.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2 border">${user.lastName + ' ' + user.firstName}</td>
                <td class="px-4 py-2 border">${user.email}</td>
                <td class="px-4 py-2 border">${user.role}</td>
                <td class="px-4 py-2 border space-x-2">
                    <button onclick="editUser('${user._id}')" class="bg-green-400 text-white px-3 py-1 rounded hover:bg-green-500 transition">Update</button>
                    <button onclick="deleteUser('${user._id}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Delete</button>
                </td>
            `;
            userListContainer.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching user list:", error);
        document.getElementById('userList').innerHTML = '<tr><td colspan="4" class="text-center text-red-500">Failed to load users</td></tr>';
    }
}

document.addEventListener("DOMContentLoaded", fetchUserList);

function openModal(user = null) {
    const modal = document.getElementById("userModal");
    const modalTitle = document.getElementById("modalTitle");
    const submitBtn = document.getElementById("submitBtn");

    if (user) {
        modalTitle.innerText = "Update User";
        submitBtn.innerText = "Update User";

        document.getElementById("firstName").value = user.firstName;
        document.getElementById("lastName").value = user.lastName;
        document.getElementById("email").value = user.email;
        document.getElementById("contact").value = user.contact;
        document.getElementById("address").value = user.address;
        document.getElementById("gender").value = user.gender;
        document.getElementById("dob").value = user.dob;
        document.getElementById("role").value = user.role;
        document.getElementById("username").value = user.username;
        document.getElementById("password").value = user.password;
        document.getElementById("confirmPassword").value = user.password;

        document.getElementById("userForm").dataset.userId = user.userId;
    } else {
        modalTitle.innerText = "Add User";
        submitBtn.innerText = "Add User";

        document.getElementById("userForm").reset();
        delete document.getElementById("userForm").dataset.userId;
    }

    modal.classList.remove("hidden");
    setTimeout(() => document.getElementById("modal-content").classList.remove("opacity-0"), 50);
}

function closeModal() {
    document.getElementById("userModal").classList.add("hidden");
}

function submitForm(event) {
    event.preventDefault();

    const form = document.getElementById("userForm");
    const formData = new FormData(form);
    const userId = form.dataset.userId;

    const data = Object.fromEntries(formData);
    if (userId) data.userId = userId;

    fetch(userId ? '/update-user' : '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(() => {
        closeModal();
        fetchUserList();
    })
    .catch(error => console.error("Error:", error));
}

function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
    else console.warn(`Element with ID '${elementId}' not found.`);
}
