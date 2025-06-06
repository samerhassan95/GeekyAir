const { Order, OrderItem, Item, User } = require("../models");
const { faker } = require("@faker-js/faker");

async function createOrders(count = 50) {
  try {
    // Fetch some waiters (users with role 'waiter')
    const waiters = await User.findAll({ where: { role: "waiter" } });
    if (waiters.length === 0) {
      console.log("No waiters found. Please create waiters first.");
      return;
    }

    // Fetch all items
    const items = await Item.findAll();
    if (items.length === 0) {
      console.log("No items found. Please create items first.");
      return;
    }

    for (let i = 0; i < count; i++) {
      // Pick a random waiter
      const waiter = waiters[Math.floor(Math.random() * waiters.length)];

      // Create order
      const order = await Order.create({
        waiterId: waiter.id,
        status: "completed",
        createdAt: faker.date.between({
          from: new Date("2025-04-01"),
          to: new Date("2025-12-31"),
        }),
        updatedAt: new Date(),
      });

      // Pick 1-5 random items for the order
      const orderItemCount = Math.floor(Math.random() * 5) + 1;
      const chosenItems = faker.helpers.shuffle(items).slice(0, orderItemCount);

      // Create OrderItems
      for (const item of chosenItems) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        await OrderItem.create({
          orderId: order.id,
          itemId: item.id,
          quantity,
          priceAtOrder: item.price, // capture price at order time
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    console.log(`${count} orders created successfully.`);
  } catch (err) {
    console.error("Error creating orders:", err);
  }
}

createOrders(100); // Create 100 orders
