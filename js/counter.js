// ---------- Format number with commas and 2 decimal places ----------
function formatNumberWithCommas(number) {
    return parseFloat(number)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ---------- Calculate the change ----------
function calculateChange() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0); // Dynamically calculate total

    let cashEntered = document.getElementById('cash-input').value.replace(/[^0-9.]/g, ''); // Clean input (remove non-numeric)

    // Default to '0.00' if the field is empty
    if (cashEntered === '') {
        cashEntered = '0.00';
    }

    // Remove the ₱ sign and commas, then parse as a float
    let cash = parseFloat(cashEntered.replace('₱', '').replace(',', ''));

    // If cash is not a valid number, set it to 0
    if (isNaN(cash)) {
        cash = 0;
    }

    const change = cash - totalAmount;

    // If the change is positive or zero, show the amount; otherwise hide the change container
    if (change >= 0) {
        document.getElementById('change-amount').textContent = '₱' + formatNumberWithCommas(change);
        document.getElementById('change-container').style.display = 'flex'; // Show the change container
    } else {
        document.getElementById('change-amount').textContent = '₱0.00';
        document.getElementById('change-container').style.display = 'none';  // Hide the change container
    }
}

// ---------- Event listener to trigger on input change ----------
document.getElementById('cash-input').addEventListener('input', function() {
    let cashEntered = this.value;

    // Remove any non-numeric characters except the decimal point
    cashEntered = cashEntered.replace(/[^0-9.]/g, ''); 

    // Ensure only one decimal point is allowed
    const decimalIndex = cashEntered.indexOf('.');
    if (decimalIndex !== -1) {
        // Keep only the first decimal point and limit to 2 decimal places
        cashEntered = cashEntered.substring(0, decimalIndex + 3); // Limit to two decimals
    }

    // Update the input field with the cleaned value
    this.value = cashEntered;

    // Recalculate change as the user types
    calculateChange();
});

// ---------- Event listener for when the input field loses focus (blur) ----------
document.getElementById('cash-input').addEventListener('blur', function() {
    let cashEntered = this.value;

    // If no decimal is present, append '.00'
    if (!cashEntered.includes('.') && cashEntered !== '') {
        this.value = cashEntered + '.00';
    }

    // Recalculate change when the input loses focus
    calculateChange();
});

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

function confirmPayment() {
    const cashInput = document.getElementById("cash-input");
    const cash = parseFloat(cashInput.value);
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

    const change = parseFloat((cash - total).toFixed(2));

    const fullNameElement = document.getElementById("fullName");
    const user = fullNameElement?.textContent || "Unknown";
  
    const receiptData = {
      user,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total,
      cash,
      change,
      date: new Date().toISOString()
    };

    // Send to backend (POST to /receipt)
    fetch('/insert/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
    })
    .then(response => response.json())
    .then(data => {
        // Hide payment modal
        hidePaymentModal();

        // Show success alert with change
        alert(`Payment successful!\nChange: ₱${formatNumberWithCommas(change)}`);

        // Clear cart and update UI
        localStorage.removeItem("cart");
        updateCart();
    })
    .catch(error => {
        console.error("Error sending receipt:", error);
        alert("An error occurred while processing the payment.");
    });
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
