const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/auth");
const itemsRoutes = require("./routes/items");
const orderRoutes = require("./routes/orders");
const reportRoutes = require("./routes/reports");
const itemCsvRoutes = require("./routes/itemCSV");

const app = express();
app.use(cors());
app.use(express.json());

sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ DB connected successfully."))
  .catch((err) => console.error("❌ DB connection error:", err));

const {
  authenticate,
  authorizeRoles,
} = require("./middlewares/authMiddleware");

app.get("/", (req, res) => {
  res.send("Items & Orders API Running");
});

app.use("/api/users", require("./routes/user"));

// Mount
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
// Mount the report routes under /api/reports
app.use("/api/reports", reportRoutes);

// Mount the item CSV import/export routes under /api/items
app.use("/api/items", itemCsvRoutes);

// Example of protected route:
app.get(
  "/api/admin-only",
  authenticate,
  authorizeRoles("super_admin", "manager"),
  (req, res) => {
    res.json({ message: "Welcome Admin/Manager!" });
  }
);

module.exports = app;
