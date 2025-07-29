const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueForce = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueForce + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

const productController = {
  createProduct: async (req, res) => {
    try {
      console.log("Incoming body:", req.body);
      console.log("Uploaded files:", req.files);

      const { name, category, stock, description, variants, discountPrice } = req.body;

      if (!name || !category || stock === undefined || !description || !variants) {
        return res.status(400).json({ error: "All fields are required." });
      }

      let parsedVariants = [];
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        console.error("❌ Invalid variants JSON:", e);
        return res.status(400).json({ error: "Invalid variants format." });
      }

      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        return res.status(400).json({ error: "At least one variant is required." });
      }

      if (!req.files || !req.files.images || req.files.images.length < 1 || req.files.images.length > 7) {
        return res.status(400).json({ error: "1 to 7 main images are required." });
      }

      const imagePaths = req.files.images.map((file) => `/uploads/${file.filename}`);
      const descriptionImage = req.files.descriptionImage
        ? `/uploads/${req.files.descriptionImage[0].filename}`
        : null;
      const benefitsImage = req.files.benefitsImage
        ? `/uploads/${req.files.benefitsImage[0].filename}`
        : null;
      const usesImage = req.files.usesImage
        ? `/uploads/${req.files.usesImage[0].filename}`
        : null;
      const nutritionImage = req.files.nutritionImage
        ? `/uploads/${req.files.nutritionImage[0].filename}`
        : null;

      const product = new Product({
        name,
        category,
        stock,
        description,
        variants: parsedVariants,
        images: imagePaths,
        descriptionImage,
        benefitsImage,
        usesImage,
        nutritionImage,
        discountPrice: discountPrice || 0,
        soldStock:0,
      });

      await product.save();
      console.log("✅ Product saved successfully:", product);
      res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
      console.error("🔥 Server error while creating product:", error);
      res.status(500).json({ error: "Server error while creating product" });
    }
  },

  // getAllProducts: async (req, res) => {
  //   try {
  //     const products = await Product.find();
  //     res.status(200).json(products);
  //   } catch (error) {
  //     res.status(500).json({ error: "Server error while fetching products" });
  //   }
  // },

  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: "Server error while fetching product" });
    }
  },


  getProductByName: async (req, res) => {
    try {
      const { name } = req.params;
      // Replace hyphens with spaces and perform case-insensitive search
      const productName = name.replace(/-/g, " ");
      const product = await Product.findOne({
        name: { $regex: new RegExp(`^${productName}$`, "i") },
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching product by name:", error);
      res.status(500).json({ error: "Server error while fetching product" });
    }
  },

  getAllProducts: async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching products" });
  }
},

  updateProduct: async (req, res) => {
    try {
      const { name, category, stock, description, variants, discountPrice, replacedImageIndices, newImageCount } = req.body;
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (name) product.name = name;
      if (category) product.category = category;
      if (stock !== undefined) product.stock = stock;
      if (description) product.description = description;
      if (discountPrice !== undefined) product.discountPrice = discountPrice;

      if (variants) {
        try {
          const parsedVariants = JSON.parse(variants);
          if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
            product.variants = parsedVariants;
          } else {
            return res.status(400).json({ error: "At least one variant is required." });
          }
        } catch (e) {
          return res.status(400).json({ error: "Invalid variants format." });
        }
      }

      if (req.files && req.files.images) {
        let indicesToReplace = [];
        let newImagesCount = parseInt(newImageCount || 0, 10);

        try {
          indicesToReplace = JSON.parse(replacedImageIndices || "[]");
        } catch (e) {
          return res.status(400).json({ error: "Invalid replacedImageIndices format." });
        }

        let newImages = [...product.images];

        // Replace images at specified indices
        indicesToReplace.forEach((index, i) => {
          if (i < req.files.images.length && newImages[index]) {
            const imagePath = path.join(__dirname, "..", newImages[index]);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            newImages[index] = `/uploads/${req.files.images[i].filename}`;
          }
        });

        // Append new images
        const remainingImages = req.files.images.slice(indicesToReplace.length);
        remainingImages.forEach((file) => {
          newImages.push(`/uploads/${file.filename}`);
        });

        product.images = newImages;
      }

      if (req.files) {
        if (req.files.descriptionImage) {
          if (product.descriptionImage) {
            const imagePath = path.join(__dirname, "..", product.descriptionImage);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          }
          product.descriptionImage = `/uploads/${req.files.descriptionImage[0].filename}`;
        }
        if (req.files.benefitsImage) {
          if (product.benefitsImage) {
            const imagePath = path.join(__dirname, "..", product.benefitsImage);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          }
          product.benefitsImage = `/uploads/${req.files.benefitsImage[0].filename}`;
        }
        if (req.files.usesImage) {
          if (product.usesImage) {
            const imagePath = path.join(__dirname, "..", product.usesImage);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          }
          product.usesImage = `/uploads/${req.files.usesImage[0].filename}`;
        }
        if (req.files.nutritionImage) {
          if (product.nutritionImage) {
            const imagePath = path.join(__dirname, "..", product.nutritionImage);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          }
          product.nutritionImage = `/uploads/${req.files.nutritionImage[0].filename}`;
        }
      }

      await product.save();
      res.status(200).json({ success: true, message: "Product updated successfully", product });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Server error while updating product" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const allImages = [
        ...product.images,
        product.descriptionImage,
        product.benefitsImage,
        product.usesImage,
        product.nutritionImage,
      ].filter(Boolean);

      allImages.forEach((image) => {
        const relativePath = image.startsWith("/") ? image.slice(1) : image;
        const imagePath = path.join(__dirname, "..", relativePath);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });

      await Product.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Server error while deleting product" });
    }
  },
};

module.exports = productController;