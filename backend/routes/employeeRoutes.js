// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.get('/', employeeController.getAllEmployees);
router.get('/:id/profile', employeeController.getProfile);
router.put('/:id/profile', employeeController.updateProfile);

module.exports = router;
