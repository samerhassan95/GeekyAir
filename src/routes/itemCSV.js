const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  importItemsCSV,
  exportItemsCSV,
} = require("../controllers/itemCsvController");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

router.post(
  "/import-csv",
  authenticate,
  authorizeRoles("super_admin", "manager"),
  upload.single("file"),
  importItemsCSV
);
router.get(
  "/export-csv",
  authenticate,
  authorizeRoles("super_admin", "manager"),
  exportItemsCSV
);

module.exports = router;
