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

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.classList.add("flex", "justify-between", "items-center");

        cartItem.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span>₱${formatNumberWithCommas(itemTotal)}</span>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    totalPriceElement.textContent = `₱${formatNumberWithCommas(total)}`;
}

// ---------- Show payment modal ----------
function showPaymentModal() {
    const modal = document.getElementById("payment-modal");
    const cashInput = document.getElementById("cash-input");
    const totalDisplay = document.getElementById("modal-total");
  
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;
    cart.forEach(item => total += item.price * item.quantity);
  
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

    let total = 0;
    cart.forEach(item => total += item.price * item.quantity);

    if (isNaN(cash)) {
        alert("Please enter a valid cash amount.");
        return;
    }

    if (cash < total) {
        alert("Insufficient cash.");
        return;
    }

    const change = (cash - total).toFixed(2);
    alert(`Payment successful!\nChange: ₱${formatNumberWithCommas(change)}`);

    // Clear cart and update UI
    localStorage.removeItem("cart");
    updateCart();
    hidePaymentModal();
}

// ---------- Event listeners ----------
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("pay-button")?.addEventListener("click", showPaymentModal);
    document.getElementById("cancel-payment")?.addEventListener("click", hidePaymentModal);
    document.getElementById("confirm-payment")?.addEventListener("click", confirmPayment);
    updateCart(); // Initial load
});
