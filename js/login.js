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

    // Form submission handler
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

    // Show alert with a specific message and color
    function showAlert(message, color) {
        const colors = {
            red: "bg-red-500",
            yellow: "bg-yellow-500"
        };
        alertMessage.textContent = message;
        alertMessage.className = `text-white ${colors[color]} p-3 rounded mt-2 text-center w-full`;
        alertMessage.classList.remove("hidden");
    }

    // Hide the alert message
    function hideAlert() {
        alertMessage.classList.add("hidden");
    }

    // Validate email format
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Clear alert when user types in the input fields
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener("input", hideAlert);
    });
});

// Update the icon color based on input field content
function updateIcon(field) {
    const inputElement = document.getElementById(field);
    const iconElement = document.getElementById(`${field}Icon`);

    if (inputElement.value.trim() !== "") {
        iconElement.classList.remove("text-gray-400");
        iconElement.classList.add("text-green-500"); // Change icon color to green when filled
    } else {
        iconElement.classList.remove("text-green-500");
        iconElement.classList.add("text-gray-400"); // Revert icon color to gray when empty
    }
}

