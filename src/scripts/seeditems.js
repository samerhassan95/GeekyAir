const { Item } = require("../models"); // adjust path if needed
const { faker } = require("@faker-js/faker");

async function createItems() {
  try {
    const items = [];
    for (let i = 0; i < 50; i++) {
      items.push({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.helpers.arrayElement(["Food", "Beverages", "Other"]),
        price: parseFloat(faker.commerce.price()),
        expiryDate: faker.date.future(),
        stock: faker.number.int({ min: 0, max: 100 }),
        isAvailable: faker.datatype.boolean(),
      });
    }

    await Item.bulkCreate(items);
    console.log("Items created successfully.");
  } catch (error) {
    console.error("Error creating items:", error);
  }
}

createItems();
