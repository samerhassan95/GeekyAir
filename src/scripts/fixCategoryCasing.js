const { sequelize, Item } = require("../models");

async function fixCategoryCasing() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const [results, metadata] = await sequelize.query(`
      UPDATE "Items"
      SET "category" = INITCAP("category")
      WHERE "category" IN ('food', 'beverages', 'other');
    `);

    console.log("✅ Categories updated to proper casing for ENUM compatibility");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to update categories:", error);
    process.exit(1);
  }
}

fixCategoryCasing();
