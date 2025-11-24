const express = require("express");
const { uploadPoster, getPosters, deletePoster } = require("../controllers/posterController");
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/upload",verifyToken, upload.single("poster"), uploadPoster);
router.get("/", getPosters);
router.delete("/:id",verifyToken, deletePoster);

module.exports = router;
