const mongoose = require("mongoose");
const User = require("../models/Users");
const Institution = require("../models/Institutions");
require("dotenv").config();

/**
 * Migration Script: Convert old institutions array to institutionRoles
 *
 * This script migrates users from the old structure:
 *   - institutions: [ObjectId, ObjectId, ...]
 *   - roles: ["tutor", "resident"]
 *
 * To the new structure:
 *   - institutionRoles: [
 *       { institution: ObjectId, role: "tutor", assignedAt: Date },
 *       { institution: ObjectId, role: "resident", assignedAt: Date }
 *     ]
 */

async function migrateToInstitutionRoles() {
  try {
    // Connect to database (using same connection as app)
    console.log("Connecting to database...");
    await mongoose.connect(
      "mongodb+srv://kuw1992:Wts1TBZOvizAzNMJ@cluster0.y5iri.mongodb.net/"
    );
    console.log("✓ Connected to database\n");

    // Find all users that need migration
    // (users with institutions but empty or missing institutionRoles)
    const usersToMigrate = await User.find({
      $and: [
        { institutions: { $exists: true, $ne: [] } },
        {
          $or: [
            { institutionRoles: { $exists: false } },
            { institutionRoles: { $size: 0 } },
          ],
        },
      ],
    });

    console.log(`Found ${usersToMigrate.length} users to migrate\n`);

    if (usersToMigrate.length === 0) {
      console.log("No users need migration. All done! ✓");
      await mongoose.connection.close();
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of usersToMigrate) {
      try {
        console.log(`\nMigrating user: ${user.username} (${user._id})`);
        console.log(`  - Institutions: ${user.institutions.length}`);
        console.log(`  - Current roles: ${user.roles.join(", ") || "none"}`);

        // Determine default role for this user
        // Priority: use first role from roles array, or check if they're in Institution.admins
        let defaultRole = "resident"; // fallback

        if (user.roles && user.roles.length > 0) {
          // Get the first non-superadmin role
          const regularRole = user.roles.find((r) => r !== "superadmin");
          if (regularRole) {
            defaultRole = regularRole;
          }
        }

        // Build institutionRoles array
        const institutionRoles = [];

        for (const institutionId of user.institutions) {
          // Check if user is admin of this institution
          const institution = await Institution.findById(institutionId);

          let roleForThisInstitution = defaultRole;

          if (institution && institution.admins) {
            const isAdmin = institution.admins.some(
              (adminId) => adminId.toString() === user._id.toString()
            );
            if (isAdmin) {
              roleForThisInstitution = "admin";
            }
          }

          institutionRoles.push({
            institution: institutionId,
            role: roleForThisInstitution,
            assignedAt: new Date(),
            assignedBy: null, // Migration, no assigner
          });

          console.log(
            `  - Added: ${
              institution?.name || institutionId
            } as ${roleForThisInstitution}`
          );
        }

        // Update user with new institutionRoles
        user.institutionRoles = institutionRoles;
        await user.save();

        migratedCount++;
        console.log(`  ✓ Successfully migrated ${user.username}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Error migrating user ${user.username} (${user._id}): ${error.message}`;
        console.error(`  ✗ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users found: ${usersToMigrate.length}`);
    console.log(`Successfully migrated: ${migratedCount} ✓`);
    console.log(`Errors: ${errorCount} ✗`);

    if (errors.length > 0) {
      console.log("\nErrors encountered:");
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

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
console.log("=".repeat(60));
console.log("MIGRATION: Old institutions → institutionRoles");
console.log("=".repeat(60));
console.log();

migrateToInstitutionRoles();
