const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSettingsByCountry = async (country) => {
  const settings = await prisma.countrySettings.findUnique({ where: { country } });
  if (!settings) throw { status: 404, message: 'SETTINGS_NOT_FOUND' };
  return settings;
};

exports.updateSettings = async (country, data) => {
  // Zorg dat we niet het ID of de country code zelf aanpassen, enkel de waarden
  const { ratePerKm, deadlineDayNextMonth, capType, monthlyCapAmount, yearlyCapAmount, beBlockAfterCap } = data;
  
  return prisma.countrySettings.update({
    where: { country },
    data: {
      ratePerKm,
      deadlineDayNextMonth,
      capType,
      monthlyCapAmount,
      yearlyCapAmount,
      beBlockAfterCap
    }
  });
};