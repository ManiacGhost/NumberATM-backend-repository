const mongoose = require("mongoose");

const vipNumberSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  view: { type: String },
  price: { type: Number, required: true },
  category: [{ type: String }],
  stock: { type: Number,default:1 },
  sum: { type: Number },
  total: { type: Number },
  sum2: { type: Number },
  highLightedNumber: {type: String},
  discount: { type: Number},
  margin: { type: Number },
  featured: { type: Boolean,default:false},
  ordered: { type: Boolean,default:false},
  saleTime: {type : Date},
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
},{timestamps:true});


// Fix: Prevent overwriting the model if it already exists
const VIPNumber = mongoose.models.VIPNumber || mongoose.model("VIPNumber", vipNumberSchema);

module.exports = VIPNumber;
