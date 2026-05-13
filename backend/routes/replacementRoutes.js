const express = require("express");
const router  = express.Router();
const {
  createReplacement,
  getUserReplacements,
  getAllReplacements,
  approveReplacement,
  rejectReplacement,
  processReplacement,
  completeReplacement,
  deleteReplacement,
} = require("../controllers/replacementController");
const { protect }   = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Admin: must come before /:id routes
router.get("/admin",    protect, adminOnly, getAllReplacements);

// User: submit request
router.post("/",        protect, createReplacement);

// User: own requests
router.get("/user",     protect, getUserReplacements);

// Admin: status actions
router.patch("/:id/approve",  protect, adminOnly, approveReplacement);
router.patch("/:id/reject",   protect, adminOnly, rejectReplacement);
router.patch("/:id/process",  protect, adminOnly, processReplacement);
router.patch("/:id/complete", protect, adminOnly, completeReplacement);

// Admin: delete
router.delete("/:id", protect, adminOnly, deleteReplacement);

module.exports = router;
