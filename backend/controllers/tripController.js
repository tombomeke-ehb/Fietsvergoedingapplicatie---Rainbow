// backend/controllers/tripController.js
const tripService = require("../services/tripService");
const { TripType } = require("@prisma/client");

exports.createTrip = async (req, res) => {
  try {
    if (req.user.role !== "EMPLOYEE") return res.status(403).json({ error: "FORBIDDEN" });

    const { date, tripType } = req.body;
    if (!date || !tripType) return res.status(400).json({ error: "MISSING_FIELDS" });

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
    if (!month) return res.status(400).json({ error: "INVALID_MONTH" });

    const trips = await tripService.listTripsForMonth(req.user.id, month);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: "TRIP_LIST_ERROR" });
  }
};