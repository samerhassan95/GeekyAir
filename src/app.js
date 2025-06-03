const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");

const app = express();
app.use(cors());
app.use(express.json());

sequelize
  .authenticate()
  .then(() => console.log("✅ DB connected successfully."))
  .catch((err) => console.error("❌ DB connection error:", err));

app.get("/", (req, res) => {
  res.send("Items & Orders API Running");
});

module.exports = app;
