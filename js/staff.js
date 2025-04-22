// Show the modal with animation
function showAddProductModal() {
    const modal = document.getElementById("add-product-modal");
    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0", "scale-95");
        modal.classList.add("opacity-100", "scale-100"); // Ensure the modal scales properly
    }, 10); // Small delay to trigger transition
}

// Close the modal and add animation
function closeAddProductModal() {
    const modal = document.getElementById("add-product-modal");
    modal.classList.remove("opacity-100", "scale-100");
    modal.classList.add("opacity-0", "scale-95");

    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300); // Matches the transition duration
}

// Close modal when clicking outside of the modal box
document.getElementById("add-product-modal").addEventListener("click", function (event) {
    const modalBox = this.querySelector(".bg-white");
    if (modalBox && !modalBox.contains(event.target)) {
        closeAddProductModal();
    }
});

// Close modal when clicking the close button (&times;)
document.getElementById("close-modal-btn").addEventListener("click", function () {
    closeAddProductModal();
});

// Optional: Close modal on pressing Escape key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeAddProductModal();
    }
});
