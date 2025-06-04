const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/auth");
const itemsRoutes = require("./routes/items");

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

app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);

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
