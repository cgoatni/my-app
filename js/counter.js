// Example function for adding product to the cart
function addToCart(product) {

    // Retrieve existing cart items from localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Check if the product is already in the cart
    const existingProduct = cart.find(item => item._id === product._id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        // Add product to the cart with quantity of 1
        cart.push({ ...product, quantity: 1 });
    }

    // Save the updated cart back to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update the cart display
    updateCart();
}
// Example function for adding product to the cart
function addToCart(product) {

    // Retrieve existing cart items from localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Check if the product is already in the cart
    const existingProduct = cart.find(item => item._id === product._id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        // Add product to the cart with quantity of 1
        cart.push({ ...product, quantity: 1 });
    }

    // Save the updated cart back to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update the cart display
    updateCart();
}

// Function to format numbers with commas
function formatNumberWithCommas(number) {
    return number.toLocaleString(); // This will format the number with commas
}

// Function to update the cart items and total price
function updateCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");

    // Retrieve the cart items from localStorage
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Clear the current cart display
    cartItemsContainer.innerHTML = '';

    let totalPrice = 0;
    cart.forEach(item => {
        // Create the cart item display
        const cartItem = document.createElement('div');
        cartItem.classList.add("flex", "justify-between", "items-center");

        cartItem.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span>₱${formatNumberWithCommas(item.price * item.quantity)}</span>
        `;

        // Append the cart item to the cart container
        cartItemsContainer.appendChild(cartItem);

        // Update the total price
        totalPrice += item.price * item.quantity;
    });

    // Update the total price in the UI with commas
    totalPriceElement.textContent = `₱${formatNumberWithCommas(totalPrice.toFixed(2))}`;

    // Enable the Pay Now button if there are items in the cart
    const payButton = document.getElementById("pay-button");
    payButton.disabled = cart.length === 0;
}

// Event listener for Pay button
document.getElementById("pay-button").addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("Your cart is empty.");
    } else {
        // Placeholder for payment logic
        alert("Proceeding to payment...");
        // Clear cart after payment (optional)
        localStorage.removeItem("cart");
        updateCart();
    }
});

// Load cart from localStorage on page load
window.addEventListener('load', updateCart);
