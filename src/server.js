const app = require("./app");

console.log("📦 server.js loaded");
const scheduleExpiryNotifications = require("../jobs/expiryNotifier");

// Call the scheduler
scheduleExpiryNotifications();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
