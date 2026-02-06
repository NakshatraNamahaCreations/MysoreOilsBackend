const express = require("express");
const productController = require("../Controllers/productController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images are allowed"));
  },
}).fields([
  { name: "images", maxCount: 7 },
  { name: "descriptionImage", maxCount: 1 },
  { name: "benefitsImage", maxCount: 1 },
  { name: "usesImage", maxCount: 1 },
  { name: "nutritionImage", maxCount: 1 },
]);

const router = express.Router();

router
  .route("/")
  .post(upload, productController.createProduct)
  .get(productController.getAllProducts);

  router.route("/name/:name").get(productController.getProductByName);

router
  .route("/:id")
  .get(productController.getProductById)
  .put(upload, productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;