const Promo = require("../models/Promo");
exports.getAllPromos = async (req, res) => {
  try {
      const promos = await Promo.find({ deleted: { $ne: true } }); // Exclude deleted promos
      res.json(promos);
  } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getPromos = async (req, res) => {
    try {
        const { search, type, minCartValue, usageLimit, expiryDate } = req.query;

        let filter = { deleted: { $ne: true } };

        if (search) {
            filter.code = { $regex: search, $options: "i" }; // Case-insensitive search
        }
        if (type) {
            filter.type = type;
        }
        if (minCartValue) {
            filter.minCartValue = { $gte: parseFloat(minCartValue) };
        }
        if (usageLimit) {
            filter.usageLimit = { $gte: parseInt(usageLimit) };
        }
        if (expiryDate) {
            filter.expiryDate = { $gte: new Date(expiryDate) };
        }

        const promos = await Promo.find(filter);
        res.status(200).json(promos);
    } catch (error) {
        console.error("Error fetching promos:", error);
        res.status(500).json({ message: "Failed to fetch promos" });
    }
};

//   exports.createPromo = async (req, res) => {
//     try {
//       const newPromo = await Promo.create(req.body);
//       res.status(201).json(newPromo);
//     } catch (error) {
//       res.status(500).json({ message: "Failed to create promo", error: error.message });
//     }
//   };
  
  exports.updatePromo = async (req, res) => {
    try {
      const updatedPromo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedPromo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update promo", error: error.message });
    }
  };
  
  exports.deletePromo = async (req, res) => {
    try {
      const promo = await Promo.findByIdAndUpdate(
        req.params.id,
        { $set: { deleted: true } },
        { new: true } 
      );
      if (!promo) {
        return res.status(404).json({ message: "Promo not found" });
      }
  
      res.json({ message: "Promo Code Deleted", promo });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promo", error: error.message });
    }
  };
  
// Create Promo Code (Admin Only)
exports.createPromo = async (req, res) => {
  // console.log(req.body)
  try {
    const { code, discount, type, expiryDate, minCartValue, maxDiscount, usageLimit } = req.body;

    const existingPromo = await Promo.findOne({ code });
    if (existingPromo) return res.status(400).json({ message: "Promo code already exists" });

    const promo = new Promo({
      code,
      discount,
      type,
      expiryDate,
      minCartValue,
      maxDiscount,
      usageLimit,
      createdBy: req.user.id, // Assuming user middleware provides admin ID
    });

    await promo.save();
    res.status(201).json({ message: "Promo code created successfully", promo });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.validatePromo = async (req, res) => {
    try {
      const { code, userId, cartValue } = req.body;
  
      const promo = await Promo.findOne({ code, deleted: { $ne: true } });
  
      if (!promo) return res.status(400).json({ message: "Invalid or Expired Promo Code" });
      if (new Date() > new Date(promo.expiryDate)) return res.status(400).json({ message: "Promo Code Expired" });
      if (promo.minCartValue && cartValue < promo.minCartValue) return res.status(400).json({ message: `Minimum cart value should be ${promo.minCartValue}` });
  
      if (promo.usedBy.includes(userId)) return res.status(400).json({ message: "Promo Code Already Used" });
  
      // Calculate discount
      let discountAmount = promo.type === "percentage" ? (cartValue * promo.discount) / 100 : promo.discount;
      if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
  
      res.json({ discount: discountAmount });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  
exports.applyPromo = async (req, res) => {
    try {
      const { code, userId, cartValue } = req.body;
  
      const promo = await Promo.findOne({ code, deleted: { $ne: true } });
  
      if (!promo) return res.status(400).json({ message: "Invalid Promo Code" });
      if (new Date() > new Date(promo.expiryDate)) return res.status(400).json({ message: "Promo Code Expired" });
      if (promo.minCartValue && cartValue < promo.minCartValue) return res.status(400).json({ message: `Minimum cart value should be ${promo.minCartValue}` });
      if (promo.usageLimit && promo.usedBy.length >= promo.usageLimit) return res.status(400).json({ message: "Promo Code Usage Limit Reached" });
      if (promo.usedBy.includes(userId)) return res.status(400).json({ message: "Promo Code Already Used" });
  
      // Calculate discount
      let discountAmount = promo.type === "percentage" ? (cartValue * promo.discount) / 100 : promo.discount;
      if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
  
      // Save the applied promo
      promo.usedBy.push(userId);
      await promo.save();
  
      res.json({ discount: discountAmount, message: "Promo Code Applied Successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  