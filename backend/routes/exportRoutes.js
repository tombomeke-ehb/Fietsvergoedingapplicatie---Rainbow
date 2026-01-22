// backend/routes/exportRoutes.js
const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");

router.post("/trigger", exportController.trigger);
router.get("/", exportController.list);
router.get("/:id/download", exportController.download);
router.get('/download-all', exportController.downloadAll);

module.exports = router;