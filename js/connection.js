let isWebSocketActive = false;
let userDataInterval = setInterval(fetchUserData, 5000);

// Determine WebSocket protocol based on the current page protocol
const socketProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const socketUrl = `${socketProtocol}${window.location.host}`;
let socket;

// Function to initialize WebSocket connection
function initializeWebSocket() {
    socket = new WebSocket(socketUrl);

    // Handle incoming messages
    socket.addEventListener("message", async () => {
        await fetchUserData();
        if (!isWebSocketActive) {
            isWebSocketActive = true;
            clearInterval(userDataInterval);
        }
    });

    // Handle WebSocket open event
    socket.addEventListener("open", () => {
        console.log("WebSocket connection established.");
        isWebSocketActive = true;
    });

    // Handle WebSocket close event
    socket.addEventListener("close", () => {
        console.warn("WebSocket connection closed. Retrying in 5 seconds...");
        isWebSocketActive = false;
        userDataInterval = setInterval(fetchUserData, 5000);
        setTimeout(initializeWebSocket, 5000); // Retry connection after 5 seconds
    });

    // Handle WebSocket error event
    socket.addEventListener("error", (err) => {
        console.error("WebSocket error:", err);
        socket.close(); // Close the socket on error to trigger reconnection
    });
}

// Start WebSocket connection
initializeWebSocket();
