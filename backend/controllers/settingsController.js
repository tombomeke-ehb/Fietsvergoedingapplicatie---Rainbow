// backend/controllers/settingsController.js
const settingsService = require("../services/settingsService");

exports.getSettings = async (req, res) => {
  try {
    const country = (req.params.country || "").toUpperCase();

    if (!["BE", "NL"].includes(country)) {
      return res.status(400).json({ error: "INVALID_COUNTRY" });
    }

    const settings = await settingsService.getSettingsByCountry(country);
    res.json(settings);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "SETTINGS_ERROR" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "FORBIDDEN" });

    const country = (req.params.country || "").toUpperCase();


    if (!["BE", "NL"].includes(country)) {
      return res.status(400).json({ error: "INVALID_COUNTRY" });
    }

    const updated = await settingsService.updateSettings(country, req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "SETTINGS_UPDATE_ERROR" });
  }
};
