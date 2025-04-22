document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
});

// ================== PRODUCT FUNCTIONS ==================
// Fetch products from the server
async function fetchProducts(category = "") {
    const productCardsContainer = document.getElementById("product-cards");

    // Check if the container exists
    if (!productCardsContainer) {
        console.error("Error: Element with id 'product-cards' not found.");
        return;
    }

    productCardsContainer.innerHTML = "<p class='text-center text-gray-500'>Loading products...</p>";

    try {
        const url = category ? `/products?category=${encodeURIComponent(category)}` : "/products";
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const products = await response.json();

        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        productCardsContainer.innerHTML = "<p class='text-center text-red-500'>Failed to load products.</p>";
    }
}

// Display products in the UI
function displayProducts(products) {
    const productCardsContainer = document.getElementById("product-cards");

    // Check if the container exists
    if (!productCardsContainer) {
        console.error("Error: Element with id 'product-cards' not found.");
        return;
    }

    productCardsContainer.innerHTML = "";

    if (!products?.length) {
        productCardsContainer.innerHTML = "<p class='text-center text-gray-500'>No products found.</p>";
        return;
    }

    products.forEach(product => {
        const productCard = createProductCard(product);
        productCardsContainer.appendChild(productCard);
    });
}

// Create a product card element
function createProductCard(product) {
    const card = document.createElement("div");
    card.classList.add("bg-white", "p-4", "rounded-lg", "shadow-md", "cursor-pointer");

    // Product Image
    const productImage = document.createElement("img");
    productImage.src = product.image;
    productImage.alt = product.name;
    productImage.classList.add("w-full", "h-40", "object-cover", "rounded-md");

    // Product Details
    const productDetails = document.createElement("div");
    productDetails.classList.add("mt-4");

    const productName = document.createElement("h3");
    productName.classList.add("font-semibold", "text-lg", "text-gray-700");
    productName.textContent = product.name;

    // Price and Quantity Section
    const priceAndQuantity = document.createElement("div");
    priceAndQuantity.classList.add("flex", "justify-between", "items-center");

    const price = document.createElement("p");
    price.classList.add("text-sm", "text-gray-500");
    price.textContent = `₱${product.price}`;

    const quantity = document.createElement("p");
    quantity.classList.add("text-sm", "font-semibold", "text-gray-800");
    quantity.textContent = `Qty: ${product.quantity}`;

    // Category and Delete Button Section
    const catAndbtn = document.createElement("div");
    catAndbtn.classList.add("flex", "justify-between", "items-center", "mt-2");

    const category = document.createElement("p");
    category.classList.add("text-sm", "text-gray-500");
    category.textContent = product.category;

    // Delete Button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("text-red-500", "bg-white", "hover:bg-red-100", "border", "border-red-500", "rounded", "px-3", "py-1", "text-xs");
    deleteButton.textContent = "Delete";

    // Delete Button Event Listener (Staff URL for deleting)
    deleteButton.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent the card click event
    
        if (!product._id) {
            alert("Product ID is missing.");
            return;
        }
    
        // Construct the delete URL using _id or $oid
        const productId = product._id.$oid || product._id; // Check if _id is in { "$oid": "someId" } format
        const deleteUrl = `/delete/product/${productId}`;

        // Call delete function (replace with actual URL for deletion)
        fetch(deleteUrl, { method: "DELETE" })
            .then(response => {
                if (response.ok) {
                    card.remove(); // Remove the card from UI
                    alert("Product deleted successfully!");
                } else {
                    response.json().then(data => alert(data.error || "Failed to delete product."));
                }
            })
            .catch(error => {
                alert("An error occurred while deleting the product.");
            });
    });

    // Appending elements to their respective containers
    priceAndQuantity.append(price, quantity);
    productDetails.append(productName, priceAndQuantity);
    catAndbtn.append(category, deleteButton);
    productDetails.append(catAndbtn);
    
    // Append all to the card
    card.append(productImage, productDetails);

    // Add event listener for modal interaction
    card.addEventListener("click", () => showModal(product));

    return card;
}

// Show product details in a modal with fade-in effect
function showModal(product) {
    const modal = document.getElementById("product-modal");
    const modalContent = document.getElementById("modal-content");

    if (!modal || !modalContent) {
        console.error("Error: Modal elements not found.");
        return;
    }

    modalContent.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4">${product.name}</h2>
        <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-cover rounded-md mb-4" />
        <p class="text-gray-700 mb-2">${product.description}</p>
        <p class="text-xl font-semibold text-gray-800">₱${product.price}</p>
        <p class="text-gray-500 mt-4">Category: ${product.category}</p>
    `;

    // Remove hidden class and apply fade-in
    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0", "scale-95");
        modal.classList.add("opacity-100", "scale-100");
    }, 10); // Small delay to trigger transition
}

// Close the modal with fade-out effect
function closeModal() {
    const modal = document.getElementById("product-modal");
    if (modal) {
        modal.classList.remove("opacity-100", "scale-100"); // Fade-out effect
        modal.classList.add("opacity-0", "scale-95");

        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300); // Matches the transition duration
    }
}

// Close modal when clicking outside of the modal box
document.getElementById("product-modal").addEventListener("click", function (event) {
    const modalBox = this.querySelector(".modal-box");
    if (modalBox && !modalBox.contains(event.target)) {
        closeModal();
    }
});

// Optional: Close modal on pressing Escape key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal();
    }
});