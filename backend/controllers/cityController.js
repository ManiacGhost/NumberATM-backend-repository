const City = require("../models/City");
const cloudinary = require("../middlewares/cloudinary");
exports.getCityData = async (req, res) => {
    const { slug } = req.params;

    try {
        const city = await City.findOne({ slug });
        if (!city) {
            return res.status(404).json({ message: 'City not found' });
        }

        //   const numbers = await Number.find({ city: city.name });
        //   const shuffledNumbers = numbers.sort(() => 0.5 - Math.random());

        res.json(city);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
// CREATE new city
exports.createCity = async (req, res) => {
    const { name, slug, content, title, tags, description } = req.body;
    let imageUrl = "";
      let imagePublicId = "";
    
      // First, check if a meta document already exists
      const existingCity = await City.findOne({ slug });
      // console.log(req.body,req.file)
      // If a file is uploaded
      if (req.file) {
        // If there's an existing imagePublicId, delete the old image
        if (existingCity && existingCity.imagePublicId) {
          await cloudinary.uploader.destroy(existingCity.imagePublicId);
        }
    
        // Upload the new image
        const uploadResult = await cloudinary.uploader.upload(req.file.path);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } else {
        // No new file uploaded, keep old values if they exist
        if (existingCity) {
          imageUrl = existingCity.breadcum;
          imagePublicId = existingCity.imagePublicId;
        }
      }
    try {
        const city = await City.findOneAndUpdate(
            { slug },
            { name, content, title, tags, description, imagePublicId, breadcum: imageUrl },
            { upsert: true, new: true }
        );
        res.status(201).json({ message: 'City created', city });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// UPDATE city content
exports.updateCityContent = async (req, res) => {
    const { slug } = req.params;
    const { content } = req.body;

    try {
        const city = await City.findOneAndUpdate(
            { slug },
            { content },
            { new: true }
        );

        if (!city) return res.status(404).json({ message: 'City not found' });

        res.json({ message: 'Content updated', city });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET all cities (optional for admin dropdowns)
exports.getAllCities = async (req, res) => {
    try {
        const cities = await City.find().sort({ name: 1 });
        res.json(cities);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
