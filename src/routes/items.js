const express = require("express");
const router = express.Router();
const { Op, literal } = require("sequelize");
const Item = require("../models/Item");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

// GET /items?category=&sortBy=&order=
router.get("/", authenticate, async (req, res) => {
  try {
    const { category, sortBy = "name", order = "ASC" } = req.query;
    const where = {};

    if (category) {
      where.category = category;
    }

    // Role-based filtering for waiter
    if (req.user.role === "waiter") {
      where[Op.or] = [
        { expiryDate: { [Op.gt]: new Date() } },
        { expiryDate: null },
      ];
    }

    let orderClause;

    if (sortBy === "totalStockValue") {
      orderClause = [[literal('"price" * "stock"'), order.toUpperCase()]];
    } else {
      orderClause = [[sortBy, order.toUpperCase()]];
    }

    const items = await Item.findAll({
      where,
      order: orderClause,
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /items/:id - get single item by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const item = await Item.findByPk(id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Optional: role-based restriction example (like in your list endpoint)
    if (req.user?.role === "waiter") {
      if (item.expiryDate && new Date(item.expiryDate) <= new Date()) {
        return res.status(403).json({ error: "Access denied to expired item" });
      }
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /items - add item (manager, superadmin)
router.post(
  "/",
  authenticate,
  authorizeRoles("manager", "super_admin"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        price,
        expiryDate,
        stock,
        isAvailable,
      } = req.body;

      if (!name || !category || price == null || stock == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newItem = await Item.create({
        name,
        description,
        category,
        price,
        expiryDate,
        stock,
        isAvailable,
      });

      res.status(201).json(newItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// PUT /items/:id - edit item (manager, superadmin)
router.put(
  "/:id",
  authenticate,
  authorizeRoles("manager", "super_admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const item = await Item.findByPk(id);
      if (!item) return res.status(404).json({ error: "Item not found" });

      const updates = req.body;
      await item.update(updates);

      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// DELETE /items/:id - delete item (manager, superadmin)
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("manager", "super_admin"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const item = await Item.findByPk(id);
      if (!item) return res.status(404).json({ error: "Item not found" });

      await item.destroy();
      res.json({ message: "Item deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
