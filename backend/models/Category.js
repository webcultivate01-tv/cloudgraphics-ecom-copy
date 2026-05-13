const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  slug:     { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const categorySchema = new mongoose.Schema({
  name:          { type: String, required: true, unique: true, trim: true },
  slug:          { type: String, required: true, unique: true },
  description:   { type: String, default: "" },
  icon:          { type: String, default: "🏷️" },
  isActive:      { type: Boolean, default: true },
  sortOrder:     { type: Number, default: 0 },
  subcategories: [subcategorySchema],
}, { timestamps: true });

const toSlug = (str) => str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

categorySchema.pre("validate", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = toSlug(this.name);
  }
  this.subcategories.forEach((sub) => {
    if (!sub.slug) sub.slug = toSlug(sub.name);
  });
  next();
});

module.exports = mongoose.model("Category", categorySchema);
