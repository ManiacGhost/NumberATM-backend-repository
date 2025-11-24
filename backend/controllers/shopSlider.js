const StoreImage = require("../models/StoreImage");
const cloudinary = require("cloudinary").v2;
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// ✅ Upload StoreImage (Image/Video) - Max 5 allowed
exports.uploadStoreImage = async (req, res) => {
  try {
    const { youtubeLink:youtubeUrl } = req.body;
    console.log(req.body)
    // Check max allowed StoreImages
    const StoreImages = await StoreImage.find();
    if (StoreImages.length >= 5) {
      return res.status(400).json({ message: "Maximum 5 StoreImages allowed. Delete one first." });
    }

    if (youtubeUrl) {
      // Validate YouTube URL
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      if (!youtubeRegex.test(youtubeUrl)) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      // Save YouTube link to DB
      const newStoreImage = new StoreImage({
        mediaType: "youtube",
        image: youtubeUrl, // Store URL
      });

      await newStoreImage.save();
      return res.status(201).json({ message: "YouTube video added successfully!", newStoreImage });
    }

    // File Upload (if no YouTube URL)
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check file type
    const fileType = path.extname(req.file.originalname).toLowerCase();
    const isVideo = [".mp4", ".mov", ".avi", ".mkv"].includes(fileType);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: isVideo ? "video" : "image",
    });

    // Save to DB
    const newStoreImage = new StoreImage({
      mediaType: isVideo ? "video" : "image",
      image: result.secure_url,
      public_id: result.public_id,
    });

    await newStoreImage.save();
    res.status(201).json({ message: "Media uploaded successfully!", newStoreImage });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// ✅ Fetch All StoreImages (Sorted)
exports.getStoreImages = async (req, res) => {
  try {
    const StoreImages = await StoreImage.find().sort({ createdAt: -1 });
    res.json(StoreImages);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete StoreImage (Image/Video)
exports.deleteStoreImage = async (req, res) => {
  try {
    const { id } = req.params;
    const storeImage = await StoreImage.findById(id);
    
    if (!storeImage) return res.status(404).json({ message: "StoreImage not found" });

    // Delete from Cloudinary
    if(storeImage.public_id){
    await cloudinary.uploader.destroy(storeImage.public_id, {
      resource_type: storeImage.mediaType === "video" ? "video" : "image",
    });}

    // Delete from DB
    await StoreImage.findByIdAndDelete(id);

    res.json({ message: "Media deleted successfully!" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
};
