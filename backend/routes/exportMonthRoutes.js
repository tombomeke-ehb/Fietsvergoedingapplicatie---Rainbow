// backend/routes/exportMonthRoutes.js
const express = require('express');
const router = express.Router();
const exportMonthController = require('../controllers/exportMonthController');

router.get('/months', exportMonthController.getAvailableExportMonths);

module.exports = router;
