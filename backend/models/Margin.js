const mongoose = require("mongoose");

const marginSchema = new mongoose.Schema({
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  marginPercent: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Margin", marginSchema);
