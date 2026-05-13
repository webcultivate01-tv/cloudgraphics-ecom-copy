const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, toggleBlockUser, deleteUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserById);
router.put("/:id/block", protect, adminOnly, toggleBlockUser);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
