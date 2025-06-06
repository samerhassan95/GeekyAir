// scripts/updateUserNames.js
const  User  = require("../models/User");
const sequelize = require("../config/database"); // adjust path to your Sequelize instance

const run = async () => {
  await sequelize.sync(); // or sequelize.authenticate() if already synced

  const users = await User.findAll();

  for (const user of users) {
    let generatedName = `User ${user.id}`; // or logic based on email, role, etc.

    // Example: Use email prefix as name
    if (user.email) {
      generatedName = user.email.split("@")[0];
    }

    await user.update({ name: generatedName });
    console.log(`Updated user ${user.id} with name: ${generatedName}`);
  }

  console.log("All existing user names updated.");
  process.exit();
};

run().catch((err) => {
  console.error("Failed to update users:", err);
  process.exit(1);
});
