/**
 * Run this ONCE to create the first admin account:
 *   node seedAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: "admin@cloudgraphics.com" });
  if (existing) {
    console.log("✅ Admin already exists");
    process.exit(0);
  }

  await User.create({
    name: "Cloud Graphics Admin",
    email: "admin@cloudgraphics.com",
    password: "admin123",   // hashed automatically by the User model
    role: "admin",
    adminRole: "superAdmin",
  });

  console.log("✅ Admin created: admin@cloudgraphics.com / admin123");
  console.log("⚠️  Change the password after first login!");
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
