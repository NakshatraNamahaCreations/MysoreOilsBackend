const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config();
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
const bannerRoutes = require("./routes/bannerRoutes");
app.use("/api/banners", bannerRoutes);

// 404 (LAST)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 8011;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
