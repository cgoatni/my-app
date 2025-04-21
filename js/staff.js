// Handle Add Product form submission
document.getElementById("add-product-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting traditionally

    // Gather form data
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get("name"),
        price: parseFloat(formData.get("price")),
        description: formData.get("description"),
        quantity: parseInt(formData.get("quantity")),
        category: formData.get("category"),
    };

    console.log("Product data:", productData);

    // Handle image
    const imageFile = formData.get("image");
    if (imageFile && imageFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Convert image to Base64
            productData.image = e.target.result;
            // Make API call to add the product
            addProductToDatabase(productData);
        };
        reader.readAsDataURL(imageFile);
    } else {
        // No image, send data without image
        addProductToDatabase(productData);
    }
});

// Function to make the API call to add the product
function addProductToDatabase(productData) {
    fetch("http://localhost:3000/add/product", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Product added successfully!");
            // Optionally, refresh the product list or close modal
            displayProducts(data.products); // Assuming API returns updated list of products
            closeAddProductModal(); // Close the modal
        } else {
            console.error("Failed to add product:", data.message);
            alert("Failed to add product.");
        }
    })
    .catch(error => {
        console.error("Error adding product:", error);
        alert("An error occurred while adding the product.");
    });
}

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
