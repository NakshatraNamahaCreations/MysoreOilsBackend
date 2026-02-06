const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ["COD", "Online", "UPI", "Card"],
    required: true,
  },
  productImage: {
    type: String,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Pending", // can be "Pending", "Confirmed", "Delivered", etc.
  },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);