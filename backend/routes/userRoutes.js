const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  checkLogin,
  loginUserByOtp,
} = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// CRUD Routes
router.post("/register", registerUser);
router.post("/otp/login", loginUserByOtp);
router.post("/login", loginUser);
router.get("/check-login", authMiddleware, checkLogin);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/",authMiddleware, updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
