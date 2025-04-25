document.addEventListener("DOMContentLoaded", () => {
  fetch("/get/receipts")
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById("sales-report-body");
      let totalProductsSold = 0;
      let totalSales = 0;
      let totalSalesForDay = 0; // To track total sales for today

      const productStats = {};

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

      data.forEach(receipt => {
        // Filter receipts by today's date
        const receiptDate = new Date(receipt.date).toISOString().split('T')[0]; // 'YYYY-MM-DD'

        if (receiptDate === today) {
          // Accumulate sales for today
          (receipt.items || []).forEach(item => {
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

            // Accumulate total sales for today
            totalSalesForDay += item.price * item.quantity;
          });
        }

        // Accumulate total sales and product stats for all data
        (receipt.items || []).forEach(item => {
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
          productStats[item.name].price = item.price;

          totalProductsSold += item.quantity;
          totalSales += item.price * item.quantity;
        });
      });

      Object.entries(productStats).forEach(([name, stat]) => {
        const total = stat.quantity * stat.price;
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
      document.getElementById("current-sales").textContent = `₱${(totalSalesForDay || 0).toFixed(2)}`; // Display today's total sales
      document.getElementById("total-sales").textContent = `₱${(totalSales || 0).toFixed(2)}`;
    })
    .catch(err => {
      console.error("Error loading data:", err);
      document.getElementById("sales-report-body").innerHTML = `
        <tr><td colspan="4" class="text-center py-4 text-red-600">Failed to load report data.</td></tr>
      `;
    });
});


// sorting
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("th").forEach(header => {
    header.addEventListener("click", () => {
      const table = header.closest("table");
      const tbody = table.querySelector("tbody");
      const index = [...header.parentNode.children].indexOf(header);
      const isAsc = !header.classList.contains("asc");

      // Clear other headers' classes
      header.parentNode.querySelectorAll("th").forEach(th => th.classList.remove("asc", "desc"));
      header.classList.add(isAsc ? "asc" : "desc");

      // Sort rows
      const rows = Array.from(tbody.querySelectorAll("tr"));
      rows.sort((a, b) => {
        const cellA = a.children[index].textContent.trim().replace("₱", "");
        const cellB = b.children[index].textContent.trim().replace("₱", "");
        const isNumeric = !isNaN(parseFloat(cellA)) && !isNaN(parseFloat(cellB));

        return (isNumeric
          ? parseFloat(cellA) - parseFloat(cellB)
          : cellA.localeCompare(cellB)) * (isAsc ? 1 : -1);
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  });
});

  