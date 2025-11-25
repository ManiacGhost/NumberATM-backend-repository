const express = require("express");
const {
  getAllVIPNumbers,
  addVIPNumber,
  updateVIPNumber,
  deleteVIPNumber,
  uploadVIPNumbers,
  addNumbersAsText,
  getSoldNumbers,
  deleteNumbers,
  markFeatured,
  removeFeatured,
  markAllFeatured,
  getAllFeaturedVIPNumbers,
  searchVIPNumbers,
  getVIPNumber,
  getSearchedVIPNumbers,
  getVIPNumbersbyAdmin,
  getVIPNumberByAdmin,
  uploadVIPNumbersWithVendor,
} = require("../controllers/vipNumberController");
const multer = require("multer");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { verifyToken } = require("../middlewares/verifyToken");
const { RandomVipNumbers } = require("../controllers/randomController");
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", getAllVIPNumbers);
router.get("/random", RandomVipNumbers);
router.get("/admin",verifyToken, getVIPNumbersbyAdmin);
router.get("/search", searchVIPNumbers);
router.post("/search/shop", getSearchedVIPNumbers);
router.get("/featured", getAllFeaturedVIPNumbers);
router.get("/sold", getSoldNumbers);
router.get("/:id", getVIPNumber);
router.get("/admin/:id",verifyToken, getVIPNumberByAdmin);
router.put("/mark-all-featured",verifyToken, markAllFeatured);
router.put("/mark-featured/:id",verifyToken, markFeatured);
router.put("/remove-featured/:id",verifyToken, removeFeatured);
router.post("/add-text",verifyToken, addNumbersAsText);
router.post("/upload",verifyToken,upload.single("file"), uploadVIPNumbers);
router.post("/upload/vendor",verifyToken,upload.single("file"), uploadVIPNumbersWithVendor);
router.post("/sold-update",verifyToken, deleteNumbers);
router.post("/",verifyToken, addVIPNumber);
router.put("/:id",verifyToken, updateVIPNumber);
router.delete("/:id",verifyToken, deleteVIPNumber);

module.exports = router;
