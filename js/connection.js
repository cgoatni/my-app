let isWebSocketActive = false;
let userDataInterval = setInterval(fetchUserData, 5000);

// Change the WebSocket URL to use wss:// if the page is served over HTTPS
const socketProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(`${socketProtocol}${window.location.host}`);

socket.addEventListener("message", async () => {
    await fetchUserData();
    if (!isWebSocketActive) {
        isWebSocketActive = true;
        clearInterval(userDataInterval);
    }
});

socket.addEventListener("open", () => console.log("WebSocket connection established."));
socket.addEventListener("close", () => {
    console.warn("WebSocket connection closed.");
    isWebSocketActive = false;
    userDataInterval = setInterval(fetchUserData, 5000);
});
socket.addEventListener("error", (err) => console.error("WebSocket error:", err));
