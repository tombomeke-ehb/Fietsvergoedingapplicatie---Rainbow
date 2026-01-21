// backend/services/exportService.js
const { PrismaClient, FiscalStatus, ExportStatus } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Trigger maandelijkse export (manueel voor PoC)
 * @param {string} yearMonth - "YYYY-MM"
 */
async function triggerExport(yearMonth) {
  // Haal alle trips van die maand (string-prefix match)
  const trips = await prisma.tripEntry.findMany({
    where: {
      date: {
        startsWith: yearMonth
      }
    }
  });

  // Groepeer per gebruiker
  const map = new Map();

  for (const t of trips) {
    const g =
      map.get(t.userId) || {
        totalKm: 0,
        totalAmount: 0,
        taxFree: 0,
        taxed: 0
      };

    g.totalKm += t.kmSnapshot;
    g.totalAmount += t.amountSnapshot;

    if (t.fiscalStatusSnapshot === FiscalStatus.TAX_FREE) {
      g.taxFree += t.amountSnapshot;
    } else {
      g.taxed += t.amountSnapshot;
    }

    map.set(t.userId, g);
  }

  // Upsert MonthlyExport per gebruiker
  const results = [];

  for (const [userId, g] of map.entries()) {
    const exportRow = await prisma.monthlyExport.upsert({
      where: {
        userId_yearMonth: { userId, yearMonth }
      },
      update: {
        totalKm: g.totalKm,
        totalAmount: g.totalAmount,
        totalTaxFreeAmount: g.taxFree,
        totalTaxedAmount: g.taxed,
        status: ExportStatus.GENERATED
      },
      create: {
        userId,
        yearMonth,
        totalKm: g.totalKm,
        totalAmount: g.totalAmount,
        totalTaxFreeAmount: g.taxFree,
        totalTaxedAmount: g.taxed,
        status: ExportStatus.GENERATED
      }
    });

    results.push(exportRow);
  }

  return results;
}

/**
 * Lijst exports (optioneel gefilterd op maand)
 */
async function listExports(yearMonth) {
  const where = yearMonth ? { yearMonth } : {};

  return prisma.monthlyExport.findMany({
    where,
    include: { user: true },
    orderBy: { yearMonth: "desc" }
  });
}

module.exports = {
  triggerExport,
  listExports
};
