const express = require("express");
const { createBlog, getAllBlogs, updateBlog, deleteBlog, getBlogById } = require("../controllers/blogController");
const upload = require("../middlewares/upload");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/",verifyToken, upload.single("image"), createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/:id",verifyToken, upload.single("image"), updateBlog);
router.delete("/:id",verifyToken, deleteBlog);

module.exports = router;
