const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      vipNumberId: { type: mongoose.Schema.Types.ObjectId, ref: "VIPNumber", required: true}
    }
  ],
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-update total price before saving
cartSchema.pre("save", async function (next) {
  const vipNumbers = await mongoose.model("VIPNumber").find({ _id: { $in: this.items.map(i => i.vipNumberId) } });
  this.totalPrice = vipNumbers.reduce((sum, num) => sum + num.price, 0);
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
