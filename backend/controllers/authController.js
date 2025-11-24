const axios = require("axios");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const Otp = require("../models/Otp");

dotenv.config();

const API_KEY = process.env.DIGIMILES_API_KEY;
const SENDER_ID = process.env.DIGIMILES_SENDER_ID;

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) return res.status(400).json({ error: true, message: "Phone number is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyId = uuidv4(); // for frontend to track

    const encodedMessage = encodeURIComponent(
      `Dear User, Your one time password ${otp} and its valid for 15 mins. Do not share to anyone. Digimiles.`
    );

    const url = `https://api.aoc-portal.com/v1/sms?apikey=${API_KEY}&type=TRANS&text=${encodedMessage}&to=91${phone}&sender=${SENDER_ID}`;

    const response = await axios.get(url);

    if (response.data?.error) {
      return res.status(500).json({ error: true, message: "Digimiles rejected the request" });
    }

    // Save to DB
    await Otp.findOneAndUpdate(
      { phone },
      { otp, verifyId, createdAt: new Date() },
      { upsert: true }
    );

    console.log("SMS API result:", response.data);

    res.json({ success: true, message: "OTP sent", verifyId });
  } catch (error) {
    console.error("OTP send error:", error?.response?.data || error.message);
    res.status(500).json({ error: true, message: "Failed to send OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, verifyId } = req.body;

    if (!phone || !otp || !verifyId)
      return res.status(400).json({ error: true, message: "Missing phone/otp/verifyId" });

    const record = await Otp.findOne({ phone, verifyId });

    if (!record)
      return res.status(400).json({ error: true, message: "OTP expired or invalid" });

    if (record.otp !== otp)
      return res.status(400).json({ error: true, message: "Incorrect OTP" });

    await Otp.deleteOne({ phone, verifyId });

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("OTP verify error:", error.message);
    res.status(500).json({ error: true, message: "OTP verification failed" });
  }
};
