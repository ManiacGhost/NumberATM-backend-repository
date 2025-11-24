const mongoose = require("mongoose");

const PosterSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Base64 encoded file
  mediaType: { type: String, enum: ["image", "video", "youtube"], required: true, default: "image" },
  posterLink: { type: String },
  createdAt: { type: Date, default: Date.now },
  mimeType: { type: String }, // e.g., 'image/png' or 'video/mp4'
});

module.exports = mongoose.model("Poster", PosterSchema);
