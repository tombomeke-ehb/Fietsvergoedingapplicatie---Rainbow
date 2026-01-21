// backend/prisma/seed.js
const { PrismaClient, Role, Country, BikeType, CapType } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clean
  await prisma.monthlyExport.deleteMany();
  await prisma.tripEntry.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.countrySettings.deleteMany();
  await prisma.user.deleteMany();

  // Settings per land
  await prisma.countrySettings.createMany({
    data: [
      {
        country: Country.BE,
        ratePerKm: 0.30,               // werkgever kiest
        deadlineDayNextMonth: 12,
        capType: CapType.YEARLY,
        yearlyCapAmount: 3160,         // belastingvrij plafond (bedrag)
        monthlyCapAmount: null,
        beBlockAfterCap: true,         // in deze case: hard block
        exportDayOfMonth: 1
      },
      {
        country: Country.NL,
        ratePerKm: 0.23,               // wettelijk max belastingvrij, werkgever kan lager/hoger (maar fiscaal anders)
        deadlineDayNextMonth: 15,
        capType: CapType.NONE,
        monthlyCapAmount: null,
        yearlyCapAmount: null,
        beBlockAfterCap: false,
        exportDayOfMonth: 1
      }
    ]
  });

  // Demo users
  const beEmployee = await prisma.user.create({
    data: {
      name: "Employee BE",
      role: Role.EMPLOYEE,
      country: Country.BE,
      bikeType: null,
      profile: { create: { fullCommuteKm: 8.5, partialCommuteKm: 3.2 } }
    }
  });

  const nlEmployeeOwn = await prisma.user.create({
    data: {
      name: "Employee NL (Own bike)",
      role: Role.EMPLOYEE,
      country: Country.NL,
      bikeType: BikeType.OWN,
      profile: { create: { fullCommuteKm: 12.0, partialCommuteKm: 4.0 } }
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      role: Role.ADMIN,
      country: Country.BE
    }
  });

  const payroll = await prisma.user.create({
    data: {
      name: "Payroll",
      role: Role.PAYROLL,
      country: Country.BE
    }
  });

  console.log("Seed done. Demo IDs:", {
    beEmployee: beEmployee.id,
    nlEmployeeOwn: nlEmployeeOwn.id,
    admin: admin.id,
    payroll: payroll.id
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
