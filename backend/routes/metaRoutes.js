const express = require("express");
const Meta = require("../models/Meta.js");
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/verifyToken");
const cloudinary = require("../middlewares/cloudinary");
const router = express.Router();
const fs = require("fs");
router.post("/quill/upload", verifyToken, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({message:"No Image Provided!"})
  }
  const fileData = fs.readFileSync(req.file.path);
 let imageUrl = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;
  fs.unlinkSync(req.file.path);
  res.json({ url: imageUrl,imagePublicId:'' }); // Return the Cloudinary URL
});
// Get all pages
router.get("/pages", async (req, res) => {
  const pages = await Meta.find({}, "page");
  res.json(pages.map((p) => p.page));
});

// Get meta details for a page
router.get("/:page", async (req, res) => {
  const meta = await Meta.findOne({ page: req.params.page });
  res.json(meta);
});

// Add or Update meta details
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  const { page, title, tags, description, route, content } = req.body;

  let imageUrl = "";
  let imagePublicId = "";

  // First, check if a meta document already exists
  const existingMeta = await Meta.findOne({ page });
  // console.log(req.body,req.file)
  // If a file is uploaded
  if (req.file) {
    // If there's an existing imagePublicId, delete the old image
    if (existingMeta && existingMeta.imagePublicId) {
      await cloudinary.uploader.destroy(existingMeta.imagePublicId);
    }

    // Upload the new image
    const uploadResult = await cloudinary.uploader.upload(req.file.path);
    imageUrl = uploadResult.secure_url;
    imagePublicId = uploadResult.public_id;
  } else {
    // No new file uploaded, keep old values if they exist
    if (existingMeta) {
      imageUrl = existingMeta.breadcum;
      imagePublicId = existingMeta.imagePublicId;
    }
  }

  // Update or insert the meta document
  const meta = await Meta.findOneAndUpdate(
    { page },
    { title, tags, description, route,content, imagePublicId, breadcum: imageUrl },
    { upsert: true, new: true }
  );

  res.json({ message: "Meta details saved!", meta });
});


// Delete meta details
router.delete("/:page", verifyToken, async (req, res) => {
  await Meta.findOneAndDelete({ page: req.params.page });
  res.json({ message: "Meta details deleted!" });
});

module.exports = router;
