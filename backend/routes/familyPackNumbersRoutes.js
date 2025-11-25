const express = require("express");
const router = express.Router();
const { getFamilyPackNumbers } = require("../controllers/familyPackNumbersControllers");

/**
 * @route   GET /api/vip-numbers/family-pack
 * @desc    Get VIP numbers grouped by family pack patterns with pagination
 * @query   familyPack - Number of items (2-7)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @access  Public (or add your auth middleware)
 * @example /api/vip-numbers/family-pack?familyPack=3&page=1&limit=10
 */
router.get("/family-pack", getFamilyPackNumbers);

module.exports = router;