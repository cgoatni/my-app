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
        console.log("Fetched products:", products);

        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        productCardsContainer.innerHTML = "<p class='text-center text-red-500'>Failed to load products.</p>";
    }
}

