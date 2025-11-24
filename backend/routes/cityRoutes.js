const express = require('express');
const router = express.Router();
const { createCity,updateCityContent,getAllCities, getCityData } = require('../controllers/cityController');
const { verifyToken } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');

// Public Route
router.get('/:slug', getCityData);

// Admin Routes
router.post('/',verifyToken, upload.single("image"), createCity);
router.put('/:slug',verifyToken, updateCityContent);
router.get('/',verifyToken, getAllCities); // Optional

module.exports = router;