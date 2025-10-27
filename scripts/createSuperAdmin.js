/**
 * Script to create the first super admin user
 * Run this script once to create the initial super admin
 * Usage: node scripts/createSuperAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/Users");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/logbook";

async function createSuperAdmin() {
  try {
    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
    if (existingSuperAdmin) {
      console.log("Super admin already exists:");
      console.log(`Username: ${existingSuperAdmin.username}`);
      console.log("No new super admin created.");
      process.exit(0);
    }

    // Get credentials from environment or use defaults
    const username = process.env.SUPER_ADMIN_USERNAME || "superadmin";
    const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.error(`Error: Username '${username}' already exists`);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create super admin
    const superAdmin = await User.create({
      username,
      password: hashedPassword,
      roles: ["superadmin"],
      isSuperAdmin: true,
      isFirstLogin: false,
      institutions: [], // Super admin has access to all institutions
    });

    console.log("\n✅ Super admin created successfully!");
    console.log("=====================================");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("=====================================");
    console.log(
      "\n⚠️  IMPORTANT: Please change this password after first login!"
    );
    console.log("\n📝 Next steps:");
    console.log("1. Login with these credentials");
    console.log("2. Create institutions at: POST /superadmin/institutions");
    console.log(
      "3. Create admin users for institutions at: POST /superadmin/users"
    );

    process.exit(0);
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();
