const mongoose = require("mongoose");

// Events / Announcements shown on the frontend (offers, updates, etc.)
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    // Optional CTA link (e.g. /products?category=Cup)
    link: {
      type: String,
      default: "",
    },
    // Badge text like "New Offer", "Flash Sale", "Update"
    badge: {
      type: String,
      default: "Announcement",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Expiry date — null means no expiry
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
