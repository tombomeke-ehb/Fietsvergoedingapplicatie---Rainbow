// backend/services/userService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserById = async (id) => {
  if (!id || !Number.isInteger(id)) return null;
  
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true } // Profiel altijd meegeven
  });
};