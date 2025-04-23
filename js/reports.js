document.addEventListener("DOMContentLoaded", () => {
    fetch("/get/receipts")
      .then(response => response.json())
      .then(data => {
        const tbody = document.getElementById("sales-report-body");
        let totalProductsSold = 0;
        let totalSales = 0;
        const users = new Set();
  
        const productStats = {};
  
        data.forEach(receipt => {
          if (receipt.user) users.add(receipt.user);
  
          (receipt.items || []).forEach(item => {
            // Ensure price and quantity are valid numbers
            if (!item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
              console.warn("Invalid item data, skipping:", item);
              return;
            }
  
            if (!productStats[item.name]) {
              productStats[item.name] = {
                quantity: 0,
                price: item.price
              };
            }
  
            productStats[item.name].quantity += item.quantity;
  
            // Optionally update price if needed
            productStats[item.name].price = item.price;
          });
        });
  
        Object.entries(productStats).forEach(([name, stat]) => {
          const total = stat.quantity * stat.price;
          totalProductsSold += stat.quantity;
          totalSales += total;
  
          const row = `
            <tr class="bg-white border-b">
              <td class="px-6 py-4 font-medium text-gray-900">${name}</td>
              <td class="px-6 py-4">${stat.quantity}</td>
              <td class="px-6 py-4">₱${stat.price.toFixed(2)}</td>
              <td class="px-6 py-4 font-semibold text-green-600">₱${total.toFixed(2)}</td>
            </tr>
          `;
          tbody.insertAdjacentHTML("beforeend", row);
        });
  
        // Update summary cards
        document.getElementById("total-products").textContent = totalProductsSold || 0;
        document.getElementById("unique-users").textContent = users.size || 0;
        document.getElementById("total-sales").textContent = `₱${(totalSales || 0).toFixed(2)}`;

      })
      .catch(err => {
        console.error("Error loading data:", err);
        document.getElementById("sales-report-body").innerHTML = `
          <tr><td colspan="4" class="text-center py-4 text-red-600">Failed to load report data.</td></tr>
        `;
      });
  });
  