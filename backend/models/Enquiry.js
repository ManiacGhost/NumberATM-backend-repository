// models/Enquiry.js
const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  number: { type: String, required: true },
  fullNumber: { type: String, required: false },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  VIPNumber: { type: mongoose.Schema.Types.ObjectId, ref: "VIPNumber", required: true},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Enquiry', enquirySchema);
