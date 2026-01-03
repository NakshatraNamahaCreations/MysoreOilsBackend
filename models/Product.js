const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  stock: Number,
  description: String,
  images: [String],
  descriptionImage: String,
  benefitsImage: String,
  usesImage: String,
  nutritionImage: String,

    soldStock: { type: Number, default: 0 }, 
  variants: [
    {
      quantity: { type: String, required: true }, // e.g., '500g', '1kg'
      price: { type: Number, required: true },    // e.g., 120, 150
         discountPrice: { type: Number, default: 0 },
      unit: { type: String, default: "pcs" },      // optional, if needed
    },
  ],
});

module.exports = mongoose.model("Product", productSchema);
