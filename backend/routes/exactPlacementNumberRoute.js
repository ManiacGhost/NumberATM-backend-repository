const express = require("express");
const {  getExactPlacementNumber } = require("../controllers/exactPlacementNumberController");
const router = express.Router();


router.get("/exactPlacement", getExactPlacementNumber);

module.exports = router;
