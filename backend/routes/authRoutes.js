const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Send OTP to phone number
router.post("/send-otp", authController.sendOtp);

// Verify received OTP
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
