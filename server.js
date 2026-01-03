// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import path from "path";
// import mongoose from "mongoose";
// import { fileURLToPath } from "url";
// import { dirname } from "path";

// // Get __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// dotenv.config();

// const app = express();

// // Middlewares
// app.use(cors({ origin: "*", credentials: true }));
// app.use(express.json({ limit: "30mb" }));
// app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// // Static uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Connect DB
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("✅ MongoDB Connected");
//   } catch (err) {
//     console.error("❌ DB connection failed:", err);
//     process.exit(1);
//   }
// };

// connectDB();

// // Routes
// import blogRoutes from './routes/blogRoutes.js';
// // import other routes the same way if needed

// app.use("/api/blogs", blogRoutes);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

// // Start server
// const PORT = process.env.PORT || 8010;
// app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));




const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

/* Routes */
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();

const app = express();

/* ===================== CORS ===================== */
const allowedOrigins = [
  "https://themysoreoils.com",
  "https://www.themysoreoils.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* ===================== BODY PARSERS ===================== */
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

/* ===================== STATIC FILES ===================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===================== ROUTES ===================== */
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payment", paymentRoutes);

/* ===================== 404 ===================== */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ===================== DB ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 8011;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
