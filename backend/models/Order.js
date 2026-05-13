const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  uploadedImage: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],

    shippingAddress: {
      fullName:    { type: String, required: true },
      phone:       { type: String, required: true },
      address:     { type: String, required: true },
      addressLine2:{ type: String, default: "" },
      landmark:    { type: String, default: "" },
      city:        { type: String, required: true },
      state:       { type: String, default: "" },
      pincode:     { type: String, required: true },
      addressType: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    customerNote: {
      type: String,
      default: "",
    },

    // Payment info
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    paidAt: { type: Date, default: null },

    // Set when admin marks the order as Delivered — used for 7-day replacement window
    deliveredAt: { type: Date, default: null },

    // Cancellation OTP (cleared after use)
    cancelOTP:       { type: String, default: null },
    cancelOTPExpiry: { type: Date,   default: null },

    // Who cancelled: 'user' = customer self-cancelled, 'admin' = admin cancelled
    cancelledBy: { type: String, enum: ["user", "admin"], default: null },

    // Filled when admin ships via Shiprocket
    shipment: {
      shiprocketOrderId: { type: String, default: "" },
      shipmentId:  { type: String, default: "" },
      trackingId:  { type: String, default: "" },
      courierName: { type: String, default: "" },
      shippedAt:   { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
