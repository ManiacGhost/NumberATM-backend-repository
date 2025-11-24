const mongoose = require("mongoose");

const promoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, // Discount percentage or fixed
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  expiryDate: { type: Date, required: true },
  minCartValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  deleted: { type: Boolean, default: false },
  usageLimit: { type: Number, default: 1 }, // Number of times a code can be used
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // Admin reference
},{timestamps:true});

module.exports = mongoose.model("Promo", promoSchema);
