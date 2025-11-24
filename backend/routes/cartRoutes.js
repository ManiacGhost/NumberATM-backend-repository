const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartControllers");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Add item to cart
router.post("/add", authMiddleware, cartController.addToCart);

// Add item to cart after login
router.post("/add/login", cartController.addToCartonLogin);

// Remove item from cart
router.post("/remove", authMiddleware, cartController.removeFromCart);

// Get user's cart
router.get("/", authMiddleware, cartController.getCart);

// Clear cart
router.post("/clear", authMiddleware, cartController.clearCart);

module.exports = router;
