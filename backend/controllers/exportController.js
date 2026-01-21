// backend/controllers/exportController.js
const exportService = require("../services/exportService");

exports.trigger = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "FORBIDDEN" });

    const { month } = req.query; // "YYYY-MM"
    if (!month || month.length !== 7) return res.status(400).json({ error: "INVALID_MONTH" });

    const result = await exportService.triggerExport(month);
    res.json({ success: true, exports: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "EXPORT_TRIGGER_ERROR" });
  }
};

exports.list = async (req, res) => {
  try {
    if (!["ADMIN", "PAYROLL"].includes(req.user.role)) return res.status(403).json({ error: "FORBIDDEN" });

    const { month } = req.query;
    const exports = await exportService.listExports(month);
    res.json(exports);
  } catch (err) {
    res.status(500).json({ error: "EXPORT_LIST_ERROR" });
  }
};
