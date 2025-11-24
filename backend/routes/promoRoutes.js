const express = require("express");
const { createPromo, validatePromo } = require("../controllers/promoController");
const { applyPromo } = require("../controllers/promoController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { getAllPromos } = require("../controllers/promoController");
const { updatePromo } = require("../controllers/promoController");
const { deletePromo } = require("../controllers/promoController");
const { getPromos } = require("../controllers/promoController");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();

// Admin Routes
router.post("/admin/create", verifyToken, createPromo);
router.get("/",verifyToken, getAllPromos); // Get all promo codes
router.get("/search",verifyToken, getPromos); // Get all promo codes
router.put("/:id",verifyToken, updatePromo); // Update a promo code
router.delete("/:id",verifyToken, deletePromo); // Delete a promo code

// User Routes
router.post("/validate",authMiddleware, validatePromo);
router.post("/apply",authMiddleware, applyPromo);

module.exports = router;
