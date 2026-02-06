const Category = require("../models/Category");

const categoryController = {
  createCategory: async (req, res) => {
    try {
      const { category, status } = req.body;
      if (!category || !status) return res.status(400).json({ error: "Category and Status are required" });

      const existing = await Category.findOne({ name: category });
      if (existing) return res.status(400).json({ error: "Category already exists" });

      const newCat = new Category({ name: category, status });
      await newCat.save();

      res.status(201).json({ message: "Category created successfully", category: newCat });
    } catch (error) {
      res.status(500).json({ error: "Server error while creating category" });
    }
  },

  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find().sort({ createdAt: -1 });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: "Server error while fetching categories" });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { category, status } = req.body;

      const updated = await Category.findByIdAndUpdate(
        id,
        { name: category, status },
        { new: true, runValidators: true }
      );

      if (!updated) return res.status(404).json({ error: "Category not found" });

      res.status(200).json({ message: "Category updated successfully", category: updated });
    } catch (error) {
      res.status(500).json({ error: "Server error while updating category" });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Category.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Category not found" });

      res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error while deleting category" });
    }
  }
};

module.exports = categoryController;