"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "name", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Unnamed",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "name");
  },
};
