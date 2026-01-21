// backend/controllers/employeeController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllEmployees = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const users = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      include: { profile: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'EMPLOYEE_LIST_ERROR' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'EMPLOYEE_PROFILE_ERROR' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const id = Number(req.params.id);
    const { fullCommuteKm, partialCommuteKm, bikeType } = req.body;
    // Update EmployeeProfile
    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
    await prisma.employeeProfile.update({
      where: { userId: id },
      data: { fullCommuteKm, partialCommuteKm }
    });
    // Update bikeType (voor NL)
    await prisma.user.update({ where: { id }, data: { bikeType } });
    const updated = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'EMPLOYEE_PROFILE_UPDATE_ERROR' });
  }
};
