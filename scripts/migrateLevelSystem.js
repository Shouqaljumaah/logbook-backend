const mongoose = require("mongoose");
const User = require("../models/Users");
const FormTemplates = require("../models/FormTemplates");
const FieldTemplates = require("../models/FieldTemplates");

const MONGO_URI =
  "mongodb+srv://kuw1992:Wts1TBZOvizAzNMJ@cluster0.y5iri.mongodb.net/";

async function migrateLevelSystem() {
  try {
    console.log("============================================================");
    console.log("MIGRATION: Institution-Specific Level System");
    console.log(
      "============================================================\n"
    );

    // Connect to database
    console.log("Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to database\n");

    // ========================================
    // PART 1: Migrate Users - Add level to institutionRoles
    // ========================================
    console.log("PART 1: Migrating Users");
    console.log("----------------------------------------");

    const users = await User.find({ institutionRoles: { $exists: true } });
    console.log(`Found ${users.length} users to check\n`);

    let userUpdatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Check if any institutionRole is missing the level field
      for (const ir of user.institutionRoles) {
        if (ir.level === undefined) {
          // Use user's old global level if available, otherwise empty
          ir.level = user.level || "";
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await user.save();
        userUpdatedCount++;
        console.log(
          `✓ Updated user: ${user.username} - Added levels to institutionRoles`
        );
      }
    }

    console.log(`\n✓ Updated ${userUpdatedCount} users\n`);

    // ========================================
    // PART 2: Migrate FormTemplates - Add level restriction fields
    // ========================================
    console.log("PART 2: Migrating FormTemplates");
    console.log("----------------------------------------");

    const formTemplates = await FormTemplates.find({});
    console.log(`Found ${formTemplates.length} form templates to check\n`);

    let formUpdatedCount = 0;

    for (const form of formTemplates) {
      let needsUpdate = false;

      if (form.minLevel === undefined) {
        form.minLevel = "";
        needsUpdate = true;
      }

      if (form.maxLevel === undefined) {
        form.maxLevel = "";
        needsUpdate = true;
      }

      if (form.levelRestricted === undefined) {
        form.levelRestricted = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await form.save();
        formUpdatedCount++;
        console.log(`✓ Updated form template: ${form.formName}`);
      }
    }

    console.log(`\n✓ Updated ${formUpdatedCount} form templates\n`);

    // ========================================
    // PART 3: Migrate FieldTemplates - Convert options to optionsWithLevels
    // ========================================
    console.log("PART 3: Migrating FieldTemplates");
    console.log("----------------------------------------");

    const fieldTemplates = await FieldTemplates.find({
      $or: [
        { options: { $exists: true, $ne: [] } },
        { scaleOptions: { $exists: true, $ne: [] } },
      ],
    });
    console.log(`Found ${fieldTemplates.length} field templates to check\n`);

    let fieldUpdatedCount = 0;

    for (const field of fieldTemplates) {
      const updateFields = {};

      // Initialize optionsWithLevels if it doesn't exist
      if (!field.optionsWithLevels || field.optionsWithLevels.length === 0) {
        // Convert regular options to optionsWithLevels
        if (field.options && field.options.length > 0) {
          updateFields.optionsWithLevels = field.options.map((opt) => ({
            value: opt,
            minLevel: "", // No level restriction by default
            label: opt,
          }));
        }
        // Convert scaleOptions to optionsWithLevels
        else if (field.scaleOptions && field.scaleOptions.length > 0) {
          updateFields.optionsWithLevels = field.scaleOptions.map((opt) => ({
            value: opt,
            minLevel: "",
            label: opt,
          }));
        }
      }

      // Set hasLevelRestrictions if not set
      if (field.hasLevelRestrictions === undefined) {
        updateFields.hasLevelRestrictions = false;
      }

      if (Object.keys(updateFields).length > 0) {
        await FieldTemplates.updateOne(
          { _id: field._id },
          { $set: updateFields }
        );
        fieldUpdatedCount++;
        console.log(
          `✓ Updated field template: ${field.name} (${field.type}) - ${
            updateFields.optionsWithLevels?.length || 0
          } options`
        );
      }
    }

    console.log(`\n✓ Updated ${fieldUpdatedCount} field templates\n`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log("============================================================");
    console.log("MIGRATION SUMMARY");
    console.log("============================================================");
    console.log(`Users updated: ${userUpdatedCount}`);
    console.log(`Form templates updated: ${formUpdatedCount}`);
    console.log(`Field templates updated: ${fieldUpdatedCount}`);
    console.log("\n✓ Migration complete!");

    // Close database connection
    await mongoose.connection.close();
    console.log("✓ Database connection closed");
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateLevelSystem();
