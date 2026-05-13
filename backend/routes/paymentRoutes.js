const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getPaymentStats,
  markRefunded,
} = require("../controllers/paymentController");

// User routes (must be logged in)
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPaymentAndCreateOrder);

// Admin routes
router.get("/stats", protect, adminOnly, getPaymentStats);
router.put("/:orderId/refund", protect, adminOnly, markRefunded);

module.exports = router;
