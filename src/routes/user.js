// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/userController");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// Only super_admin and managers can add cashier/waiter
router.post(
  "/",
  authenticate,
  authorizeRoles("super_admin", "manager"),
  createUser
);
module.exports = router;
