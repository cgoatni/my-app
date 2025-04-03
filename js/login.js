document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const alertMessage = document.getElementById("alertMessage");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // Show alert if an error exists in the URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
        showAlert(error, "red");
    }

    form.addEventListener("submit", (event) => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            event.preventDefault();
            showAlert("Email and password are required!", "red");
            return;
        }

        if (!validateEmail(email)) {
            event.preventDefault();
            showAlert("Invalid email format!", "yellow");
            return;
        }

        hideAlert(); // Hide alert if validation passes
    });

    function showAlert(message, color) {
        const colors = {
            red: "bg-red-500",
            yellow: "bg-yellow-500"
        };
        alertMessage.textContent = message;
        alertMessage.className = `text-white ${colors[color]} p-3 rounded mt-2 text-center w-full`;
        alertMessage.classList.remove("hidden");
    }

    function hideAlert() {
        alertMessage.classList.add("hidden");
    }

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Clear alert when user types
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener("input", hideAlert);
    });
});

// Function to change icon based on input field content
function updateIcon(field) {
    var inputElement = document.getElementById(field);
    var iconElement = document.getElementById(field + 'Icon');

    if (inputElement.value.trim() !== "") {
        iconElement.classList.remove("text-gray-400");
        iconElement.classList.add("text-green-500"); // Change icon color to green when filled
    } else {
        iconElement.classList.remove("text-green-500");
        iconElement.classList.add("text-gray-400"); // Revert icon color to gray when empty
    }
}

