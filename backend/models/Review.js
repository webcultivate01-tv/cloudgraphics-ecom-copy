const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },
    status:  { type: String, enum: ["pending", "approved"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
