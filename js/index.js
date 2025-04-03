document.getElementById("contact-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        message: document.getElementById("message").value.trim()
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
            document.getElementById("contact-form").reset(); // Reset form on success
        } else {
            showModal(result.error, "error");
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        showModal("An error occurred. Please try again.", "error");
    }
});

// Show modal with message and type styling
function showModal(message, type) {
    const modal = document.getElementById("modal");
    const modalMessage = document.getElementById("modalMessage");
    const modalContent = document.getElementById("modalContent");

    modalMessage.textContent = message;

    modalMessage.classList.toggle("text-green-600", type === "success");
    modalMessage.classList.toggle("text-red-600", type !== "success");

    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.add("opacity-100");
        modalContent.classList.add("scale-100");
    }, 10);
}

// Close modal when clicking close button or outside modal
function closeModal() {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");

    modal.classList.remove("opacity-100");
    modalContent.classList.remove("scale-100");

    setTimeout(() => modal.classList.add("hidden"), 300); // Matches transition duration
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modal").addEventListener("click", (event) => {
    if (event.target === document.getElementById("modal")) closeModal();
});
