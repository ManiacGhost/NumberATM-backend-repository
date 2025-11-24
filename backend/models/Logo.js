const mongoose = require("mongoose");

const LogoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    mimeType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Logo", LogoSchema);
