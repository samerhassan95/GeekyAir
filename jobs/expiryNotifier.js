const cron = require("node-cron");
const Item = require("../src/models/Item");
const User = require("../src/models/User");
const { Op } = require("sequelize");
const sendEmail = require("../src/utils/email");

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
};

const formatItemsHtml = (items) => {
  return `
    <h3>Items Report</h3>
    <ul>
      ${items
        .map(
          (item) =>
            `<li><strong>${item.name}</strong> — Quantity: ${
              item.stock
            }, Expiry: ${formatDate(item.expiryDate)}</li>`
        )
        .join("")}
    </ul>
  `;
};

const scheduleExpiryNotifications = () => {
  // Runs every day at 08:00 AM server time
  cron.schedule("0 8 * * *", async () => {
    try {
      const today = new Date();
      const todayStart = new Date(
        today.toISOString().split("T")[0] + "T00:00:00.000Z"
      );
      const todayEnd = new Date(
        today.toISOString().split("T")[0] + "T23:59:59.999Z"
      );

      const fiveDaysLaterDate = new Date(today);
      fiveDaysLaterDate.setDate(today.getDate() + 5);
      const fiveDaysStart = new Date(
        fiveDaysLaterDate.toISOString().split("T")[0] + "T00:00:00.000Z"
      );
      const fiveDaysEnd = new Date(
        fiveDaysLaterDate.toISOString().split("T")[0] + "T23:59:59.999Z"
      );

      const [itemsIn5Days, itemsToday, unavailableItems, recipients] =
        await Promise.all([
          Item.findAll({
            where: {
              expiryDate: { [Op.between]: [fiveDaysStart, fiveDaysEnd] },
            },
          }),
          Item.findAll({
            where: { expiryDate: { [Op.between]: [todayStart, todayEnd] } },
          }),
          Item.findAll({
            where: { isAvailable: false },
          }),
          User.findAll({
            where: { role: { [Op.in]: ["super_admin", "manager"] } },
          }),
        ]);

      console.log("Items expiring in 5 days:", itemsIn5Days);
      console.log("Items expiring today:", itemsToday);
      console.log("Unavailable items:", unavailableItems);

      const emails = recipients.map((u) => u.email);

      if (itemsIn5Days.length) {
        console.log("📦 Sending 'Items Expiring in 5 Days' email to:", emails);
        await sendEmail(
          emails,
          "⏰ Items Expiring in 5 Days",
          formatItemsHtml(itemsIn5Days)
        );
      }

      if (itemsToday.length) {
        console.log("📦 Sending 'Items Expiring Today' email to:", emails);
        await sendEmail(
          emails,
          "⚠️ Items Expiring Today",
          formatItemsHtml(itemsToday)
        );
      }

      if (unavailableItems.length) {
        console.log("📦 Sending 'Unavailable Items Alert' email to:", emails);
        await sendEmail(
          emails,
          "❌ Unavailable Items Alert",
          formatItemsHtml(unavailableItems)
        );
      }
    } catch (error) {
      console.error("Error in expiry notification cron job:", error);
    }
  });
};

module.exports = scheduleExpiryNotifications;
