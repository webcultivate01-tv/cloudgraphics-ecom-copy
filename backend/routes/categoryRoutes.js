const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require("../controllers/categoryController");

// Public
router.get("/", getCategories);

// Admin
router.get("/admin/all", protect, adminOnly, getAllCategoriesAdmin);
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

// Subcategory admin routes
router.post("/:id/subcategories", protect, adminOnly, addSubcategory);
router.put("/:id/subcategories/:subId", protect, adminOnly, updateSubcategory);
router.delete("/:id/subcategories/:subId", protect, adminOnly, deleteSubcategory);

module.exports = router;
