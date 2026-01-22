// backend/controllers/exportController.js
const exportService = require("../services/exportService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.trigger = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "FORBIDDEN" });
    const { month } = req.query;
    if (!month || month.length !== 7) return res.status(400).json({ error: "INVALID_MONTH" });

    const result = await exportService.triggerExport(month);
    res.json({ success: true, count: result.length });
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

exports.download = async (req, res) => {
  try {
    if (!["ADMIN", "PAYROLL"].includes(req.user.role)) return res.status(403).json({ error: "FORBIDDEN" });
    const id = Number(req.params.id);

    const exp = await prisma.monthlyExport.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!exp) return res.status(404).json({ error: "NOT_FOUND" });

    // CSV Generatie (Puntkomma gescheiden voor Excel NL/BE)
    const headers = "PersoneelID;Naam;Maand;TotaalKM;TotaalBedrag;Onbelast;Belast;Status";
    const row = [
      exp.userId,
      exp.user.name,
      exp.yearMonth,
      exp.totalKm.toString().replace('.', ','),
      exp.totalAmount.toFixed(2).replace('.', ','),
      (exp.totalTaxFreeAmount || 0).toFixed(2).replace('.', ','),
      (exp.totalTaxedAmount || 0).toFixed(2).replace('.', ','),
      exp.status
    ].join(';');

    const csvContent = `${headers}\n${row}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export_${exp.yearMonth}_${exp.user.name}.csv"`);
    res.send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DOWNLOAD_ERROR" });
  }
};

exports.downloadAll = async (req, res) => {
  try {
    if (!["ADMIN", "PAYROLL"].includes(req.user.role)) return res.status(403).json({ error: "FORBIDDEN" });
    const { month } = req.query;
    if (!month || month.length !== 7) return res.status(400).json({ error: "INVALID_MONTH" });

    const exports = await prisma.monthlyExport.findMany({
      where: { yearMonth: month },
      include: { user: true }
    });

    const headers = "PersoneelID;Naam;Maand;TotaalKM;TotaalBedrag;Onbelast;Belast;Status";
    const rows = exports.map(exp => [
      exp.userId,
      exp.user.name,
      exp.yearMonth,
      exp.totalKm.toString().replace('.', ','),
      exp.totalAmount.toFixed(2).replace('.', ','),
      (exp.totalTaxFreeAmount || 0).toFixed(2).replace('.', ','),
      (exp.totalTaxedAmount || 0).toFixed(2).replace('.', ','),
      exp.status
    ].join(';'));
    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export_${month}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DOWNLOAD_ALL_ERROR" });
  }
};