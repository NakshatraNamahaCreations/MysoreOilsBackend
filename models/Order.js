// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {

//     address: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Address",
//       required: false,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     paymentMode: {
//       type: String,
//       enum: ["COD", "Online", "UPI", "Card"],
//       required: true,
//     },
//     items: [
//       {
//         productName: {
//           type: String,
//           required: true,
//         },
//         productImage: {
//           type: String,
//         },
//         price: {
//           type: Number,
//           required: true,
//         },
//         quantity: {
//           type: Number,
//           required: true,
//         },
//       },
//     ],
//     status: {
//       type: String,
//       default: "Pending",
//     },
//     paymentTransactionId: {
//   type: String,

// },

//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);


const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    merchantOrderId: { type: String, unique: true, index: true },
  customOrderId: { type: String, unique: true, index: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: "Address" },
    amount: { type: Number, required: true }, // RUPEES
    paymentMode: { type: String, enum: ["COD", "Online", "UPI", "Card"], required: true },
    items: [
      {
        productName: { type: String, required: true },
        productImage: String,
        price: { type: Number, required: true }, // RUPEES per unit
        quantity: { type: Number, required: true },
            status: { 
          type: String, 
          enum: ["Pending", "Shipped", "Delivered",], 
          default: "Pending" 
        },
      },
    ],
   status: { 
      type: String, 
      enum: ["Pending", "Paid", "Failed"], 
      default: "Pending" 
    }, 
    paymentTransactionId: { type: String },
  },
  { timestamps: true }
);


orderSchema.pre("save", async function (next) {
  if (!this.customOrderId) {
    const lastOrder = await mongoose.model("Order").findOne().sort({ createdAt: -1 });
    let newId = "MO001";
    if (lastOrder?.customOrderId) {
      const lastNum = parseInt(lastOrder.customOrderId.replace("MO", ""), 10);
      newId = `MO${String(lastNum + 1).padStart(3, "0")}`;
    }
    this.customOrderId = newId;
  }
  next();
});


module.exports = mongoose.model("Order", orderSchema);
