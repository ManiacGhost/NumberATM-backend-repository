// routes/relatedNumbers.js
const express = require("express");
const router = express.Router();
const { getRelatedNumbers } = require("../controllers/relatedNumbersController");

// GET /api/vip-numbers/related-numbers?number=9876543212
router.get("/related-numbers", getRelatedNumbers);

module.exports = router;