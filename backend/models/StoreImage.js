const mongoose = require("mongoose");

const StoreImageSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Base64 image data
  createdAt: { type: Date, default: Date.now },
  mediaType: { type: String, enum: ["image", "video", "youtube"], required: true, default:'image' },
  // url: { type: String, required: true },
  public_id: { type: String },
});

module.exports = mongoose.model("StoreImage", StoreImageSchema);
