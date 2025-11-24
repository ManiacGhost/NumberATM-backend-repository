const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { generateInvoice } = require("../controllers/invoiceController");
const router = express.Router();

router.get("/:id",authMiddleware, generateInvoice);

module.exports = router;
