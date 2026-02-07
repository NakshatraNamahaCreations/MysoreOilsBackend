const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  desc: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },

  // ✅ ADD THESE
  titleColor: {
    type: String,
    default: "#ffffff",
  },
  subtitleColor: {
    type: String,
    default: "#FFD600",
  },
  descColor: {
    type: String,
    default: "#f1f1f1",
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);

