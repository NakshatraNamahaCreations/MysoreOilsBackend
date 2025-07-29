const express = require("express");
const router = express.Router();
const categoryController = require("../Controllers/categoryController");

router.post("/", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;