const mongoose = require("mongoose");
const Institution = require("../../models/Institutions");
const User = require("../../models/Users");
const FormTemplates = require("../../models/FormTemplates");
const FormSubmitions = require("../../models/FormSubmitions");

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
// Users join as "resident" by default, admins can change role later
exports.joinInstitution = async (req, res) => {
  try {
    const userId = req.user._id;
    const institutionId = req.params.id;
    const { role } = req.body; // Optional: tutor or resident, defaults to resident

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    if (!institution.isActive) {
      return res.status(400).json({ message: "Institution is not active" });
    }

    const user = await User.findById(userId);

    // Check if already joined
    const existingRole = user.getRoleInInstitution(institutionId);
    if (existingRole) {
      return res.status(400).json({
        message: `You have already joined this institution as ${existingRole}`,
        currentRole: existingRole,
      });
    }

    // Default to resident role when joining
    const assignedRole =
      role && ["tutor", "resident"].includes(role) ? role : "resident";

    // Assign role to user
    user.assignRoleToInstitution(institutionId, assignedRole, userId);
    await user.save();

    res.json({
      message: `Successfully joined ${institution.name} as ${assignedRole}`,
      institution: {
        _id: institution._id,
        name: institution.name,
        code: institution.code,
        logo: institution.logo,
      },
      role: assignedRole,
    });
  } catch (error) {
    console.error("Error joining institution:", error);
    res.status(500).json({
      message: "Failed to join institution",
      error: error.message,
    });
  }
};

// Assign or update user role in institution (Admin only)
exports.assignUserToInstitution = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id);
    const { id: institutionId } = req.params;
    const { userId, role } = req.body;

    // Validation
    if (!role || !["admin", "tutor", "resident"].includes(role)) {
      return res.status(400).json({
        message: "Valid role is required (admin, tutor, or resident)",
      });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Get institution
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    // Get target user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({ message: "Cannot assign deleted user" });
    }

    // Permission check: Only super admins or institution admins can assign roles
    if (!requestingUser.isSuperAdmin) {
      const isAdmin = requestingUser.isAdminOfInstitution(institutionId);
      if (!isAdmin) {
        return res.status(403).json({
          message:
            "You don't have permission to assign users to this institution",
        });
      }
    }

    // Get current role if any
    const currentRole = user.getRoleInInstitution(institutionId);

    // Assign or update role
    user.assignRoleToInstitution(institutionId, role, requestingUser._id);
    await user.save();

    // Update Institution.admins array for backward compatibility
    if (role === "admin") {
      if (
        !institution.admins.some(
          (admin) => admin.toString() === userId.toString()
        )
      ) {
        institution.admins.push(userId);
        await institution.save();
      }
    } else {
      // Remove from admins if changing from admin to another role
      if (currentRole === "admin") {
        institution.admins = institution.admins.filter(
          (admin) => admin.toString() !== userId.toString()
        );
        await institution.save();
      }
    }

    // Get updated user with populated data
    const updatedUser = await User.findById(userId)
      .populate("institutionRoles.institution", "name code logo")
      .select("-password");

    res.json({
      message: currentRole
        ? `User role updated from ${currentRole} to ${role}`
        : `User assigned as ${role}`,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        institutionRoles: updatedUser.institutionRoles,
      },
      institution: {
        _id: institution._id,
        name: institution.name,
      },
      previousRole: currentRole,
      newRole: role,
    });
  } catch (error) {
    console.error("Error assigning user to institution:", error);
    res.status(500).json({
      message: "Failed to assign user to institution",
      error: error.message,
    });
  }
};

// Get user's role in a specific institution
exports.getUserRoleInInstitution = async (req, res) => {
  try {
    const { institutionId, userId } = req.params;
    const requestingUser = req.user;

    // Get target user (or self if not specified)
    const targetUserId = userId || requestingUser._id;
    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Permission check: Users can check their own role, admins can check any role in their institutions
    if (
      targetUserId.toString() !== requestingUser._id.toString() &&
      !requestingUser.isSuperAdmin
    ) {
      const isAdmin = requestingUser.isAdminOfInstitution(institutionId);
      if (!isAdmin) {
        return res.status(403).json({
          message: "You don't have permission to view this user's role",
        });
      }
    }

    const role = user.getRoleInInstitution(institutionId);

    if (!role) {
      return res.status(404).json({
        message: "User is not a member of this institution",
      });
    }

    const institutionRole = user.institutionRoles.find(
      (ir) => ir.institution.toString() === institutionId.toString()
    );

    res.json({
      userId: user._id,
      username: user.username,
      institutionId: institutionId,
      role: role,
      assignedAt: institutionRole?.assignedAt,
      assignedBy: institutionRole?.assignedBy,
    });
  } catch (error) {
    console.error("Error getting user role:", error);
    res.status(500).json({
      message: "Failed to get user role",
      error: error.message,
    });
  }
};

// Get user's institutions with their roles
exports.getUserInstitutions = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user._id).populate(
      "institutionRoles.institution"
    );

    if (!requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get institution IDs from institutionRoles
    const institutionIds = requestingUser.institutionRoles.map(
      (ir) => ir.institution._id
    );

    // Use aggregation to count form templates per institution
    const formTemplatesCounts = await FormTemplates.aggregate([
      {
        $match: {
          institution: { $in: institutionIds },
        },
      },
      {
        $group: {
          _id: "$institution",
          count: { $sum: 1 },
        },
      },
    ]);

    // Use aggregation to count form submissions per institution
    const formSubmissionsCounts = await FormSubmitions.aggregate([
      {
        $match: {
          institution: { $in: institutionIds },
        },
      },
      {
        $group: {
          _id: "$institution",
          count: { $sum: 1 },
        },
      },
    ]);

    // Create maps for quick lookup
    const templatesCountMap = {};
    formTemplatesCounts.forEach((item) => {
      templatesCountMap[item._id.toString()] = item.count;
    });

    const submissionsCountMap = {};
    formSubmissionsCounts.forEach((item) => {
      submissionsCountMap[item._id.toString()] = item.count;
    });

    // Build response with institution details, user's role, and level
    const institutions = requestingUser.institutionRoles.map((ir) => {
      const inst = ir.institution;
      return {
        _id: inst._id,
        name: inst.name,
        code: inst.code,
        logo: inst.logo,
        description: inst.description,
        isActive: inst.isActive,
        // User's role in this institution
        userRole: ir.role,
        userLevel: ir.level || "", // User's level in this institution (for residents)
        assignedAt: ir.assignedAt,
        // Counts
        formTemplatesCount: templatesCountMap[inst._id.toString()] || 0,
        formSubmissionsCount: submissionsCountMap[inst._id.toString()] || 0,
      };
    });

    // Calculate totals
    const totalFormTemplates = formTemplatesCounts.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const totalFormSubmissions = formSubmissionsCounts.reduce(
      (sum, item) => sum + item.count,
      0
    );

    res.json({
      institutions: institutions,
      totals: {
        institutionsCount: institutions.length,
        formTemplatesCount: totalFormTemplates,
        formSubmissionsCount: totalFormSubmissions,
      },
    });
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

    return res.json(institutions);
  } catch (error) {
    console.error("Error fetching institutions:", error);
    res.status(500).json({
      message: "Failed to fetch institutions",
      error: error.message,
    });
  }
};

// Get comprehensive dashboard data for an institution
exports.getDashboard = async (req, res) => {
  try {
    const { institutionId } = req.query;

    // Validate institutionId is provided
    if (!institutionId) {
      return res.status(400).json({
        message: "institutionId is required",
      });
    }

    // Get the requesting user
    const requestingUser = await User.findById(req.user._id);

    // Check if user is authorized for this institution
    if (!requestingUser.isSuperAdmin) {
      const institution = await Institution.findOne({
        _id: institutionId,
        admins: requestingUser._id,
      });

      if (!institution) {
        return res.status(403).json({
          message: "You are not an admin of this institution",
        });
      }
    }

    // Verify institution exists
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({
        message: "Institution not found",
      });
    }

    // Convert institutionId to ObjectId for queries
    const institutionObjectId = new mongoose.Types.ObjectId(institutionId);

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Helper function to calculate percentage change
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Helper function to format relative time
    const formatRelativeTime = (timestamp) => {
      const seconds = Math.floor((now - timestamp) / 1000);
      if (seconds < 60) return `${seconds} seconds ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60)
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    };

    // Get all stats in parallel
    const [
      totalUsers,
      totalForms,
      totalSubmissions,
      completedSubmissionsThisMonth,
      pendingSubmissions,
      residents,
      tutors,
      admins,
      submissionsThisMonth,
      submissionsLastMonth,
      usersThisMonth,
      usersLastMonth,
      formsThisMonth,
      formsLastMonth,
      monthlySubmissionsData,
      topFormsData,
      levelDistributionData,
    ] = await Promise.all([
      // Total users in institution
      User.countDocuments({
        isDeleted: { $ne: true },
        "institutionRoles.institution": institutionId,
      }),

      // Total forms
      FormTemplates.countDocuments({ institution: institutionId }),

      // Total submissions
      FormSubmitions.countDocuments({ institution: institutionId }),

      // Completed submissions this month
      FormSubmitions.countDocuments({
        institution: institutionId,
        status: "completed",
        createdAt: { $gte: startOfMonth },
      }),

      // Pending submissions
      FormSubmitions.countDocuments({
        institution: institutionId,
        status: { $in: ["pending", "rejected"] },
      }),

      // Count residents
      User.countDocuments({
        isDeleted: { $ne: true },
        "institutionRoles.institution": institutionId,
        "institutionRoles.role": "resident",
      }),

      // Count tutors
      User.countDocuments({
        isDeleted: { $ne: true },
        "institutionRoles.institution": institutionId,
        "institutionRoles.role": "tutor",
      }),

      // Count admins (from Institution.admins array)
      Institution.findById(institutionId).then(
        (inst) => inst?.admins?.length || 0
      ),

      // Submissions this month
      FormSubmitions.countDocuments({
        institution: institutionId,
        createdAt: { $gte: startOfMonth },
      }),

      // Submissions last month
      FormSubmitions.countDocuments({
        institution: institutionId,
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),

      // Users added this month
      User.countDocuments({
        isDeleted: { $ne: true },
        "institutionRoles.institution": institutionId,
        "institutionRoles.assignedAt": { $gte: startOfMonth },
      }),

      // Users added last month
      User.countDocuments({
        isDeleted: { $ne: true },
        "institutionRoles.institution": institutionId,
        "institutionRoles.assignedAt": {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),

      // Forms created this month
      FormTemplates.countDocuments({
        institution: institutionId,
        createdAt: { $gte: startOfMonth },
      }),

      // Forms created last month
      FormTemplates.countDocuments({
        institution: institutionId,
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),

      // Monthly submissions for last 6 months
      FormSubmitions.aggregate([
        {
          $match: {
            institution: institutionObjectId,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Top forms by submission count
      FormSubmitions.aggregate([
        {
          $match: { institution: institutionObjectId },
        },
        {
          $group: {
            _id: "$formTemplate",
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "formtemplates",
            localField: "_id",
            foreignField: "_id",
            as: "form",
          },
        },
        { $unwind: "$form" },
        {
          $project: {
            formId: "$_id",
            formName: "$form.formName",
            submissionCount: "$count",
            completionRate: {
              $cond: [
                { $eq: ["$count", 0] },
                0,
                { $multiply: [{ $divide: ["$completed", "$count"] }, 100] },
              ],
            },
          },
        },
      ]),

      // Level distribution
      User.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            "institutionRoles.institution": institutionObjectId,
            "institutionRoles.role": "resident",
          },
        },
        { $unwind: "$institutionRoles" },
        {
          $match: {
            "institutionRoles.institution": institutionObjectId,
            "institutionRoles.role": "resident",
          },
        },
        {
          $group: {
            _id: "$institutionRoles.level",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Calculate trends
    const submissionsChange = calculateChange(
      submissionsThisMonth,
      submissionsLastMonth
    );
    const usersChange = calculateChange(usersThisMonth, usersLastMonth);
    const formsChange = calculateChange(formsThisMonth, formsLastMonth);

    // Calculate completion rates
    const formsCompleted =
      totalSubmissions > 0
        ? (completedSubmissionsThisMonth / totalSubmissions) * 100
        : 0;

    // Count users with at least one submission
    const usersWithSubmissions = await User.distinct("_id", {
      isDeleted: { $ne: true },
      "institutionRoles.institution": institutionId,
      _id: {
        $in: await FormSubmitions.distinct("resident", {
          institution: institutionId,
        }),
      },
    });

    const userEngagement =
      totalUsers > 0 ? (usersWithSubmissions.length / totalUsers) * 100 : 0;
    const averageSubmissionsPerUser =
      totalUsers > 0 ? totalSubmissions / totalUsers : 0;
    const averageSubmissionsPerForm =
      totalForms > 0 ? totalSubmissions / totalForms : 0;

    // Format monthly submissions
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthlySubmissions = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthData = monthlySubmissionsData.find(
        (m) => m._id.year === year && m._id.month === month
      );
      monthlySubmissions.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        monthName: monthNames[month - 1],
        count: monthData?.count || 0,
      });
    }

    // Format top forms
    const topForms = topFormsData.map((form) => ({
      formId: form.formId.toString(),
      formName: form.formName,
      submissionCount: form.submissionCount,
      completionRate: Math.round(form.completionRate * 10) / 10,
    }));

    // Format level distribution
    const levelDistribution = {
      R1: 0,
      R2: 0,
      R3: 0,
      R4: 0,
      R5: 0,
    };
    levelDistributionData.forEach((item) => {
      const level = item._id || "";
      if (levelDistribution.hasOwnProperty(level)) {
        levelDistribution[level] = item.count;
      }
    });

    // Get recent activities
    const recentSubmissions = await FormSubmitions.find({
      institution: institutionId,
    })
      .populate("resident", "username")
      .populate("formTemplate", "formName")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentUsers = await User.find({
      isDeleted: { $ne: true },
      "institutionRoles.institution": institutionId,
    })
      .sort({ "institutionRoles.assignedAt": -1 })
      .limit(3)
      .lean();

    const recentForms = await FormTemplates.find({
      institution: institutionId,
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    // Combine and format activities
    const activities = [];

    // Add submission activities
    recentSubmissions.forEach((submission) => {
      activities.push({
        id: `submission_${submission._id}`,
        type: "submission",
        description: `${submission.resident?.username || "Unknown"} ${
          submission.status === "completed" ? "completed" : "submitted"
        } '${submission.formTemplate?.formName || "Form"}'`,
        time: formatRelativeTime(submission.createdAt),
        timestamp: submission.createdAt,
        userId: submission.resident?._id?.toString(),
        username: submission.resident?.username,
        formId: submission.formTemplate?._id?.toString(),
        formName: submission.formTemplate?.formName,
      });
    });

    // Add user activities
    recentUsers.forEach((user) => {
      const institutionRole = user.institutionRoles.find(
        (ir) =>
          (ir.institution._id || ir.institution).toString() ===
          institutionId.toString()
      );
      if (institutionRole) {
        activities.push({
          id: `user_${user._id}_${institutionRole.assignedAt}`,
          type: "user",
          description: `${user.username} was added as a new ${institutionRole.role}`,
          time: formatRelativeTime(new Date(institutionRole.assignedAt)),
          timestamp: institutionRole.assignedAt,
          userId: user._id.toString(),
          username: user.username,
        });
      }
    });

    // Add form activities
    recentForms.forEach((form) => {
      activities.push({
        id: `form_${form._id}`,
        type: "form",
        description: `New form '${form.formName}' was created`,
        time: formatRelativeTime(form.createdAt),
        timestamp: form.createdAt,
        formId: form._id.toString(),
        formName: form.formName,
        userId: requestingUser._id.toString(),
        username: requestingUser.username,
      });
    });

    // Sort activities by timestamp and limit to 10
    const recentActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // Count incomplete forms (forms with no submissions or draft status)
    const incompleteForms = await FormTemplates.countDocuments({
      institution: institutionId,
      _id: {
        $nin: await FormSubmitions.distinct("formTemplate", {
          institution: institutionId,
        }),
      },
    });

    // Build response
    const dashboardData = {
      stats: {
        totalUsers,
        totalForms,
        totalSubmissions,
        completedSubmissions: completedSubmissionsThisMonth,
        pendingSubmissions,
        totalResidents: residents,
        totalTutors: tutors,
        totalAdmins: admins,
      },
      trends: {
        submissionsThisMonth,
        submissionsLastMonth,
        submissionsChange: Math.round(submissionsChange * 10) / 10,
        usersThisMonth,
        usersLastMonth,
        usersChange: Math.round(usersChange * 10) / 10,
        formsThisMonth,
        formsLastMonth,
        formsChange: Math.round(formsChange * 10) / 10,
      },
      completionRates: {
        formsCompleted: Math.round(formsCompleted * 10) / 10,
        userEngagement: Math.round(userEngagement * 10) / 10,
        averageSubmissionsPerUser:
          Math.round(averageSubmissionsPerUser * 10) / 10,
        averageSubmissionsPerForm:
          Math.round(averageSubmissionsPerForm * 10) / 10,
      },
      monthlySubmissions,
      recentActivities,
      pendingItems: {
        pendingSubmissions,
        pendingReviews: pendingSubmissions, // Using pending submissions as reviews
        incompleteForms,
      },
      topForms,
      userDistribution: {
        residents,
        tutors,
        admins,
      },
      levelDistribution,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};
