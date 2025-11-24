const mongoose = require("mongoose");

const orderCounterSchema = new mongoose.Schema({
  count: { type: Number, default: 1 }, // Start from 1000
});

module.exports = mongoose.model("OrderCounter", orderCounterSchema);
