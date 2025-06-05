const { Item } = require("../models");
const csv = require("fast-csv");
const fs = require("fs");
const { Parser } = require("json2csv");

const importItemsCSV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "CSV file required" });

    const items = [];
    fs.createReadStream(req.file.path)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => items.push(row))
      .on("end", async () => {
        for (const item of items) {
          await Item.upsert(item, {
            where: { name: item.name },
          });
        }
        res.json({ message: "Items imported successfully" });
      });
  } catch (err) {
    console.error("CSV Import error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const exportItemsCSV = async (req, res) => {
  try {
    const items = await Item.findAll({ raw: true });
    const parser = new Parser();
    const csvData = parser.parse(items);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=items_export.csv"
    );
    res.status(200).end(csvData);
  } catch (err) {
    console.error("CSV Export error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { importItemsCSV, exportItemsCSV };
