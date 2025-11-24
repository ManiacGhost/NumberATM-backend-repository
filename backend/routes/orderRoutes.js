const express = require("express");
const { getOrders, getOrderbyUser, getOrder, softDeleteOrder, hardDeleteOrder, UpdateStatus } = require("../controllers/OrderController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/", getOrders);
router.get("/user",authMiddleware, getOrderbyUser);
router.get("/:id", getOrder);
router.post("/mark-paid",verifyToken, UpdateStatus);
router.delete("/soft/:orderId", softDeleteOrder);
router.delete("/hard/:orderId", hardDeleteOrder);

module.exports = router;
