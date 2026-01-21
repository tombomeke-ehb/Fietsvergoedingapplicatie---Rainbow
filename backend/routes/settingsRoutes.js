// backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/:country', settingsController.getSettings);
router.put('/:country', settingsController.updateSettings);

module.exports = router;
