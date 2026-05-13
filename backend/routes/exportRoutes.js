const express = require("express");
const router  = express.Router();
const { exportOrders, exportUsers, exportProducts } = require("../controllers/exportController");
const { protect }  = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// All export routes are admin-only
router.get("/orders",   protect, adminOnly, exportOrders);
router.get("/users",    protect, adminOnly, exportUsers);
router.get("/products", protect, adminOnly, exportProducts);

module.exports = router;
