const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Order extends Model {}

Order.init(
  {
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "delivered", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Order",
  }
);

module.exports = Order;
