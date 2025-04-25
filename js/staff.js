// Preview product image before uploading
function previewProductImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("product-img");
    const errorMessage = document.getElementById("product-error-message");

    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.classList.remove("hidden");
            errorMessage.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add("hidden");
        errorMessage.classList.remove("hidden");
    }
}

document.getElementById("add-product-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form); // This includes all inputs and the file

    console.log("Form data being sent:", formData); // Debugging line

    for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    try {
        const response = await fetch('/add/product', {
            method: 'POST',
            body: formData, // Automatically sets 'multipart/form-data'
        });

        const result = await response.json();

        if (response.ok) {
            alert("Product added successfully!");
            form.reset(); // Optional: clear the form after submission
            document.getElementById("product-img").classList.add("hidden"); // Hide preview if needed

            location.reload(); // This will refresh the page
        } else {
            alert(result.error || "Something went wrong.");
        }
    } catch (err) {
        console.error("Error submitting form:", err);
    }
});

// Open the modal when the 'Add Product' button is clicked
document.getElementById("add-product-btn").addEventListener("click", function () {
    showAddProductModal();
});

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
