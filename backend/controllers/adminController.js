// backend/controllers/adminController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    const { name, country, role } = req.body;
    if (!name || !country || !role) {
      return res.status(400).json({ error: 'MISSING_FIELDS' });
    }
    const user = await prisma.user.create({
      data: { name, country, role }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'USER_CREATE_ERROR' });
  }
};
