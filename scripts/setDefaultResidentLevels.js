/**
 * Migration Script: Set Default R1 Level for All Residents
 *
 * This script sets R1 as the default level for all residents
 * who don't currently have a level assigned in their institutions.
 */

const mongoose = require("mongoose");
const User = require("../models/Users");

// MongoDB connection string from database.js
const MONGODB_URI =
  "mongodb+srv://kuw1992:Wts1TBZOvizAzNMJ@cluster0.y5iri.mongodb.net/";

async function setDefaultResidentLevels() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully\n");

    // Find all users with institutionRoles
    const users = await User.find({
      institutionRoles: { $exists: true, $ne: [] },
    });

    console.log(`Found ${users.length} users with institution roles\n`);

    let updatedCount = 0;
    let residentCount = 0;

    for (const user of users) {
      let userModified = false;

      user.institutionRoles.forEach((ir) => {
        // Only update residents who don't have a level or have empty level
        if (ir.role === "resident" && (!ir.level || ir.level === "")) {
          residentCount++;
          ir.level = "R1";
          userModified = true;
          console.log(
            `✓ Setting R1 for ${user.username} (${user.email}) in institution: ${ir.institution}`
          );
        }
      });

      if (userModified) {
        await user.save();
        updatedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Migration completed successfully!");
    console.log("=".repeat(50));
    console.log(`Total users processed: ${users.length}`);
    console.log(`Residents updated: ${residentCount}`);
    console.log(`Users modified: ${updatedCount}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the migration
setDefaultResidentLevels();
