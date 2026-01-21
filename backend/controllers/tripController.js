// backend/controllers/tripController.js
const tripService = require("../services/tripService");
const { TripType } = require("@prisma/client");

exports.createTrip = async (req, res) => {
  try {
    if (req.user.role !== "EMPLOYEE") return res.status(403).json({ error: "FORBIDDEN" });

    const { date, tripType } = req.body;
    if (!date || !tripType) return res.status(400).json({ error: "MISSING_FIELDS" });

    if (![TripType.FULL, TripType.PARTIAL].includes(tripType)) {
      return res.status(400).json({ error: "INVALID_TRIP_TYPE" });
    }

    const trip = await tripService.createTripEntry({ user: req.user, date, tripType });
    res.json(trip);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "TRIP_CREATE_ERROR" });
  }
};

exports.listTrips = async (req, res) => {
  try {
    if (req.user.role !== "EMPLOYEE") return res.status(403).json({ error: "FORBIDDEN" });

    const { month } = req.query; // "YYYY-MM"
    if (!month || month.length !== 7) return res.status(400).json({ error: "INVALID_MONTH" });

    const trips = await tripService.listTripsForMonth(req.user.id, month);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: "TRIP_LIST_ERROR" });
  }
};
