const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { upload } = require("../config/cloudinary");

// Public routes
router.get("/", getProducts);

// Admin only — must come before /:id to avoid conflict
router.get("/admin/all", protect, adminOnly, getAllProductsAdmin);

// Public route
router.get("/:id", getProductById);

// Admin routes (with optional multi-image upload — up to 10 images per product)
router.post("/", protect, adminOnly, upload.array("images", 10), createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 10), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
