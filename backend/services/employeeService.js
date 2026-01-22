// backend/services/employeeServices.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllEmployees = async () => {
  return prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: { profile: true }
  });
};

exports.getEmployeeProfile = async (id) => {
  return prisma.user.findUnique({ 
    where: { id }, 
    include: { profile: true } 
  });
};

exports.updateEmployeeProfile = async (id, data) => {
  const { fullCommuteKm, partialCommuteKm, bikeType } = data;
  
  // 1. Check of user bestaat
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw { status: 404, message: 'NOT_FOUND' };

  // 2. Update of maak profile aan
  // We gebruiken upsert voor robuustheid (als profile nog niet bestond)
  await prisma.employeeProfile.upsert({
    where: { userId: id },
    update: { fullCommuteKm, partialCommuteKm },
    create: { userId: id, fullCommuteKm, partialCommuteKm }
  });

  // 3. Update bikeType enkel voor NL
  if (user.country === 'NL' && bikeType) {
    await prisma.user.update({
      where: { id },
      data: { bikeType }
    });
  }

  return prisma.user.findUnique({ where: { id }, include: { profile: true } });
};