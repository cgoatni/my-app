document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch('/logs');
        const logs = await res.json();
        console.log(logs);  // Log the logs data to check if 'name' is included
        
        const logRows = document.getElementById('log-rows');
        logRows.innerHTML = '';  // Clear existing content

        // Helper function for date formatting
        const formatDate = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Loop through each log and create a timeline item
        logs.forEach(log => {
            const name = log.name || 'N/A';  // Default to 'N/A' if name is not available
            const loginTime = new Date(log.loginTime);
            const logoutTime = log.logoutTime ? new Date(log.logoutTime) : null;

            const dateStr = formatDate(loginTime);
            const inTimeStr = formatTime(loginTime);
            const outTimeStr = logoutTime ? formatTime(logoutTime) : '-';
            const status = logoutTime ? 'Present' : 'Logged In';

            // Create the list item
            const li = document.createElement('li');
            li.classList.add('mb-10', 'ms-4');
            li.innerHTML = `
                <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">${dateStr}</time>
                <h3 class="text-lg font-semibold text-blue-600 dark:text-blue-400">Name: ${name}</h3>
                <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                    Status: ${status} <br>
                    In Time: ${inTimeStr}, Out Time: ${outTimeStr}
                </p>
            `;
            logRows.appendChild(li);
        });

    } catch (err) {
        console.error("Error loading logs:", err); // Improved error handling
    }
});
