const express = require("express");
const { uploadLogo, getLogos, deleteLogo } = require("../controllers/logoController");
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/",verifyToken, upload.single("logo"), uploadLogo);
router.get("/", getLogos);
router.delete("/:id",verifyToken, deleteLogo);

module.exports = router;
