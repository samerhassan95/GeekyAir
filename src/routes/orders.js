// src/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// All routes require authentication first
router.use(authenticate);

// Create order — only cashier role
router.post(
  "/",
  authorizeRoles("cashier", "super_admin", "manager"),
  orderController.createOrder
);

// Get orders — super_admin, manager, cashier get all; waiter gets own orders inside controller
router.get(
  "/",
  authorizeRoles("super_admin", "manager", "cashier", "waiter"),
  orderController.getOrders
);

// Update order status — super_admin, manager, cashier only
router.patch(
  "/:orderId/status",
  authorizeRoles("super_admin", "manager", "cashier"),
  orderController.updateOrderStatus
);

// Update order items — cashier only
router.put(
  "/:orderId/items",
  authorizeRoles("cashier"),
  orderController.updateOrderItems
);

module.exports = router;
