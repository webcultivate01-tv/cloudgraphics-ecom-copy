const Inquiry = require("../models/Inquiry");
const {
  sendInquiryToAdmin,
  sendInquiryConfirmationToUser,
  sendInquiryResponseToUser,
} = require("../config/mailer");

// @desc  Submit a new inquiry
// @route POST /api/inquiry
// @access Public
const createInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const inquiry = await Inquiry.create({ name, email, phone, subject, message });

    // Notify admin (non-blocking)
    sendInquiryToAdmin({ name, email, phone, subject, message }).catch(() => {});

    // Confirmation to user (non-blocking)
    sendInquiryConfirmationToUser({ toEmail: email, toName: name, subject }).catch(() => {});

    res.status(201).json({ message: "Inquiry submitted successfully", inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get all inquiries (admin)
// @route GET /api/inquiry
// @access Admin
const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get count of pending inquiries (admin — for notification badge)
// @route GET /api/inquiry/pending-count
// @access Admin
const getPendingCount = async (req, res) => {
  try {
    const count = await Inquiry.countDocuments({ status: "pending" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Delete an inquiry
// @route DELETE /api/inquiry/:id
// @access Admin
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json({ message: "Inquiry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Respond to an inquiry — sends reply email and marks as responded
// @route PATCH /api/inquiry/:id/respond
// @access Admin
const respondToInquiry = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    if (!adminResponse || !adminResponse.trim()) {
      return res.status(400).json({ message: "Response message is required" });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    inquiry.adminResponse = adminResponse.trim();
    inquiry.status = "responded";
    await inquiry.save();

    // Send reply to user (non-blocking)
    sendInquiryResponseToUser({
      toEmail: inquiry.email,
      toName:  inquiry.name,
      subject: inquiry.subject,
      adminResponse: inquiry.adminResponse,
    }).catch(() => {});

    res.json({ message: "Response sent successfully", inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  getPendingCount,
  deleteInquiry,
  respondToInquiry,
};
