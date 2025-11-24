const Poster = require("../models/Poster");
const fs = require("fs");
const path = require("path");

// ✅ Upload Poster (Image/Video/YouTube)
exports.uploadPoster = async (req, res) => {
  try {
    const { youtubeLink } = req.body;

    // --- YouTube Link ---
    if (youtubeLink) {
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      if (!youtubeRegex.test(youtubeLink)) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      const newPoster = new Poster({
        mediaType: "youtube",
        image: youtubeLink,
      });

      await newPoster.save();
      return res.status(201).json({ message: "YouTube video added successfully!", newPoster });
    }

    // --- File Upload ---
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileData = fs.readFileSync(req.file.path);
    const base64Data = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;

    const fileType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const newPoster = new Poster({
      mediaType: fileType,
      image: base64Data,
      mimeType: req.file.mimetype,
    });

    await newPoster.save();

    // Remove temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: "Media uploaded successfully!", newPoster });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Fetch All Posters (Sorted by latest)
exports.getPosters = async (req, res) => {
  try {
    const posters = await Poster.find().sort({ createdAt: -1 });

    // Frontend can use Base64 directly for images/videos
    res.status(200).json(posters);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Poster (Image/Video/YouTube)
exports.deletePoster = async (req, res) => {
  try {
    const { id } = req.params;
    const poster = await Poster.findById(id);

    if (!poster) {
      return res.status(404).json({ message: "Poster not found" });
    }

    // Delete from DB
    await Poster.findByIdAndDelete(id);

    res.status(200).json({ message: "Media deleted successfully!" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
};
