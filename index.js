const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

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

/* =========================================================
   ✅ CORS CONFIGURATION (FIXED – PRODUCTION SAFE)
========================================================= */

const allowedOrigins = [
  "https://themysoreoils.com",
  "https://www.themysoreoils.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

/* =========================================================
   Body Parsers
========================================================= */
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

/* =========================================================
   MongoDB Connection
========================================================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

connectDB();

mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose disconnected");
});

/* =========================================================
   Static Files
========================================================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================================================
   API Routes
========================================================= */
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payment", paymentRoutes);

/* =========================================================
   404 Handler
========================================================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =========================================================
   Server Start
========================================================= */
const PORT = process.env.PORT || 8011;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
