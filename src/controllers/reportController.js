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

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required." });
    }

    const replacements = {
      startDate,
      endDate,
      namePattern: `%${waiter || ""}%`,
      userId: user.role === "waiter" ? user.id : null,
    };

    const whereUser = user.role === "waiter" ? "AND u.id = :userId" : "";
    const whereWaiter = waiter ? "AND u.name ILIKE :namePattern" : "";

    const query = `
      SELECT 
        u.id AS "waiterId",
        u.name AS "waiterName",
        COUNT(oi.id) AS "totalItemsSold",
        SUM(oi."priceAtOrder" * oi.quantity) AS "totalRevenue",

        SUM(CASE WHEN i.category = 'Food' THEN oi."priceAtOrder" * oi.quantity * 0.01 ELSE 0 END) AS "foodCommission",
        SUM(CASE WHEN i.category = 'Beverages' THEN oi."priceAtOrder" * oi.quantity * 0.005 ELSE 0 END) AS "beveragesCommission",
        SUM(CASE WHEN i.category NOT IN ('Food', 'Beverages') THEN oi."priceAtOrder" * oi.quantity * 0.0025 ELSE 0 END) AS "otherCommission",

        (
          SUM(CASE WHEN i.category = 'Food' THEN oi."priceAtOrder" * oi.quantity * 0.01 ELSE 0 END) +
          SUM(CASE WHEN i.category = 'Beverages' THEN oi."priceAtOrder" * oi.quantity * 0.005 ELSE 0 END) +
          SUM(CASE WHEN i.category NOT IN ('Food', 'Beverages') THEN oi."priceAtOrder" * oi.quantity * 0.0025 ELSE 0 END)
        ) AS "totalCommission"

      FROM orders o
      JOIN users u ON u.id = o."waiterId"
      JOIN order_items oi ON oi."orderId" = o.id
      JOIN "Items" i ON i.id = oi."itemId"

      WHERE o.status = 'completed'
        AND o."createdAt" BETWEEN :startDate AND :endDate
        ${whereUser}
        ${whereWaiter}

      GROUP BY u.id
      ORDER BY u.name ASC;
    `;

    let results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    // Format numbers to 2 decimal places
    results = results.map((r) => ({
      ...r,
      totalRevenue: Number(r.totalRevenue || 0).toFixed(2),
      foodCommission: Number(r.foodCommission || 0).toFixed(2),
      beveragesCommission: Number(r.beveragesCommission || 0).toFixed(2),
      otherCommission: Number(r.otherCommission || 0).toFixed(2),
      totalCommission: Number(r.totalCommission || 0).toFixed(2),
    }));

    // If CSV export requested
    if (exportFlag === "true" && format === "csv") {
      const fields = [
        "waiterId",
        "waiterName",
        "totalItemsSold",
        "totalRevenue",
        "foodCommission",
        "beveragesCommission",
        "otherCommission",
        "totalCommission",
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(results);

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=waiter_commission_report_${timestamp}.csv`
      );
      return res.status(200).end(csv);
    }

    return res.status(200).json({ data: results });
  } catch (err) {
    console.error("Commission report error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getWaiterCommissionReport };
