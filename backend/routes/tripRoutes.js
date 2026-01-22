// backend/routes/tripRoutes.js
const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

// POST /trip-entries
router.post("/", tripController.createTrip);

// GET /trip-entries?month=YYYY-MM
router.get("/", tripController.listTrips);

// DELETE /trip-entries/:id
router.delete("/:id", tripController.deleteTrip);

router.get('/months', tripController.getAvailableMonths);

module.exports = router;
