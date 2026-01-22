// backend/services/settingsService.js
const { PrismaClient, CapType, Country } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getSettingsByCountry = async (country) => {
  const settings = await prisma.countrySettings.findUnique({ where: { country } });
  if (!settings) throw { status: 404, message: "SETTINGS_NOT_FOUND" };
  return settings;
};

function assertNumber(value, code, { min = null, max = null } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw { status: 400, message: code };
  }
  if (min != null && value < min) throw { status: 400, message: code };
  if (max != null && value > max) throw { status: 400, message: code };
}

function assertInt(value, code, { min = null, max = null } = {}) {
  if (!Number.isInteger(value)) throw { status: 400, message: code };
  if (min != null && value < min) throw { status: 400, message: code };
  if (max != null && value > max) throw { status: 400, message: code };
}

function validateUpdatePayload(country, data) {
  const {
    ratePerKm,
    deadlineDayNextMonth,
    capType,
    monthlyCapAmount,
    yearlyCapAmount,
    beBlockAfterCap,
    exportDayOfMonth,
  } = data;

  assertNumber(ratePerKm, "INVALID_RATE", { min: 0.0001 });

  // 1..28 is “veilig” voor elke maand (geen 29/30/31 edge cases)
  assertInt(deadlineDayNextMonth, "INVALID_DEADLINE_DAY", { min: 1, max: 28 });

  // export day is optioneel, maar als je het meegeeft: ook veilig 1..28
  if (exportDayOfMonth !== undefined) {
    assertInt(exportDayOfMonth, "INVALID_EXPORT_DAY", { min: 1, max: 28 });
  }

  // capType moet één van de enum waarden zijn (Prisma zal ook valideren, maar dit geeft betere errors)
  if (!Object.values(CapType).includes(capType)) {
    throw { status: 400, message: "INVALID_CAP_TYPE" };
  }

  // Als caps actief zijn, moeten bedragen bestaan en > 0 zijn
  if (capType === CapType.MONTHLY || capType === CapType.BOTH) {
    assertNumber(monthlyCapAmount, "INVALID_MONTHLY_CAP", { min: 0.01 });
  }
  if (capType === CapType.YEARLY || capType === CapType.BOTH) {
    assertNumber(yearlyCapAmount, "INVALID_YEARLY_CAP", { min: 0.01 });
  }

  // België-setting is vooral relevant voor BE, maar we houden het consistent
  if (country === Country.BE) {
    if (typeof beBlockAfterCap !== "boolean") {
      throw { status: 400, message: "INVALID_BE_BLOCK_FLAG" };
    }
  }

  return true;
}

exports.updateSettings = async (country, data) => {
  validateUpdatePayload(country, data);

  const {
    ratePerKm,
    deadlineDayNextMonth,
    capType,
    monthlyCapAmount,
    yearlyCapAmount,
    beBlockAfterCap,
    exportDayOfMonth,
  } = data;

  // Caps die niet van toepassing zijn zetten we op null,
  // zodat je later geen “oude” bedragen hebt die per ongeluk toch gebruikt worden.
  const cleanedMonthly =
    capType === CapType.MONTHLY || capType === CapType.BOTH ? monthlyCapAmount : null;

  const cleanedYearly =
    capType === CapType.YEARLY || capType === CapType.BOTH ? yearlyCapAmount : null;

  return prisma.countrySettings.update({
    where: { country },
    data: {
      ratePerKm,
      deadlineDayNextMonth,
      capType,
      monthlyCapAmount: cleanedMonthly,
      yearlyCapAmount: cleanedYearly,
      beBlockAfterCap,
      // Alleen updaten als het meegegeven is (anders behoud je de DB waarde)
      ...(exportDayOfMonth !== undefined ? { exportDayOfMonth } : {}),
    },
  });
};
