const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Delhi
  slug: { type: String, required: true, unique: true }, // e.g., vip-numbers-in-delhi
  title: String,
  tags: String,
  description: String,
  content: String,
  breadcum: String,
  imagePublicId: String,
});

module.exports = mongoose.model('City', citySchema);
