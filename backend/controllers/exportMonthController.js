// backend/controllers/exportMonthController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAvailableExportMonths = async (req, res) => {
  try {
    // Alleen voor ADMIN en PAYROLL
    if (!['ADMIN', 'PAYROLL'].includes(req.user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    // Haal alle unieke maanden op waarvoor exports bestaan
    const months = await prisma.monthlyExport.findMany({
      select: { yearMonth: true },
      distinct: ['yearMonth'],
      orderBy: { yearMonth: 'desc' }
    });
    res.json(months.map(m => m.yearMonth));
  } catch (err) {
    res.status(500).json({ error: 'EXPORT_MONTHS_ERROR' });
  }
};
