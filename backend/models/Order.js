const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    // rzpOrderId: { type: String},
    orderId: { type: String, required: true, unique: true },
    operator: {
      type: String,
      required: true,
      enum: ["Airtel", "Jio", "Vi", "BSNL", "Other"], // Add more if needed
    },
    simType: {
      type: String,
      required: true,
      enum: ["Prepaid", "Postpaid"],
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    streetAddress: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    gst: { type: Number },
    status: { type: String, default: 'Ordered' },
    deleted: { type: Boolean, default: false },
    paymentStatus: { type: String, default: 'Unpaid' },
    paymentId: { type: String, },
    paymentMessage: { type: String, },
    transactionTime: { type: Date },
    promoCode: { type: mongoose.Schema.Types.ObjectId, ref: "Promo" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        vipNumber: { type: mongoose.Schema.Types.ObjectId, ref: "VIPNumber" },
      }
    ],
    numbers: { type: [String] },
    numberPricePairs: [
      {
        number: String,
        price: String,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
