// backend/services/tripService.js
const { PrismaClient, FiscalStatus, Country, TripType, CapType } = require("@prisma/client");
const prisma = new PrismaClient();

function getYearMonth(dateStr) {
  // "YYYY-MM-DD" -> "YYYY-MM"
  return dateStr.slice(0, 7);
}

function parseYMD(dateStr) {
  // dateStr = "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function isAfterDeadlineForMonth(dateStr, deadlineDayNextMonth, now = new Date()) {
  // Registraties voor maand M mogen tot dag X in maand M+1
  const { y, m } = parseYMD(dateStr); // month = 1..12
  const monthIndex = m - 1; // JS 0..11

  // deadline in de volgende maand:
  const deadlineDate = new Date(y, monthIndex + 1, deadlineDayNextMonth, 23, 59, 59, 999);
  return now > deadlineDate;
}

function moneyCents(amount) {
  return Math.round(amount * 100);
}

function centsToMoney(cents) {
  return cents / 100;
}

async function getCountrySettings(country) {
  return prisma.countrySettings.findUnique({ where: { country } });
}

async function sumAmountForUserYear(userId, year) {
  // som van amountSnapshot voor alle trips in dit jaar
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const agg = await prisma.tripEntry.aggregate({
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amountSnapshot: true }
  });
  return agg._sum.amountSnapshot || 0;
}

async function sumAmountForUserMonth(userId, yearMonth) {
  const from = `${yearMonth}-01`;
  const to = `${yearMonth}-31`;
  const agg = await prisma.tripEntry.aggregate({
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amountSnapshot: true }
  });
  return agg._sum.amountSnapshot || 0;
}

async function pickSequenceSlot(userId, dateStr) {
  const existing = await prisma.tripEntry.findMany({
    where: { userId, date: dateStr },
    select: { sequence: true }
  });
  const used = new Set(existing.map(e => e.sequence));
  if (!used.has(1)) return 1;
  if (!used.has(2)) return 2;
  return null;
}

async function createTripEntry({ user, date, tripType }) {
  // Basic validations
  if (!user.profile) throw Object.assign(new Error("NO_PROFILE"), { status: 400 });

  const settings = await getCountrySettings(user.country);
  if (!settings) throw Object.assign(new Error("NO_COUNTRY_SETTINGS"), { status: 500 });

  // deadline check
  if (isAfterDeadlineForMonth(date, settings.deadlineDayNextMonth)) {
    throw Object.assign(new Error("DEADLINE_PASSED"), { status: 409 });
  }

  // max 2/day using sequence slots
  const seq = await pickSequenceSlot(user.id, date);
  if (!seq) throw Object.assign(new Error("MAX_2_PER_DAY"), { status: 409 });

  // Determine km from profile
  let km;
  if (tripType === TripType.FULL) km = user.profile.fullCommuteKm;
  else km = user.profile.partialCommuteKm;

  if (typeof km !== "number" || km <= 0) {
    throw Object.assign(new Error("INVALID_KM_PROFILE"), { status: 400 });
  }

  // Determine fiscal status
  let fiscalStatus = FiscalStatus.TAX_FREE;
  if (user.country === Country.NL) {
    if (!user.bikeType) throw Object.assign(new Error("MISSING_BIKE_TYPE_NL"), { status: 400 });
    fiscalStatus = (user.bikeType === "OWN") ? FiscalStatus.TAX_FREE : FiscalStatus.TAXED;
  } else {
    // België: altijd TAX_FREE binnen plafond (maar blokkeren boven plafond)
    fiscalStatus = FiscalStatus.TAX_FREE;
  }

  // Amount calculation with cents safety
  const amount = centsToMoney(moneyCents(km * settings.ratePerKm));

  // Belgium caps hard block
  if (user.country === Country.BE && settings.beBlockAfterCap) {
    const ym = getYearMonth(date);
    const { y } = parseYMD(date);

    let wouldExceed = false;

    if (settings.capType === CapType.MONTHLY || settings.capType === CapType.BOTH) {
      if (settings.monthlyCapAmount != null) {
        const current = await sumAmountForUserMonth(user.id, ym);
        if (current + amount > settings.monthlyCapAmount) wouldExceed = true;
      }
    }

    if (settings.capType === CapType.YEARLY || settings.capType === CapType.BOTH) {
      if (settings.yearlyCapAmount != null) {
        const current = await sumAmountForUserYear(user.id, y);
        if (current + amount > settings.yearlyCapAmount) wouldExceed = true;
      }
    }

    if (wouldExceed) {
      throw Object.assign(new Error("CAP_REACHED_BE_BLOCK"), { status: 409 });
    }
  }

  // Create trip with snapshots
  const trip = await prisma.tripEntry.create({
    data: {
      userId: user.id,
      date,
      tripType,
      sequence: seq,
      kmSnapshot: km,
      amountSnapshot: amount,
      fiscalStatusSnapshot: fiscalStatus
    }
  });

  return trip;
}

async function listTripsForMonth(userId, yearMonth) {
  const from = `${yearMonth}-01`;
  const to = `${yearMonth}-31`;
  return prisma.tripEntry.findMany({
    where: { userId, date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }, { sequence: "asc" }]
  });
}

module.exports = {
  createTripEntry,
  listTripsForMonth
};
