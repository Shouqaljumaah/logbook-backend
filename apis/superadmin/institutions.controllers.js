const Institution = require("../../models/Institutions");
const User = require("../../models/Users");

// Middleware to check if user is super admin
exports.checkSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.isSuperAdmin || !user.roles.includes("superadmin")) {
      return res.status(403).json({
        message: "Access denied. Super admin privileges required.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error checking permissions",
      error: error.message,
    });
  }
};

// Get all institutions
exports.getAllInstitutionsForAdminUser = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    let query = {};

    // If not super admin, only show institutions where user is admin
    if (!requestingUser.isSuperAdmin) {
      query.admins = requestingUser._id;
    }
    // Super admin sees all institutions (no query filter)

    const institutions = await Institution.find(query)
      .populate("admins", "username email roles")
      .sort({ createdAt: -1 });
    res.json(institutions);
  } catch (error) {
    console.error("Error fetching institutions:", error);
    res.status(500).json({
      message: "Failed to fetch institutions",
      error: error.message,
    });
  }
};

// Get institution by ID
exports.getInstitutionById = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);
    const institution = await Institution.findById(req.params.id).populate(
      "admins",
      "username email roles"
    );

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if user has access to this institution
    if (!requestingUser.isSuperAdmin) {
      const isAdmin = institution.admins.some(
        (admin) => admin._id.toString() === requestingUser._id.toString()
      );
      if (!isAdmin) {
        return res.status(403).json({
          message: "You don't have access to this institution",
        });
      }
    }

    res.json(institution);
  } catch (error) {
    console.error("Error fetching institution:", error);
    res.status(500).json({
      message: "Failed to fetch institution",
      error: error.message,
    });
  }
};

// Create new institution
exports.createInstitution = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    // // Only super admins can create institutions
    // if (!requestingUser.isSuperAdmin) {
    //   return res.status(403).json({
    //     message: "Only super admins can create institutions",
    //   });
    // }

    const {
      name,
      code,
      description,
      contactEmail,
      contactPhone,
      address,
      settings,
      adminId, // Optional: ID of user to set as institution admin
    } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        message: "Name and code are required",
      });
    }

    // Check if institution with same code already exists
    const existingInstitution = await Institution.findOne({ code });
    if (existingInstitution) {
      return res.status(400).json({
        message: "Institution with this code already exists",
      });
    }

    // Handle logo upload if present
    let logo = null;
    if (req.file) {
      logo = req.file.path;
    }

    // Validate admin user if provided
    let admins = [requestingUser._id];
    // if (adminId) {
    //   const adminUser = await User.findById(adminId);
    //   if (!adminUser) {
    //     return res.status(404).json({
    //       message: "Admin user not found",
    //     });
    //   }
    //   if (!adminUser.roles.includes("admin")) {
    //     return res.status(400).json({
    //       message: "User must have admin role to be institution admin",
    //     });
    //   }
    //   admins = [adminId];
    // }

    const institution = await Institution.create({
      name,
      code,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      settings,
      isActive: true,
      admins,
    });

    // If admin was assigned, add this institution to their institutions array
    // if (adminId) {
    //   await User.findByIdAndUpdate(adminId, {
    //     $addToSet: { institutions: institution._id },
    //   });
    // }
    await User.findByIdAndUpdate(requestingUser._id, {
      $addToSet: { institutions: institution._id },
    });

    const populatedInstitution = await Institution.findById(
      institution._id
    ).populate("admins", "-password");

    res.status(201).json({
      message: "Institution created successfully",
      institution: populatedInstitution,
    });
  } catch (error) {
    console.error("Error creating institution:", error);
    if (error.code === 11000) {
      res.status(400).json({
        message: "Institution with this name or code already exists",
      });
    } else {
      res.status(500).json({
        message: "Failed to create institution",
        error: error.message,
      });
    }
  }
};

// Update institution
exports.updateInstitution = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);
    const institution = await Institution.findById(req.params.id);

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if user has permission to update this institution
    if (!requestingUser.isSuperAdmin) {
      const isAdmin = institution.admins.some(
        (admin) => admin.toString() === requestingUser._id.toString()
      );
      if (!isAdmin) {
        return res.status(403).json({
          message: "You don't have permission to update this institution",
        });
      }
    }

    const {
      name,
      code,
      description,
      contactEmail,
      contactPhone,
      address,
      isActive,
      settings,
      adminIds, // Array of user IDs to set as institution admins
    } = req.body;

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (settings !== undefined) updateData.settings = settings;

    // Handle admin updates (only super admins can change admin assignments)
    if (adminIds && Array.isArray(adminIds)) {
      // if (!requestingUser.isSuperAdmin) {
      //   return res.status(403).json({
      //     message: "Only super admins can change institution admin assignments",
      //   });
      // }

      // Validate all admin users
      const adminUsers = await User.find({ _id: { $in: adminIds } });
      if (adminUsers.length !== adminIds.length) {
        return res.status(404).json({
          message: "One or more admin users not found",
        });
      }

      // // Check all users have admin role
      // const nonAdmins = adminUsers.filter(
      //   (user) => !user.roles.includes("admin")
      // );
      // if (nonAdmins.length > 0) {
      //   return res.status(400).json({
      //     message: "All assigned users must have admin role",
      //   });
      // }

      // Remove institution from old admins who are not in new list
      const oldAdminIds = institution.admins.map((id) => id.toString());
      const removedAdmins = oldAdminIds.filter((id) => !adminIds.includes(id));
      if (removedAdmins.length > 0) {
        await User.updateMany(
          { _id: { $in: removedAdmins } },
          { $pull: { institutions: institution._id } }
        );
      }

      // Add institution to new admins
      await User.updateMany(
        { _id: { $in: adminIds } },
        { $addToSet: { institutions: institution._id } }
      );

      updateData.admins = adminIds;
    }

    // Handle logo upload if present
    if (req.file) {
      updateData.logo = req.file.path;
    }

    const updatedInstitution = await Institution.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate("admins", "-password");

    res.json({
      message: "Institution updated successfully",
      institution: updatedInstitution,
    });
  } catch (error) {
    console.error("Error updating institution:", error);
    res.status(500).json({
      message: "Failed to update institution",
      error: error.message,
    });
  }
};

// Delete institution
exports.deleteInstitution = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    // Only super admins can delete institutions
    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({
        message: "Only super admins can delete institutions",
      });
    }

    const institution = await Institution.findById(req.params.id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if institution has users
    const usersCount = await User.countDocuments({
      institutions: req.params.id,
    });
    if (usersCount > 0) {
      return res.status(400).json({
        message: `Cannot delete institution. It has ${usersCount} associated users.`,
      });
    }

    await Institution.findByIdAndDelete(req.params.id);

    res.json({
      message: "Institution deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting institution:", error);
    res.status(500).json({
      message: "Failed to delete institution",
      error: error.message,
    });
  }
};

// Toggle institution active status
exports.toggleInstitutionStatus = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    // Only super admins can toggle institution status
    if (!requestingUser.isSuperAdmin) {
      return res.status(403).json({
        message: "Only super admins can toggle institution status",
      });
    }

    const institution = await Institution.findById(req.params.id);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    institution.isActive = !institution.isActive;
    await institution.save();

    res.json({
      message: `Institution ${
        institution.isActive ? "activated" : "deactivated"
      } successfully`,
      institution,
    });
  } catch (error) {
    console.error("Error toggling institution status:", error);
    res.status(500).json({
      message: "Failed to toggle institution status",
      error: error.message,
    });
  }
};

// Get institution statistics
exports.getInstitutionStats = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);
    const institutionId = req.params.id;

    const FormTemplates = require("../../models/FormTemplates");
    const FormSubmitions = require("../../models/FormSubmitions");

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if user has access to this institution
    if (!requestingUser.isSuperAdmin) {
      const isAdmin = institution.admins.some(
        (admin) => admin.toString() === requestingUser._id.toString()
      );
      if (!isAdmin) {
        return res.status(403).json({
          message: "You don't have access to this institution's statistics",
        });
      }
    }

    // Count admins from Institution.admins[] array (not from User.institutions)
    const adminsCount = institution.admins.length;

    const [
      usersCount,
      tutorsCount,
      residentsCount,
      formTemplatesCount,
      formSubmitionsCount,
    ] = await Promise.all([
      User.countDocuments({ institutions: institutionId }),
      User.countDocuments({ institutions: institutionId, roles: "tutor" }),
      User.countDocuments({ institutions: institutionId, roles: "resident" }),
      FormTemplates.countDocuments({ institution: institutionId }),
      FormSubmitions.countDocuments({ institution: institutionId }),
    ]);

    res.json({
      usersCount,
      adminsCount, // Number of designated admins (from Institution.admins[])
      tutorsCount,
      residentsCount,
      formTemplatesCount,
      formSubmitionsCount,
    });
  } catch (error) {
    console.error("Error fetching institution stats:", error);
    res.status(500).json({
      message: "Failed to fetch institution statistics",
      error: error.message,
    });
  }
};

// Add admin to institution
exports.addAdminToInstitution = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    // Only super admins can add admins to institutions
    // if (!requestingUser.isSuperAdmin) {
    //   return res.status(403).json({
    //     message: "Only super admins can add admins to institutions",
    //   });
    // }

    const { id: institutionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if (!user.roles.includes("admin")) {
    //   return res.status(400).json({
    //     message: "User must have admin role to be institution admin",
    //   });
    // }

    // Check if already admin
    if (institution.admins.includes(userId)) {
      return res.status(400).json({
        message: "User is already an admin of this institution",
      });
    }

    // Add admin to institution
    institution.admins.push(userId);
    await institution.save();

    // Add institution to user's institutions
    if (!user.institutions.includes(institutionId)) {
      user.institutions.push(institutionId);
      await user.save();
    }

    const updatedInstitution = await Institution.findById(
      institutionId
    ).populate("admins", "-password");

    res.json({
      message: "Admin added to institution successfully",
      institution: updatedInstitution,
    });
  } catch (error) {
    console.error("Error adding admin to institution:", error);
    res.status(500).json({
      message: "Failed to add admin to institution",
      error: error.message,
    });
  }
};

// Remove admin from institution
exports.removeAdminFromInstitution = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);

    // Only super admins can remove admins from institutions
    // if (!requestingUser.isSuperAdmin) {
    //   return res.status(403).json({
    //     message: "Only super admins can remove admins from institutions",
    //   });
    // }

    const { id: institutionId, userId } = req.params;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if user is admin of this institution
    if (!institution.admins.includes(userId)) {
      return res.status(400).json({
        message: "User is not an admin of this institution",
      });
    }

    // Prevent removing the last admin
    if (institution.admins.length === 1) {
      return res.status(400).json({
        message:
          "Cannot remove the last admin. Please assign another admin first.",
      });
    }

    // Remove admin from institution
    institution.admins = institution.admins.filter(
      (adminId) => adminId.toString() !== userId
    );
    await institution.save();

    // Optionally remove institution from user's institutions
    // (only if they are not tutor/resident in this institution)
    const user = await User.findById(userId);
    if (user) {
      // Check if user has other roles in this institution
      const hasOtherRolesInInstitution =
        user.roles.includes("tutor") || user.roles.includes("resident");

      if (!hasOtherRolesInInstitution) {
        user.institutions = user.institutions.filter(
          (instId) => instId.toString() !== institutionId
        );
        await user.save();
      }
    }

    const updatedInstitution = await Institution.findById(
      institutionId
    ).populate("admins", "-password");

    res.json({
      message: "Admin removed from institution successfully",
      institution: updatedInstitution,
    });
  } catch (error) {
    console.error("Error removing admin from institution:", error);
    res.status(500).json({
      message: "Failed to remove admin from institution",
      error: error.message,
    });
  }
};

// Get all admins of an institution
exports.getInstitutionAdmins = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);
    const institution = await Institution.findById(req.params.id).populate(
      "admins",
      "-password"
    );

    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Check if user has access to this institution
    if (!requestingUser.isSuperAdmin) {
      const isAdmin = institution.admins.some(
        (admin) => admin._id.toString() === requestingUser._id.toString()
      );
      if (!isAdmin) {
        return res.status(403).json({
          message: "You don't have access to this institution",
        });
      }
    }

    res.json({
      admins: institution.admins,
    });
  } catch (error) {
    console.error("Error fetching institution admins:", error);
    res.status(500).json({
      message: "Failed to fetch institution admins",
      error: error.message,
    });
  }
};

// Join institution (for tutors/residents via mobile app)
exports.joinInstitution = async (req, res) => {
  try {
    const userId = req.user._id;
    const institutionId = req.params.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    if (!institution.isActive) {
      return res.status(400).json({ message: "Institution is not active" });
    }

    const user = await User.findById(userId);

    // Check if already joined
    if (user.institutions.some((inst) => inst.toString() === institutionId)) {
      return res.status(400).json({
        message: "You have already joined this institution",
      });
    }

    // Add institution to user
    user.institutions.push(institutionId);
    await user.save();

    res.json({
      message: `Successfully joined ${institution.name}`,
      institution: {
        _id: institution._id,
        name: institution.name,
        code: institution.code,
        logo: institution.logo,
      },
    });
  } catch (error) {
    console.error("Error joining institution:", error);
    res.status(500).json({
      message: "Failed to join institution",
      error: error.message,
    });
  }
};

// get user's institutions
exports.getUserInstitutions = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id).populate(
      "institutions"
    );
    console.log(requestingUser.institutions);
    res.json(requestingUser.institutions);
  } catch (error) {
    console.error("Error fetching user institutions:", error);
    res.status(500).json({
      message: "Failed to fetch user institutions",
      error: error.message,
    });
  }
};

// get all institutions
exports.getAllInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find();
    console.log("institutions are this ", institutions);
    return res.json(institutions);
  } catch (error) {
    console.error("Error fetching institutions:", error);
    res.status(500).json({
      message: "Failed to fetch institutions",
      error: error.message,
    });
  }
};
