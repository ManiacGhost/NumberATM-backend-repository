const express = require("express");
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/verifyToken");
const { uploadStoreImage, getStoreImages, deleteStoreImage } = require("../controllers/shopSlider");

const router = express.Router();

router.post("/upload",verifyToken, upload.single("StoreImage"), uploadStoreImage);
router.get("/", getStoreImages);
router.delete("/:id",verifyToken, deleteStoreImage);

module.exports = router;
