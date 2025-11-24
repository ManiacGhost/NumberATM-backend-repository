const express = require("express");
const router = express.Router();
const Margin = require("../models/Margin");

// GET all margins
router.get("/", async (req, res) => {
  try {
    const margins = await Margin.find().sort({ minPrice: 1 });
    res.json(margins);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch margins" });
  }
});

// ADD a new margin
router.post("/", async (req, res) => {
  const { minPrice, maxPrice, marginPercent } = req.body;

  if (minPrice == null || maxPrice == null || marginPercent == null) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newMargin = new Margin({ minPrice, maxPrice, marginPercent });
    await newMargin.save();
    res.status(201).json(newMargin);
  } catch (err) {
    res.status(500).json({ error: "Failed to add margin" });
  }
});

// UPDATE a specific margin
router.put("/:id", async (req, res) => {
  const { minPrice, maxPrice, marginPercent } = req.body;

  try {
    const updated = await Margin.findByIdAndUpdate(
      req.params.id,
      { minPrice, maxPrice, marginPercent },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update margin" });
  }
});

// DELETE a margin
router.delete("/:id", async (req, res) => {
  try {
    await Margin.findByIdAndDelete(req.params.id);
    res.json({ message: "Margin deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete margin" });
  }
});

module.exports = router;
