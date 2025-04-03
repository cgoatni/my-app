document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const alertMessage = document.getElementById("alertMessage");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent form submission if validation fails
        
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            showAlert("Passwords do not match!", "red");
            return;
        }

        try {
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData.entries());

            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const result = await response.json();

            if (response.ok) {
                showAlert("Registration successful! Redirecting...", "green");
                setTimeout(() => window.location.href = "/login", 2000);
            } else {
                showAlert(result.error || "Registration failed", "red");
            }
        } catch (error) {
            console.error("Error:", error);
            showAlert("Something went wrong!", "red");
        }
    });

    function showAlert(message, color) {
        alertMessage.textContent = message;
        alertMessage.className = `alert text-white bg-${color}-500 p-3 rounded mt-2 text-center w-full`;
        alertMessage.classList.remove("hidden");
    }    
});

// Add event listener to hide icon when user starts typing
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

// Optional: You can add validation before submission
function validateForm() {
    var formElements = document.querySelectorAll('#registerForm input, #registerForm select, #registerForm textarea');
    for (var i = 0; i < formElements.length; i++) {
        if (formElements[i].value === "") {
            alert("Please fill out all fields.");
            return false;
        }
    }

    // Check if password and confirm password match
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return false;
    }

    // Check if terms checkbox is checked
    var terms = document.getElementById('terms');
    if (!terms.checked) {
        alert("You must agree to the terms and conditions.");
        return false;
    }

    return true;
}

function validateContactNumber() {
    var contactInput = document.getElementById("contact");
    var contactValue = contactInput.value;

    // Allow only digits and limit the length to 11
    contactInput.value = contactValue.replace(/\D/g, '').slice(0, 11);
}
