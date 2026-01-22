const { PrismaClient, FiscalStatus, Country, TripType, CapType } = require("@prisma/client");
const prisma = new PrismaClient();

// Helpers
function getYearMonth(dateStr) { return dateStr.slice(0, 7); }
function parseYMD(dateStr) { const [y, m, d] = dateStr.split("-").map(Number); return { y, m, d }; }
function moneyCents(amount) { return Math.round(amount * 100); }
function centsToMoney(cents) { return cents / 100; }

function isAfterDeadlineForMonth(dateStr, deadlineDayNextMonth) {
  const now = new Date();
  const { y, m } = parseYMD(dateStr);
  // Deadline is dag X in maand M+1
  const deadlineDate = new Date(y, m, deadlineDayNextMonth, 23, 59, 59, 999);
  return now > deadlineDate;
}

// Aggregaties voor limieten
async function sumAmount(userId, from, to) {
  const agg = await prisma.tripEntry.aggregate({
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amountSnapshot: true }
  });
  return agg._sum.amountSnapshot || 0;
}

// 1. Create Trip
async function createTripEntry({ user, date, tripType }) {
  if (!user.profile) throw { status: 400, message: "NO_PROFILE" };

  const settings = await prisma.countrySettings.findUnique({ where: { country: user.country } });
  if (!settings) throw { status: 500, message: "NO_COUNTRY_SETTINGS" };

  // A. Deadline Check
  if (isAfterDeadlineForMonth(date, settings.deadlineDayNextMonth)) {
    throw { status: 409, message: "DEADLINE_PASSED" };
  }

  // B. Max 2 per dag Check
  const existing = await prisma.tripEntry.findMany({ where: { userId: user.id, date } });
  if (existing.length >= 2) throw { status: 409, message: "MAX_2_PER_DAY" };
  
  // Bepaal vrije slot (1 of 2)
  const seq = existing.some(e => e.sequence === 1) ? 2 : 1;

  // C. Data ophalen uit profiel
  let km = tripType === TripType.FULL ? user.profile.fullCommuteKm : user.profile.partialCommuteKm;
  if (!km || km <= 0) throw { status: 400, message: "INVALID_KM_PROFILE" };

  // D. Fiscaal statuut
  let fiscalStatus = FiscalStatus.TAX_FREE;
  if (user.country === Country.NL) {
    if (!user.bikeType) throw { status: 400, message: "MISSING_BIKE_TYPE_NL" };
    fiscalStatus = (user.bikeType === "OWN") ? FiscalStatus.TAX_FREE : FiscalStatus.TAXED;
  }

  // E. Bedrag berekenen
  const amount = centsToMoney(moneyCents(km * settings.ratePerKm));

  // F. BE Plafond blokkering
  if (user.country === Country.BE && settings.beBlockAfterCap) {
    const ym = getYearMonth(date);
    const { y } = parseYMD(date);
    let capHit = false;

    if (settings.capType === CapType.MONTHLY || settings.capType === CapType.BOTH) {
      const current = await sumAmount(user.id, `${ym}-01`, `${ym}-31`);
      if (current + amount > settings.monthlyCapAmount) capHit = true;
    }
    if (settings.capType === CapType.YEARLY || settings.capType === CapType.BOTH) {
      const current = await sumAmount(user.id, `${y}-01-01`, `${y}-12-31`);
      if (current + amount > settings.yearlyCapAmount) capHit = true;
    }

    if (capHit) throw { status: 409, message: "CAP_REACHED_BE_BLOCK" };
  }

  return prisma.tripEntry.create({
    data: {
      userId: user.id, date, tripType, sequence: seq,
      kmSnapshot: km, amountSnapshot: amount, fiscalStatusSnapshot: fiscalStatus
    }
  });
}

// 2. Delete Trip
async function deleteTripEntry(tripId, userId) {
  const trip = await prisma.tripEntry.findUnique({ where: { id: tripId } });
  
  if (!trip) throw { status: 404, message: "NOT_FOUND" };
  if (trip.userId !== userId) throw { status: 403, message: "FORBIDDEN" };

  // Ophalen settings voor deadline check bij verwijderen
  const user = await prisma.user.findUnique({ where: { id: userId }});
  const settings = await prisma.countrySettings.findUnique({ where: { country: user.country } });

  if (isAfterDeadlineForMonth(trip.date, settings.deadlineDayNextMonth)) {
    throw { status: 409, message: "DEADLINE_PASSED" };
  }

  return prisma.tripEntry.delete({ where: { id: tripId } });
}

async function listTripsForMonth(userId, yearMonth) {
  const from = `${yearMonth}-01`;
  const to = `${yearMonth}-31`;
  return prisma.tripEntry.findMany({
    where: { userId, date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }, { sequence: "asc" }]
  });
}

module.exports = { createTripEntry, deleteTripEntry, listTripsForMonth };