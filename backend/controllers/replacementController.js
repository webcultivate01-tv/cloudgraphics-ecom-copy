const Replacement = require("../models/Replacement");
const Order       = require("../models/Order");
const User        = require("../models/User");
const { sendReplacementStatusUpdate } = require("../config/mailer");

const REPLACEMENT_WINDOW_DAYS = 7;

// ── Helpers ──────────────────────────────────────────────────

const isWithinWindow = (deliveredAt) => {
  if (!deliveredAt) return false;
  const cutoff = new Date(deliveredAt);
  cutoff.setDate(cutoff.getDate() + REPLACEMENT_WINDOW_DAYS);
  return new Date() <= cutoff;
};

const notifyUser = async (replacement, status, adminResponse = "") => {
  try {
    const user = await User.findById(replacement.user).select("name email");
    if (user?.email) {
      await sendReplacementStatusUpdate({
        toEmail: user.email,
        toName:  user.name,
        productName: replacement.productName,
        status,
        adminResponse,
      });
    }
  } catch (_) {}
};

// ── Controllers ──────────────────────────────────────────────

// @desc  Submit a replacement request
// @route POST /api/replacement
// @access Private
const createReplacement = async (req, res) => {
  try {
    const { orderId, productName, productId, reason, description, images, deliveryDate } = req.body;

    // Basic field validation
    if (!orderId || !productName || !reason || !description) {
      return res.status(400).json({ message: "orderId, productName, reason, and description are required" });
    }
    if (!images || !Array.isArray(images) || images.length < 1) {
      return res.status(400).json({ message: "At least 1 image is required" });
    }
    if (images.length > 5) {
      return res.status(400).json({ message: "Maximum 5 images allowed" });
    }

    // Verify order ownership and status
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to request replacement for this order" });
    }
    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Replacement can only be requested for delivered orders" });
    }

    // Enforce 7-day window
    const effectiveDeliveredAt = order.deliveredAt || order.updatedAt;
    if (!isWithinWindow(effectiveDeliveredAt)) {
      return res.status(400).json({
        message: `Replacement window has expired. Requests must be submitted within ${REPLACEMENT_WINDOW_DAYS} days of delivery.`,
      });
    }

    // Prevent duplicate requests for the same order
    const existing = await Replacement.findOne({ order: orderId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted a replacement request for this order" });
    }

    const replacement = await Replacement.create({
      user:        req.user._id,
      order:       orderId,
      productName,
      productId:   productId || null,
      reason,
      description,
      images,
      deliveryDate: effectiveDeliveredAt,
    });

    res.status(201).json({ message: "Replacement request submitted successfully", replacement });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get replacement requests for the logged-in user
// @route GET /api/replacement/user
// @access Private
const getUserReplacements = async (req, res) => {
  try {
    const replacements = await Replacement.find({ user: req.user._id })
      .populate("order", "items totalPrice createdAt status")
      .sort({ createdAt: -1 });
    res.json(replacements);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get all replacement requests (admin)
// @route GET /api/replacement/admin
// @access Admin
const getAllReplacements = async (req, res) => {
  try {
    const replacements = await Replacement.find()
      .populate("user",  "name email phone")
      .populate("order", "items totalPrice createdAt status")
      .sort({ createdAt: -1 });
    res.json(replacements);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ── Status update helper ─────────────────────────────────────

const setStatus = (newStatus) => async (req, res) => {
  try {
    const replacement = await Replacement.findById(req.params.id);
    if (!replacement) return res.status(404).json({ message: "Replacement request not found" });

    const { adminResponse } = req.body;

    replacement.status = newStatus;
    if (adminResponse !== undefined) replacement.adminResponse = adminResponse.trim();
    await replacement.save();

    // Email notification (non-blocking)
    notifyUser(replacement, newStatus, replacement.adminResponse);

    res.json({ message: `Replacement marked as ${newStatus}`, replacement });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Approve replacement
// @route PATCH /api/replacement/:id/approve
// @access Admin
const approveReplacement = setStatus("approved");

// @desc  Reject replacement (optionally with reason in adminResponse)
// @route PATCH /api/replacement/:id/reject
// @access Admin
const rejectReplacement = setStatus("rejected");

// @desc  Mark as processing
// @route PATCH /api/replacement/:id/process
// @access Admin
const processReplacement = setStatus("processing");

// @desc  Mark as completed
// @route PATCH /api/replacement/:id/complete
// @access Admin
const completeReplacement = setStatus("completed");

// @desc  Delete replacement (admin)
// @route DELETE /api/replacement/:id
// @access Admin
const deleteReplacement = async (req, res) => {
  try {
    const replacement = await Replacement.findByIdAndDelete(req.params.id);
    if (!replacement) return res.status(404).json({ message: "Replacement request not found" });
    res.json({ message: "Replacement request deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  createReplacement,
  getUserReplacements,
  getAllReplacements,
  approveReplacement,
  rejectReplacement,
  processReplacement,
  completeReplacement,
  deleteReplacement,
};
