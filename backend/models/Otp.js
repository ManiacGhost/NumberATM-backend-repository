const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  verifyId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 } // expires after 2 minutes
});

module.exports = mongoose.model("Otp", otpSchema);
