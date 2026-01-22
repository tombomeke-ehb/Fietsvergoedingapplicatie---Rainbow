// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/users', adminController.createUser);

module.exports = router;
