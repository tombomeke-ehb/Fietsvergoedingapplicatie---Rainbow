// backend/routes/demoRoutes.js
const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

router.post('/login', demoController.demoLogin);
router.post('/logout', demoController.demoLogout);

module.exports = router;
