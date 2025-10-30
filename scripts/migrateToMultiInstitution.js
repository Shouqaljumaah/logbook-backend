/**
 * Migration Script: Single Institution to Multi-Institution
 *
 * This script helps migrate existing data to the new multi-institution structure
 *
 * WARNING: This is a one-time migration. Back up your database before running!
 *
 * Usage: node scripts/migrateToMultiInstitution.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Institution = require("../models/Institutions");
const User = require("../models/Users");
const FormTemplates = require("../models/FormTemplates");
const FormSubmitions = require("../models/FormSubmitions");
const FieldTemplates = require("../models/FieldTemplates");
const Announcements = require("../models/Announcements");
const Notifications = require("../models/Notifications");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/logbook";

async function migrate() {
  try {
    console.log("🔄 Starting migration to multi-institution structure...\n");

    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check if migration already done
    const existingInstitutions = await Institution.countDocuments();
    if (existingInstitutions > 0) {
      console.log(
        "⚠️  Institutions already exist. Migration may have already been run."
      );
      console.log(
        "   Do you want to continue? (This will create a new default institution)"
      );
      console.log(
        "   Press Ctrl+C to cancel or wait 5 seconds to continue...\n"
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Step 1: Create default institution
    console.log("📝 Step 1: Creating default institution...");
    const defaultInstitution = await Institution.create({
      name: process.env.DEFAULT_INSTITUTION_NAME || "Default Institution",
      code: process.env.DEFAULT_INSTITUTION_CODE || "DEFAULT",
      description: "Default institution created during migration",
      isActive: true,
    });
    console.log(
      `✅ Created institution: ${defaultInstitution.name} (ID: ${defaultInstitution._id})\n`
    );

    // Step 2: Update all existing users
    console.log("📝 Step 2: Updating existing users...");
    const usersResult = await User.updateMany(
      { institutions: { $exists: false } },
      { $set: { institutions: [defaultInstitution._id] } }
    );
    console.log(`✅ Updated ${usersResult.modifiedCount} users\n`);

    // Step 3: Update all form templates
    console.log("📝 Step 3: Updating form templates...");
    const templatesResult = await FormTemplates.updateMany(
      { institution: { $exists: false } },
      { $set: { institution: defaultInstitution._id } }
    );
    console.log(`✅ Updated ${templatesResult.modifiedCount} form templates\n`);

    // Step 4: Update all form submissions
    console.log("📝 Step 4: Updating form submissions...");
    const submissionsResult = await FormSubmitions.updateMany(
      { institution: { $exists: false } },
      { $set: { institution: defaultInstitution._id } }
    );
    console.log(
      `✅ Updated ${submissionsResult.modifiedCount} form submissions\n`
    );

    // Step 5: Update all field templates
    console.log("📝 Step 5: Updating field templates...");
    const fieldTemplatesResult = await FieldTemplates.updateMany(
      { institution: { $exists: false } },
      { $set: { institution: defaultInstitution._id } }
    );
    console.log(
      `✅ Updated ${fieldTemplatesResult.modifiedCount} field templates\n`
    );

    // Step 6: Update all announcements
    console.log("📝 Step 6: Updating announcements...");
    const announcementsResult = await Announcements.updateMany(
      { institution: { $exists: false } },
      { $set: { institution: defaultInstitution._id } }
    );
    console.log(
      `✅ Updated ${announcementsResult.modifiedCount} announcements\n`
    );

    // Step 7: Update all notifications
    console.log("📝 Step 7: Updating notifications...");
    const notificationsResult = await Notifications.updateMany(
      { institution: { $exists: false } },
      { $set: { institution: defaultInstitution._id } }
    );
    console.log(
      `✅ Updated ${notificationsResult.modifiedCount} notifications\n`
    );

    console.log("🎉 Migration completed successfully!\n");
    console.log("📊 Summary:");
    console.log("=====================================");
    console.log(`Users updated: ${usersResult.modifiedCount}`);
    console.log(`Form templates updated: ${templatesResult.modifiedCount}`);
    console.log(`Form submissions updated: ${submissionsResult.modifiedCount}`);
    console.log(
      `Field templates updated: ${fieldTemplatesResult.modifiedCount}`
    );
    console.log(`Announcements updated: ${announcementsResult.modifiedCount}`);
    console.log(`Notifications updated: ${notificationsResult.modifiedCount}`);
    console.log("=====================================\n");

    console.log("📝 Next steps:");
    console.log(
      "1. Create a super admin using: node scripts/createSuperAdmin.js"
    );
    console.log("2. Update existing admin users to have institution access");
    console.log("3. Test the application thoroughly");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
