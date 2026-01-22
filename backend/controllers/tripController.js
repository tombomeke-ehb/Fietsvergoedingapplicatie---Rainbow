// backend/controllers/tripController.js
const tripService = require("../services/tripService");

exports.createTrip = async (req, res) => {
  try {
    // Rolcheck: alleen werknemers mogen registreren
    if (req.user.role !== "EMPLOYEE") return res.status(403).json({ error: "FORBIDDEN" });

    const { date, tripType } = req.body;

    // date = "YYYY-MM-DD", tripType = FULL/PARTIAL
    if (!date || !tripType) return res.status(400).json({ error: "MISSING_FIELDS" });

    // Basic format check: voorkomt rare strings voordat service het verwerkt
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
    }

    const trip = await tripService.createTripEntry({ user: req.user, date, tripType });
    res.json(trip);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "TRIP_CREATE_ERROR" });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    if (req.user.role !== "EMPLOYEE") return res.status(403).json({ error: "FORBIDDEN" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "INVALID_ID" });

    await tripService.deleteTripEntry(id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "DELETE_ERROR" });
  }
};

exports.listTrips = async (req, res) => {
  try {
    if (req.user.role !== "EMPLOYEE") return res.status(403).json({ error: "FORBIDDEN" });

    const { month } = req.query;

    // month = "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "INVALID_MONTH" });
    }

    const trips = await tripService.listTripsForMonth(req.user.id, month);
    res.json(trips);
  } catch (err) {
    console.error("Trip list error:", err);
    res.status(500).json({ error: "TRIP_LIST_ERROR" });
  }
};
