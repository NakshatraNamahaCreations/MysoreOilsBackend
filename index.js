const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

/* ================= ROUTES ================= */
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); // ✅ Added

dotenv.config();

const app = express();

/* ================= CORS ================= */
app.use(
  cors({
    origin: [
      "https://admin-mysoreoils.netlify.app",
      "https://themysoreoils.com",
      "https://www.themysoreoils.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://mysore-oils2.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ================= BODY PARSER ================= */
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

/* ================= DATABASE CONNECTION ================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

connectDB();

mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to database");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose disconnected");
});

/* ================= STATIC UPLOADS ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= API ROUTES ================= */
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/payment", paymentRoutes); // ✅ Payment route added

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("Mysore Oils API Running 🚀");
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 8011;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
