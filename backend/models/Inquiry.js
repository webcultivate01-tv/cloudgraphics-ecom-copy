const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status:  { type: String, enum: ["pending", "responded"], default: "pending" },
    adminResponse: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
