const sequelize = require("../config/database");

const User = require("./User");
const Item = require("./Item");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// User ↔ Orders
User.hasMany(Order, { foreignKey: "waiterId", as: "orders" });
Order.belongsTo(User, { foreignKey: "waiterId", as: "waiter" });

// Order ↔ OrderItem
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "orderItems" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// OrderItem ↔ Item
OrderItem.belongsTo(Item, {
  foreignKey: "itemId",
  as: "item",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Item.hasMany(OrderItem, { foreignKey: "itemId", as: "orderItems" });

module.exports = { sequelize, User, Item, Order, OrderItem };
