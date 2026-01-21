// backend/controllers/demoController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.demoLogin = async (req, res) => {
  const userId = Number(req.body.userId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'INVALID_USER_ID' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'USER_NOT_FOUND' });
  }

  // PoC: frontend bewaart userId en stuurt in header mee
  res.json({ success: true, userId: user.id, role: user.role, country: user.country });
};

exports.demoLogout = (req, res) => {
  res.json({ success: true });
};
