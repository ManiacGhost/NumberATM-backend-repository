const  mongoose = require("mongoose");

const metaSchema = new mongoose.Schema({
  page: { type: String, unique: true, required: true },
  title: String,
  tags: String,
  description: String,
  content: String,
  breadcum: String,
  imagePublicId: String,
  route: String,
},{timestamps:true});

module.exports = mongoose.model("Meta", metaSchema);
