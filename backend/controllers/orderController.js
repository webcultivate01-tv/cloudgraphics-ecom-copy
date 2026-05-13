const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendCancelOTP, sendOrderConfirmation, sendOrderStatusUpdate } = require("../config/mailer");

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (logged-in users)
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, customerNote, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // Build order items with current prices from DB
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ message: `${product.name} is currently unavailable` });
      }

      const lineTotal = product.price * item.quantity;
      totalPrice += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        uploadedImage: item.uploadedImage || "", // Cloudinary URL from frontend upload
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalPrice,
      customerNote,
      paymentMethod: paymentMethod === "razorpay" ? "razorpay" : "cod",
      paymentStatus: "pending",
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders for the logged-in user
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name image category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a specific order by ID (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product", "name image category");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the owner or an admin can view the order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin) with optional date filter
// @route   GET /api/orders?filter=today|3days|7days|30days&from=DATE&to=DATE
// @access  Admin
const getAllOrders = async (req, res) => {
  try {
    const { filter, from, to, status } = req.query;
    const query = {};

    // Date range filter
    const now = new Date();
    if (filter) {
      const daysMap = { today: 0, "3days": 3, "7days": 7, "30days": 30 };
      const days = daysMap[filter];
      if (days !== undefined) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        if (days > 0) start.setDate(start.getDate() - days);
        query.createdAt = { $gte: start };
      }
    } else if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    // Status filter
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .populate("items.product", "name category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Fetch the order first to check if it was cancelled by the user
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found" });

    // If the user cancelled this order, admin cannot change its status
    if (existing.cancelledBy === "user") {
      return res.status(403).json({
        message: "This order was cancelled by the customer and cannot be modified.",
      });
    }

    const updateFields = { status };
    if (status === "Delivered") updateFields.deliveredAt = new Date();
    // Track admin cancellation
    if (status === "Cancelled") updateFields.cancelledBy = "admin";

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send status update email to the customer (non-blocking)
    try {
      if (order.user?.email) {
        await sendOrderStatusUpdate({
          toEmail: order.user.email,
          toName: order.user.name,
          orderId: order._id.toString(),
          status,
          totalPrice: order.totalPrice,
          items: order.items,
        });
      }
    } catch (_) {}

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin dashboard stats
// @route   GET /api/orders/admin/stats
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const User = require("../models/User");

    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await require("../models/Product").countDocuments();

    // Sum revenue: paid online + all COD orders
    const revenueResult = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: "paid" },
            { paymentMethod: "cod", status: { $nin: ["Cancelled"] } },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Order count by status
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({ totalOrders, totalUsers, totalProducts, totalRevenue, statusCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a 6-digit OTP to user's email to confirm cancellation
// @route   POST /api/orders/:id/cancel-otp
// @access  Private
const requestCancelOTP = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised" });
    }

    const cancellable = ["Pending", "Processing"];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order that is already "${order.status}"` });
    }

    // Generate 6-digit OTP, valid for 10 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    order.cancelOTP = otp;
    order.cancelOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await order.save();

    await sendCancelOTP({
      toEmail: order.user.email,
      toName: order.user.name,
      orderId: order._id.toString(),
      otp,
    });

    res.json({ message: `OTP sent to ${order.user.email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and cancel the order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised to cancel this order" });
    }

    const cancellable = ["Pending", "Processing"];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order that is already "${order.status}"` });
    }

    // Verify OTP
    if (!order.cancelOTP || !order.cancelOTPExpiry) {
      return res.status(400).json({ message: "No OTP requested. Please request a new OTP first." });
    }
    if (new Date() > order.cancelOTPExpiry) {
      order.cancelOTP = null; order.cancelOTPExpiry = null; await order.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    if (order.cancelOTP !== otp.trim()) {
      return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
    }

    // OTP valid — if the order was paid online, auto-refund via Razorpay
    if (
      order.paymentMethod === "razorpay" &&
      order.paymentStatus === "paid" &&
      order.razorpayPaymentId
    ) {
      try {
        await getRazorpay().payments.refund(order.razorpayPaymentId, {
          amount: Math.round(order.totalPrice * 100), // paise
          speed: "normal",
          notes: { reason: "Customer requested cancellation" },
        });
        order.paymentStatus = "refunded";
      } catch (refundErr) {
        console.error("Razorpay auto-refund failed:", refundErr.message);
        // Still cancel the order; admin can process refund manually
      }
    }

    order.status = "Cancelled";
    order.cancelledBy = "user";
    order.cancelOTP = null;
    order.cancelOTPExpiry = null;
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
  requestCancelOTP,
  cancelOrder,
};
