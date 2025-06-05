const { sequelize } = require("../models");
const { Op } = require("sequelize");
const { Parser } = require("json2csv");

const getWaiterCommissionReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      waiter,
      export: exportFlag,
      format,
    } = req.query;
    const user = req.user;

    const replacements = {
      startDate,
      endDate,
      namePattern: `%${waiter || ""}%`,
      userId: user.role === "waiter" ? user.id : null,
    };

    let whereUser = user.role === "waiter" ? "AND u.id = :userId" : "";
    let whereWaiter = waiter ? "AND u.name LIKE :namePattern" : "";

    const query = `
      SELECT 
        u.id AS waiterId,
        u.name AS waiterName,
        COUNT(oi.id) AS totalItemsSold,
        SUM(oi.priceAtOrder * oi.quantity) AS totalRevenue,
        SUM(CASE WHEN i.category = 'Food' THEN oi.priceAtOrder * oi.quantity * 0.01 ELSE 0 END) AS foodCommission,
        SUM(CASE WHEN i.category = 'Beverages' THEN oi.priceAtOrder * oi.quantity * 0.005 ELSE 0 END) AS beveragesCommission,
        SUM(CASE WHEN i.category NOT IN ('Food', 'Beverages') THEN oi.priceAtOrder * oi.quantity * 0.0025 ELSE 0 END) AS otherCommission,
        (
          SUM(CASE WHEN i.category = 'Food' THEN oi.priceAtOrder * oi.quantity * 0.01 ELSE 0 END) +
          SUM(CASE WHEN i.category = 'Beverages' THEN oi.priceAtOrder * oi.quantity * 0.005 ELSE 0 END) +
          SUM(CASE WHEN i.category NOT IN ('Food', 'Beverages') THEN oi.priceAtOrder * oi.quantity * 0.0025 ELSE 0 END)
        ) AS totalCommission
      FROM orders o
      JOIN users u ON u.id = o.waiterId
      JOIN order_items oi ON oi.orderId = o.id
      JOIN items i ON i.id = oi.itemId
      WHERE o.status = 'completed'
      AND o.createdAt BETWEEN :startDate AND :endDate
      ${whereUser}
      ${whereWaiter}
      GROUP BY u.id
      ORDER BY u.name ASC
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    if (exportFlag === "true" && format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(results);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=commission_report.csv`
      );
      return res.status(200).end(csv);
    }

    res.json({ data: results });
  } catch (err) {
    console.error("Commission report error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getWaiterCommissionReport };
