const cron = require("node-cron");
const { Order } = require("../src/models"); // Make sure it's from initialized models
const { Op } = require("sequelize");

const expirePendingOrders = async () => {
  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    // Step 1: Find orders to expire
    const pendingOrders = await Order.findAll({
      where: {
        status: "pending",
        createdAt: { [Op.lte]: fourHoursAgo },
      },
    });

    // Step 2: Loop through and update each, logging the ID
    for (const order of pendingOrders) {
      order.status = "expired";
      await order.save();
      console.log(`[CRON] Order ID ${order.id} marked as expired.`);
    }

    if (pendingOrders.length === 0) {
      console.log("[CRON] No pending orders to expire at this minute.");
    }
  } catch (err) {
    console.error("[CRON ERROR] Failed to expire pending orders:", err);
  }
};

// Runs every minute for testing
const startOrderExpirationJob = () => {
  cron.schedule("*/10 * * * *", expirePendingOrders);
};

module.exports = startOrderExpirationJob;
