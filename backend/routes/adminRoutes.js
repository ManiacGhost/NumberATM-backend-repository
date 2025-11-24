const express = require('express');
const { adminLogin, checkAdmin, resetPassword } = require('../controllers/adminControllers');
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();
router.post('/login', adminLogin);
router.get("/check", checkAdmin);
router.post("/reset-password",verifyToken, resetPassword);
module.exports = router;
