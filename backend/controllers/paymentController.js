const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderConfirmation } = require("../config/mailer");

// Lazy-initialize so placeholder values in .env don't crash on startup
const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// @route  POST /api/payment/create-order
// @desc   Create a Razorpay order (returns order_id to frontend)
// @access Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees from frontend

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await getRazorpay().orders.create(options);
    res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Razorpay order creation failed" });
  }
};

// @route  POST /api/payment/verify
// @desc   Verify Razorpay signature and create the order in DB
// @access Private
const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      customerNote,
    } = req.body;

    // 1. Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature. Payment not verified." });
    }

    // 2. Build order items with fresh prices from DB
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product ${item.product} not found` });
      if (!product.isAvailable) return res.status(400).json({ message: `${product.name} is unavailable` });

      totalPrice += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        uploadedImage: item.uploadedImage || "",
      });
    }

    // 3. Create order in DB as paid
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalPrice,
      customerNote: customerNote || "",
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: new Date(),
      status: "Processing", // auto-advance from Pending since payment confirmed
    });

    // Send order confirmation email (non-blocking)
    try {
      const user = await User.findById(req.user._id).select("name email");
      if (user) {
        await sendOrderConfirmation({
          toEmail: user.email,
          toName: user.name,
          order: { ...order.toObject(), user: { name: user.name, email: user.email } },
        });
      }
    } catch (_) {}

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || "Payment verification failed" });
  }
};

// @route  GET /api/payment/stats
// @desc   Payment summary stats for admin
// @access Admin
const getPaymentStats = async (req, res) => {
  try {
    const [razorpayRevenue] = await Order.aggregate([
      { $match: { paymentMethod: "razorpay", paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]);

    const [codRevenue] = await Order.aggregate([
      { $match: { paymentMethod: "cod" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]);

    const [refundedRevenue] = await Order.aggregate([
      { $match: { paymentStatus: "refunded" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]);

    res.json({
      razorpay: { total: razorpayRevenue?.total || 0, count: razorpayRevenue?.count || 0 },
      cod: { total: codRevenue?.total || 0, count: codRevenue?.count || 0 },
      refunded: { total: refundedRevenue?.total || 0, count: refundedRevenue?.count || 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/payment/:orderId/refund
// @desc   Mark an order as refunded (admin)
// @access Admin
const markRefunded = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = "refunded";
    order.status = "Cancelled";
    const updated = await order.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getPaymentStats,
  markRefunded,
};
