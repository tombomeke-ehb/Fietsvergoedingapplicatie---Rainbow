// backend/controllers/settingsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const country = req.params.country;
    const settings = await prisma.countrySettings.findUnique({ where: { country } });
    if (!settings) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'SETTINGS_FETCH_ERROR' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const country = req.params.country;
    const data = req.body;
    const updated = await prisma.countrySettings.update({ where: { country }, data });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'SETTINGS_UPDATE_ERROR' });
  }
};
