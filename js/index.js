document.addEventListener("DOMContentLoaded", function () {
    // Form submission handling
    document.getElementById("contact-form").addEventListener("submit", async function (event) {
        event.preventDefault();  // Prevent default form submission

        const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            message: document.getElementById("message").value
        };

        try {
            const response = await fetch("/submit-contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showModal(result.message, "success");
                document.getElementById("contact-form").reset();  // Reset form on success
            } else {
                showModal(result.error, "error");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showModal("An error occurred. Please try again.", "error");
        }
    });

    // Function to show the modal
    function showModal(message, type) {
        const modal = document.getElementById("modal");
        const modalMessage = document.getElementById("modalMessage");

        modalMessage.textContent = message;

        // Toggle color based on type
        if (type === "success") {
            modalMessage.classList.remove("text-red-600");
            modalMessage.classList.add("text-green-600");
        } else {
            modalMessage.classList.remove("text-green-600");
            modalMessage.classList.add("text-red-600");
        }

        modal.classList.remove("hidden"); // Show the modal
    }

    // Close modal when clicking the close button
    document.getElementById("modalClose").addEventListener("click", function () {
        document.getElementById("modal").classList.add("hidden"); // Hide the modal
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            window.scrollTo({
                top: target.offsetTop,
                behavior: "smooth",
            });
        }
    });
});

