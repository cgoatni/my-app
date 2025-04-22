// ---------- Format number with commas and 2 decimal places ----------
function formatNumberWithCommas(number) {
    return parseFloat(number)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ---------- Add product to cart ----------
function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingProduct = cart.find(item => item._id === product._id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCart();
}

// ---------- Update cart items and total ----------
function updateCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    const totalPriceElement = document.getElementById("total-price");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    cartItemsContainer.innerHTML = '';  // Clear current cart items
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.classList.add("flex", "justify-between", "items-center");

        cartItem.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span>₱${formatNumberWithCommas(itemTotal)}</span>
            <button class="remove-item bg-red-500 text-white py-1 px-2 rounded-lg hover:bg-red-600" data-id="${item._id}">Remove</button>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    totalPriceElement.textContent = `₱${formatNumberWithCommas(total)}`;
}

// ---------- Remove item from cart ----------
function removeItemFromCart(itemId) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = cart.filter(item => item._id !== itemId);  // Filter out the item to be removed
    localStorage.setItem("cart", JSON.stringify(updatedCart));  // Update the cart in local storage
    updateCart();  // Re-render the cart with updated items
}

// ---------- Event listener for remove buttons ----------
document.addEventListener("DOMContentLoaded", () => {
    // Event delegation for remove buttons
    document.getElementById("cart-items").addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("remove-item")) {
            const itemId = event.target.getAttribute("data-id");
            removeItemFromCart(itemId);
        }
    });
});

// ---------- Show payment modal ----------
function showPaymentModal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // If total is zero, do not show the modal
    if (total === 0) {
        alert("No items in cart or total is zero.");
        return; // Exit the function
    }

    const modal = document.getElementById("payment-modal");
    const cashInput = document.getElementById("cash-input");
    const totalDisplay = document.getElementById("modal-total");

    totalDisplay.textContent = `₱${formatNumberWithCommas(total)}`;
    cashInput.value = "";
    document.getElementById("change-container").classList.add("hidden");

    modal.classList.remove("hidden");
}

// ---------- Hide payment modal ----------
function hidePaymentModal() {
    document.getElementById("payment-modal").classList.add("hidden");
}

// ---------- Confirm payment and calculate change ----------
function confirmPayment() {
    const cash = parseFloat(document.getElementById("cash-input").value);
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (isNaN(cash)) {
        alert("Please enter a valid cash amount.");
        return;
    }

    if (cash < total) {
        alert("Insufficient cash.");
        return;
    }

    const change = (cash - total).toFixed(2);

    // Hide the payment modal
    hidePaymentModal();

    // Show the alert message
    alert(`Payment successful!\nChange: ₱${formatNumberWithCommas(change)}`);

    // Clear cart and update UI
    localStorage.removeItem("cart");
    updateCart();
}

// ---------- Event listeners ----------
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("pay-button")?.addEventListener("click", showPaymentModal);
    document.getElementById("cancel-payment")?.addEventListener("click", hidePaymentModal);
    document.getElementById("confirm-payment")?.addEventListener("click", confirmPayment);
    updateCart(); // Initial load
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const paymentModal = document.getElementById("payment-modal");
      if (!paymentModal.classList.contains("hidden")) {
        hidePaymentModal(); // Uses your existing function
      }
    }
});

// Close the modal when clicking outside the content box
document.getElementById("payment-modal").addEventListener("click", function (event) {
    const modalBox = event.target.closest(".bg-white");
    if (!modalBox) {
      hidePaymentModal();
    }
});
