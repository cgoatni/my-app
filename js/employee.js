document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch('/logs'); // <-- updated to the filtered route
        const logs = await res.json();
        const tbody = document.getElementById('log-rows');
        tbody.innerHTML = '';

        logs.forEach(log => {
            const loginTime = new Date(log.loginTime);
            const logoutTime = log.logoutTime ? new Date(log.logoutTime) : null;

            const dateStr = loginTime.toISOString().split('T')[0];
            const inTimeStr = loginTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const outTimeStr = logoutTime ? logoutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
            const status = logoutTime ? 'Present' : 'Logged In';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-2">${dateStr}</td>
                <td class="px-4 py-2">${status}</td>
                <td class="px-4 py-2">${inTimeStr}</td>
                <td class="px-4 py-2">${outTimeStr}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error loading logs:", err);
    }
});