const express = require("express");
const router = express.Router();
const { getAllAdmins, createAdmin, updateAdminRole, removeAdmin } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/", protect, adminOnly, getAllAdmins);
router.post("/", protect, adminOnly, createAdmin);
router.put("/:id/role", protect, adminOnly, updateAdminRole);
router.delete("/:id", protect, adminOnly, removeAdmin);

module.exports = router;
