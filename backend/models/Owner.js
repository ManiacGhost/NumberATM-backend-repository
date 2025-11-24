const mongoose = require("mongoose");

const OwnerSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    discount: { type: Number, required: false, default: 0 },
    showCased: { type: Boolean, default:true },
    margins: [
        {
          minPrice: { type: Number, required: true },
          maxPrice: { type: Number, required: true },
          marginPercent: { type: Number, required: true },
        },
      ],
});

const Owner = mongoose.model("Owner", OwnerSchema);
module.exports = Owner;
