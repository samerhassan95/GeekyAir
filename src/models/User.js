const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("super_admin", "manager", "cashier", "waiter"),
      defaultValue: "waiter",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationToken: {
      type: DataTypes.STRING,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
