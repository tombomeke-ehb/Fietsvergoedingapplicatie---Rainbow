const settingsService = require('../services/settingsService');

exports.getSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const settings = await settingsService.getSettingsByCountry(req.params.country);
    res.json(settings);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'SETTINGS_ERROR' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const updated = await settingsService.updateSettings(req.params.country, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'SETTINGS_UPDATE_ERROR' });
  }
};