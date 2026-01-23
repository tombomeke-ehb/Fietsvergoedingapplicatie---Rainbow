// backend/controllers/exportMonthController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAvailableExportMonths = async (req, res) => {
  try {
    // Alleen voor ADMIN en PAYROLL
    if (!['ADMIN', 'PAYROLL'].includes(req.user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    // Haal alle unieke maanden op waarin ritten zijn geregistreerd (TripEntry)
    const months = await prisma.tripEntry.findMany({
      select: { date: true },
      orderBy: { date: 'desc' }
    });
    // Uniek per maand (YYYY-MM)
    const uniqueMonths = [...new Set(months.map(t => t.date.slice(0, 7)))];
    res.json(uniqueMonths);
  } catch (err) {
    res.status(500).json({ error: 'EXPORT_MONTHS_ERROR' });
  }
};
