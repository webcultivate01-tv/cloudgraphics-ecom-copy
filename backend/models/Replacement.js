const mongoose = require("mongoose");

const replacementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    // Snapshot of which product / item in the order this is for
    productName: { type: String, required: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    reason:      { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // Cloudinary URLs (min 1, max 5)
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 5,
        message:   "Between 1 and 5 images are required",
      },
    },

    // Copied from order.deliveredAt at creation time for quick access
    deliveryDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "completed"],
      default: "pending",
    },

    adminResponse: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Replacement", replacementSchema);
