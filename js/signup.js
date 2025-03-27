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
