const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Get all admin accounts
// @route   GET /api/admins
// @access  Admin (superAdmin only ideally)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new admin account
// @route   POST /api/admins
// @access  Admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, adminRole } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const admin = await User.create({
      name,
      email,
      password,
      phone,
      role: "admin",
      adminRole: adminRole || "subAdmin",
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminRole: admin.adminRole,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin role (superAdmin <-> subAdmin)
// @route   PUT /api/admins/:id/role
// @access  Admin
const updateAdminRole = async (req, res) => {
  try {
    const { adminRole } = req.body;

    if (!["superAdmin", "subAdmin"].includes(adminRole)) {
      return res.status(400).json({ message: "Invalid role. Use superAdmin or subAdmin" });
    }

    // Prevent changing your own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot change your own role" });
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      { adminRole },
      { new: true }
    ).select("-password");

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove admin (demote to regular user)
// @route   DELETE /api/admins/:id
// @access  Admin
const removeAdmin = async (req, res) => {
  try {
    // Prevent self-removal
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot remove yourself" });
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      { role: "user", adminRole: null },
      { new: true }
    ).select("-password");

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({ message: `${admin.name} has been demoted to user`, admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllAdmins, createAdmin, updateAdminRole, removeAdmin };
