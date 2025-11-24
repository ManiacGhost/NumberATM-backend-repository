const cloudinary = require("../middlewares/cloudinary");
const Blog = require("../models/Blog");
const fs = require("fs");
const slugify = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters (except spaces)
    .trim() // Trim spaces at start/end
    .replace(/\s+/g, "-"); // Replace spaces with dashes
};

// Create a Blog
exports.createBlog = async (req, res) => {
  try {
    const { title, link, content, metaTitle, metaDescription, metaKeywords } = req.body;
    const slug = slugify(title);
    let imageUrl = "";
    let imagePublicId = "";

    const fileData = fs.readFileSync(req.file.path);
    const base64Data = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;

    fs.unlinkSync(req.file.path);
    // Remove temp file
    const blog = new Blog({ title, link, content, slug, metaTitle, metaDescription, metaKeywords, imageUrl: base64Data });
    await blog.save();

    res.status(201).json(blog);
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: "Error creating blog", error });
  }
};

// Get all Blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching blogs" });
  }
};
// Get Blog
exports.getBlogById = async (req, res) => {
  // console.log(req.params)
  try {
    const { id: slug } = req.params;
    const blog = await Blog.findOne({ slug });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: "Error fetching blogs" });
  }
};

// Update Blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, link, content, metaTitle, metaDescription, metaKeywords } = req.body;
    const blog = await Blog.findById(req.params.id);
    // const slug = slugify(title);
    let imageUrl = blog.imageUrl;
    let imagePublicId = blog.imagePublicId;
    const fileData = fs.readFileSync(req.file.path);
    imageUrl = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;
    // Remove temp file
    fs.unlinkSync(req.file.path);
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, link, content, metaTitle, metaDescription, metaKeywords, imageUrl, imagePublicId },
      { new: true, upsert: true }
    );


    res.status(200).json(updatedBlog);
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: "Error updating blog", error });
  }
};

// Delete Blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    // Delete image from Cloudinary
    if (blog.imagePublicId) {
      await cloudinary.uploader.destroy(blog.imagePublicId);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting blog" });
  }
};
