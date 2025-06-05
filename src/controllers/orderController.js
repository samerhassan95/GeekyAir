const { User, Order, OrderItem, Item, sequelize } = require("../models");
const { Op } = require("sequelize");

// Helper: Calculate total cost of order
const calculateTotalCost = (orderItems) => {
  return orderItems.reduce(
    (total, oi) => total + oi.priceAtOrder * oi.quantity,
    0
  );
};

module.exports = {
  // Create new order (cashier role)
  createOrder: async (req, res) => {
    try {
      const { items, waiterId } = req.body;
      if (!items || items.length === 0)
        return res.status(400).json({ message: "No items provided." });

      const waiter = await User.findByPk(waiterId);
      if (!waiter) return res.status(404).json({ message: "Waiter not found" });

      const itemIds = items.map((i) => i.itemId);
      const foundItems = await Item.findAll({
        where: {
          id: { [Op.in]: itemIds },
          isAvailable: true,
          expiryDate: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      });

      if (foundItems.length !== items.length)
        return res
          .status(400)
          .json({ message: "Some items are expired or unavailable." });

      const result = await sequelize.transaction(async (t) => {
        const order = await Order.create(
          { waiterId, status: "pending" },
          { transaction: t }
        );

        const orderItemsData = items.map((i) => {
          const foundItem = foundItems.find((fi) => fi.id === i.itemId);
          return {
            orderId: order.id,
            itemId: i.itemId,
            quantity: i.quantity,
            priceAtOrder: foundItem.price,
          };
        });

        await OrderItem.bulkCreate(orderItemsData, { transaction: t });

        const totalCost = calculateTotalCost(orderItemsData);
        order.totalCost = totalCost;
        await order.save({ transaction: t });

        return order;
      });

      res.status(201).json({ message: "Order created", order: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get all orders (admins/managers) or own orders (waiters)
  getOrders: async (req, res) => {
    try {
      const user = req.user;

      let whereClause = {};
      if (user.role === "waiter") {
        whereClause.waiterId = user.id;
      }

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: "orderItems",
            include: [
              {
                model: Item,
                as: "item",
              },
            ],
          },
          {
            model: User,
            as: "waiter",
            attributes: ["id", "email", "role"],
          },
        ],
      });

      res.json({ orders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Update order status (e.g. mark completed)
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findByPk(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const validStatuses = ["pending", "completed", "expired"];
      if (!validStatuses.includes(status))
        return res.status(400).json({ message: "Invalid status" });

      order.status = status;
      await order.save();

      res.json({ message: "Order status updated", order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Add or remove items to an existing order (only pending orders)
  updateOrderItems: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { items } = req.body;

      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "orderItems" }],
      });
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.status !== "pending")
        return res
          .status(400)
          .json({ message: "Cannot modify non-pending orders" });

      const itemIds = items.map((i) => i.itemId);
      const foundItems = await Item.findAll({
        where: {
          id: { [Op.in]: itemIds },
          isAvailable: true,
          expiryDate: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      });
      if (foundItems.length !== items.length)
        return res
          .status(400)
          .json({ message: "Some items are expired or unavailable." });

      await sequelize.transaction(async (t) => {
        await OrderItem.destroy({ where: { orderId }, transaction: t });

        const orderItemsData = items.map((i) => {
          const foundItem = foundItems.find((fi) => fi.id === i.itemId);
          return {
            orderId: order.id,
            itemId: i.itemId,
            quantity: i.quantity,
            priceAtOrder: foundItem.price,
          };
        });

        await OrderItem.bulkCreate(orderItemsData, { transaction: t });

        const totalCost = calculateTotalCost(orderItemsData);
        order.totalCost = totalCost;
        await order.save({ transaction: t });
      });

      res.json({ message: "Order items updated", order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
