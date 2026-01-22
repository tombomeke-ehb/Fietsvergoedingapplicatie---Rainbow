// backend/services/tripService.js
const { PrismaClient, FiscalStatus, Country, TripType, CapType } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Kleine util: haalt "YYYY-MM" uit "YYYY-MM-DD"
 */
function getYearMonth(dateStr) {
  return dateStr.slice(0, 7);
}

/**
 * Parses "YYYY-MM-DD" naar getallen (zonder Date timezone issues)
 */
function parseYMD(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

/**
 * Geld afronden naar centen (integer) om float errors te beperken.
 * We bewaren nadien opnieuw als float met 2 decimalen (PoC).
 */
function moneyCents(amount) {
  return Math.round(amount * 100);
}

function centsToMoney(cents) {
  return cents / 100;
}

/**
 * Deadline: registraties voor maand M moeten binnen zijn voor dag X in maand M+1.
 * We gebruiken de server clock (PoC).
 */
function isAfterDeadlineForMonth(dateStr, deadlineDayNextMonth) {
  const now = new Date();
  const { y, m } = parseYMD(dateStr);

  // JS Date month is 0-based. Omdat m uit string 1..12 is,
  // betekent new Date(y, m, ...) automatisch de volgende maand.
  const deadlineDate = new Date(y, m, deadlineDayNextMonth, 23, 59, 59, 999);
  return now > deadlineDate;
}

/**
 * Som van amountSnapshot binnen een date range.
 * Let op: date is een string, dus gte/lte werkt correct zolang format YYYY-MM-DD is.
 */
async function sumAmount(userId, from, to) {
  const agg = await prisma.tripEntry.aggregate({
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amountSnapshot: true },
  });
  return agg._sum.amountSnapshot || 0;
}

/**
 * Als capType zegt dat er een cap is, dan moeten bedragen effectief bestaan.
 * Anders kan null zich gedragen als 0 en blokkeer je alles “per ongeluk”.
 */
function assertCapValue(value, code) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw { status: 500, message: code };
  }
}

async function createTripEntry({ user, date, tripType }) {
  // Zonder stamgegevens kan je de afstand niet bepalen
  if (!user.profile) throw { status: 400, message: "NO_PROFILE" };

  const settings = await prisma.countrySettings.findUnique({
    where: { country: user.country },
  });
  if (!settings) throw { status: 500, message: "NO_COUNTRY_SETTINGS" };

  // A) Deadline check
  if (isAfterDeadlineForMonth(date, settings.deadlineDayNextMonth)) {
    throw { status: 409, message: "DEADLINE_PASSED" };
  }

  // B) Max 2 registraties per dag (sequence 1 of 2)
  const existing = await prisma.tripEntry.findMany({ where: { userId: user.id, date } });
  if (existing.length >= 2) throw { status: 409, message: "MAX_2_PER_DAY" };

  const seq = existing.some((e) => e.sequence === 1) ? 2 : 1;

  // C) Afstand uit profiel halen
  let km =
    tripType === TripType.FULL ? user.profile.fullCommuteKm : user.profile.partialCommuteKm;

  if (!km || km <= 0) throw { status: 400, message: "INVALID_KM_PROFILE" };

  // D) Fiscaal statuut (NL: bikeType bepaalt taxed/tax_free)
  let fiscalStatus = FiscalStatus.TAX_FREE;
  if (user.country === Country.NL) {
    if (!user.bikeType) throw { status: 400, message: "MISSING_BIKE_TYPE_NL" };
    fiscalStatus = user.bikeType === "OWN" ? FiscalStatus.TAX_FREE : FiscalStatus.TAXED;
  }

  // E) Bedrag berekenen en afronden op cent
  const amount = centsToMoney(moneyCents(km * settings.ratePerKm));

  // F) België: blokkeren na bereiken plafond (indien instelling actief)
  if (user.country === Country.BE && settings.beBlockAfterCap) {
    const ym = getYearMonth(date);
    const { y } = parseYMD(date);
    let capHit = false;

    if (settings.capType === CapType.MONTHLY || settings.capType === CapType.BOTH) {
      assertCapValue(settings.monthlyCapAmount, "INVALID_MONTHLY_CAP_CONFIG");
      const current = await sumAmount(user.id, `${ym}-01`, `${ym}-31`);
      if (current + amount > settings.monthlyCapAmount) capHit = true;
    }

    if (settings.capType === CapType.YEARLY || settings.capType === CapType.BOTH) {
      assertCapValue(settings.yearlyCapAmount, "INVALID_YEARLY_CAP_CONFIG");
      const current = await sumAmount(user.id, `${y}-01-01`, `${y}-12-31`);
      if (current + amount > settings.yearlyCapAmount) capHit = true;
    }

    if (capHit) throw { status: 409, message: "CAP_REACHED_BE_BLOCK" };
  }

  // G) Opslaan met snapshots (historiek blijft stabiel bij settings-wijzigingen)
  return prisma.tripEntry.create({
    data: {
      userId: user.id,
      date,
      tripType,
      sequence: seq,
      kmSnapshot: km,
      amountSnapshot: amount,
      fiscalStatusSnapshot: fiscalStatus,
    },
  });
}

async function deleteTripEntry(tripId, userId) {
  const trip = await prisma.tripEntry.findUnique({ where: { id: tripId } });
  if (!trip) throw { status: 404, message: "NOT_FOUND" };
  if (trip.userId !== userId) throw { status: 403, message: "FORBIDDEN" };

  // Deadline check bij verwijderen: na deadline mag je niet “retroactief” aanpassen
  const user = await prisma.user.findUnique({ where: { id: userId } });
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
    orderBy: [{ date: "asc" }, { sequence: "asc" }],
  });
}

module.exports = { createTripEntry, deleteTripEntry, listTripsForMonth };