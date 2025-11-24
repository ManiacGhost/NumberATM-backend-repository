const mongoose = require("mongoose");
const BlogSchema = new mongoose.Schema({
    title: String,
    slug: String,
    link: String,
    content: String,
    metaTitle: String,
    metaDescription: String,
    metaKeywords: String,
    imageUrl: String, // Cloudinary Image URL
    imagePublicId: String, // Cloudinary Public ID
  },{timestamps:true});
const Blog = mongoose.model("Blog", BlogSchema);
module.exports = Blog;