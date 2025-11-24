const express = require("express");
const { addToFavs, removeFromFav, getFavs, getFavsDetailed } = require("../controllers/favController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

// Add item to cart
router.post("/add", authMiddleware, addToFavs);

// Add item to cart after login
// router.post("/add/login", cartController.addToCartonLogin);

// Remove item from cart
router.post("/remove", authMiddleware, removeFromFav);

// Get user's cart
router.get("/", authMiddleware, getFavs);
router.get("/detailed", authMiddleware, getFavsDetailed);

// Clear cart
// router.post("/clear", authMiddleware, cartController.clearCart);

module.exports = router;
