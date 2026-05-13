const express = require("express");
const router = express.Router();
const {
  getActiveEvents,
  getAllEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public — frontend displays active events
router.get("/", getActiveEvents);

// Admin routes — must come before /:id
router.get("/admin/all", protect, adminOnly, getAllEventsAdmin);
router.post("/", protect, adminOnly, createEvent);
router.put("/:id", protect, adminOnly, updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);

module.exports = router;
