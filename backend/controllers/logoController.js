const Logo = require("../models/Logo");
const fs = require("fs");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'vehicles', // The folder name in Cloudinary where files will be stored
//         allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'], // Restrict file types
//     },
// });
// Upload Logo
exports.uploadLogo = async (req, res) => {
  try {
    const fileData = fs.readFileSync(req.file.path);
        const base64Data = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;
    
        const fileType = req.file.mimetype.startsWith("video") ? "video" : "image";
    
        const newLogo = new Logo({
          mediaType: fileType,
          url: base64Data,
          mimeType: req.file.mimetype,
        });
        // Remove temp file
        await newLogo.save();
        fs.unlinkSync(req.file.path);
    res.status(201).json(newLogo);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Upload failed" });
  }
};

// Get All Logos
exports.getLogos = async (req, res) => {
  try {
    const logos = await Logo.find();
    res.status(200).json(logos);
  } catch (error) {
    res.status(500).json({ error: "Error fetching logos" });
  }
};

// Delete Logo
exports.deleteLogo = async (req, res) => {
  try {
    await Logo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Deletion failed" });
  }
};
