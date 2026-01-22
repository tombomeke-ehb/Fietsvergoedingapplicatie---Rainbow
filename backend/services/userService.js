// backend/services/userService.js
const { PrismaClient } = require("@prisma/client");

// In PoC is een singleton PrismaClient prima.
// (Belangrijk: niet telkens een nieuwe PrismaClient maken in elke functie.)
const prisma = new PrismaClient();

/**
 * Haalt een user op inclusief stamgegevens (EmployeeProfile).
 * Dit is cruciaal zodat /me (en dus de frontend) ziet of het profiel bestaat.
 */
async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true, // ✅ belangrijkste fix
    },
  });
}

/**
 * Voor admin dashboard: lijst werknemers (EMPLOYEE) incl. profile.
 * Als je admin ook wilt tonen, pas where aan.
 */
async function listEmployees() {
  return prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: { profile: true },
    orderBy: { id: "asc" },
  });
}

/**
 * Update/maak de stamgegevens (verklaring op eer).
 * - Voor BE: bikeType mag NIET aangepast worden (volgens je functionele analyse)
 * - Voor NL: bikeType mag wel (OWN/COMPANY)
 */
async function upsertEmployeeProfile({ userId, fullCommuteKm, partialCommuteKm, bikeType }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Stamgegevens upserten
  const profile = await prisma.employeeProfile.upsert({
    where: { userId },
    update: {
      fullCommuteKm,
      partialCommuteKm,
    },
    create: {
      userId,
      fullCommuteKm,
      partialCommuteKm,
    },
  });

  // Alleen NL mag bikeType aanpassen
  if (user.country === "NL" && bikeType) {
    await prisma.user.update({
      where: { id: userId },
      data: { bikeType },
    });
  }

  // Return opnieuw inclusief profile (handig voor UI)
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
}

module.exports = {
  getUserById,
  listEmployees,
  upsertEmployeeProfile,
  prisma, // optioneel exporteren als je elders dezelfde prisma wilt gebruiken
};
