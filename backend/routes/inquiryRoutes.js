const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getAllInquiries,
  getPendingCount,
  deleteInquiry,
  respondToInquiry,
} = require("../controllers/inquiryController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public: submit inquiry
router.post("/", createInquiry);

// Admin: list all inquiries
router.get("/", protect, adminOnly, getAllInquiries);

// Admin: pending count for notification badge
router.get("/pending-count", protect, adminOnly, getPendingCount);

// Admin: delete inquiry
router.delete("/:id", protect, adminOnly, deleteInquiry);

// Admin: respond to inquiry
router.patch("/:id/respond", protect, adminOnly, respondToInquiry);

module.exports = router;
