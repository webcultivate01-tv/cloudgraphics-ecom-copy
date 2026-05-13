const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  requestCancelOTP,
  cancelOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Admin dashboard stats — must be before /:id
router.get("/admin/stats", protect, adminOnly, getDashboardStats);

// Admin: view all orders
router.get("/", protect, adminOnly, getAllOrders);

// User: place order
router.post("/", protect, createOrder);

// User: view their own orders
router.get("/my", protect, getMyOrders);

// User or Admin: view single order
router.get("/:id", protect, getOrderById);

// User: request OTP to cancel order (sends email)
router.post("/:id/cancel-otp", protect, requestCancelOTP);

// User: verify OTP and cancel order
router.put("/:id/cancel", protect, cancelOrder);

// Admin: change order status
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
