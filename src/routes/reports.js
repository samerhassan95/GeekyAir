const express = require("express");
const router = express.Router();
const {
  getWaiterCommissionReport,
} = require("../controllers/reportController");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

router.get(
  "/waiter-commission",
  authenticate,
  authorizeRoles(["super_admin", "manager", "cashier", "waiter"]),
  getWaiterCommissionReport
);

module.exports = router;
