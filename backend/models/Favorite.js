const mongoose = require("mongoose");

const favSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      vipNumberId: { type: mongoose.Schema.Types.ObjectId, ref: "VIPNumber", required: true}
    }
  ],
}, { timestamps: true });


module.exports = mongoose.model("Fav", favSchema);
