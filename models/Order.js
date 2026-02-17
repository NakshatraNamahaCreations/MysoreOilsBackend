const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
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
      enum: ["COD", "ONLINE", "Online"],
      required: true,
    },

    paymentGateway: {
      type: String,
      enum: ["PHONEPE"],
      default: "PHONEPE",
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Payment Pending",
        "Paid",
        "Payment Failed",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Payment Pending",
    },

   merchantOrderId: {
  type: String,
  unique: true,
  sparse: true,
},



    transactionId: {
      type: String,
    },

    shipcorrectOrderNo: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
