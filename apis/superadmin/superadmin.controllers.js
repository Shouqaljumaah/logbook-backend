const bcrypt = require("bcrypt");
const User = require("../../models/Users");
const Institution = require("../../models/Institutions");
const FormSubmitions = require("../../models/FormSubmitions");
const FormTemplates = require("../../models/FormTemplates");

// Get all users across all institutions
exports.getAllUsers = async (req, res) => {
  try {
    const { institutionId } = req.query;

    let query = {};
    if (institutionId) {
      query.institutions = institutionId;
    }

    const users = await User.find(query, "-password")
      .populate("supervisor")
      .populate("institutions")
      .sort({ createdAt: -1 });

    // Add statistics to each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        let totalSubmissions = 0;
        if (user.roles.includes("tutor")) {
          totalSubmissions = await FormSubmitions.countDocuments({
            tutor: user._id,
          });
        } else if (user.roles.includes("resident")) {
          totalSubmissions = await FormSubmitions.countDocuments({
            resident: user._id,
          });
        }
        return {
          ...user.toObject(),
          totalSubmissions,
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Create user with institution assignment
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      email,
      phone,
      institutionIds,
      supervisor,
    } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password, and role are required",
      });
    }

    // Validate role
    const validRoles = ["admin", "tutor", "resident"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be admin, tutor, or resident",
      });
    }

    // Validate institutions
    if (!institutionIds || institutionIds.length === 0) {
      return res.status(400).json({
        message: "At least one institution must be assigned",
      });
    }

    // Verify institutions exist
    const institutions = await Institution.find({
      _id: { $in: institutionIds },
    });
    if (institutions.length !== institutionIds.length) {
      return res.status(400).json({
        message: "One or more invalid institution IDs",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      roles: [role],
      email,
      phone,
      institutions: institutionIds,
      supervisor,
      isFirstLogin: true,
      isSuperAdmin: false,
    });

    const populatedUser = await User.findById(user._id)
      .populate("institutions")
      .populate("supervisor")
      .select("-password");

    res.status(201).json({
      message: "User created successfully",
      user: populatedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// Update user's institution assignments
exports.updateUserInstitutions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { institutionIds } = req.body;

    if (!institutionIds || institutionIds.length === 0) {
      return res.status(400).json({
        message: "At least one institution must be assigned",
      });
    }

    // Verify institutions exist
    const institutions = await Institution.find({
      _id: { $in: institutionIds },
    });
    if (institutions.length !== institutionIds.length) {
      return res.status(400).json({
        message: "One or more invalid institution IDs",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { institutions: institutionIds } },
      { new: true }
    )
      .populate("institutions")
      .populate("supervisor")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User institutions updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user institutions:", error);
    res.status(500).json({
      message: "Failed to update user institutions",
      error: error.message,
    });
  }
};

// Delete user (super admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deletion of super admin users
    if (user.isSuperAdmin) {
      return res.status(403).json({
        message: "Cannot delete super admin users",
      });
    }

    // Check if user has associated submissions
    const submissionsCount = await FormSubmitions.countDocuments({
      $or: [{ tutor: userId }, { resident: userId }],
    });

    if (submissionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete user. They have ${submissionsCount} associated form submissions.`,
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Create super admin
exports.createSuperAdmin = async (req, res) => {
  try {
    // Check if requesting user is already a super admin
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser || !requestingUser.isSuperAdmin) {
      return res.status(403).json({
        message: "Only super admins can create other super admins",
      });
    }

    const { username, password, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create super admin user
    const superAdmin = await User.create({
      username,
      password: hashedPassword,
      roles: ["superadmin"],
      email,
      phone,
      isSuperAdmin: true,
      isFirstLogin: false, // Super admins don't need to change password
      institutions: [], // Super admins have access to all institutions
    });

    res.status(201).json({
      message: "Super admin created successfully",
      user: {
        id: superAdmin._id,
        username: superAdmin.username,
        roles: superAdmin.roles,
        isSuperAdmin: superAdmin.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Error creating super admin:", error);
    res.status(500).json({
      message: "Failed to create super admin",
      error: error.message,
    });
  }
};

// Get platform statistics
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalInstitutions,
      activeInstitutions,
      totalUsers,
      totalFormTemplates,
      totalFormSubmissions,
    ] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ isActive: true }),
      User.countDocuments({ isSuperAdmin: false }),
      FormTemplates.countDocuments(),
      FormSubmitions.countDocuments(),
    ]);

    // Get user role breakdown
    const [admins, tutors, residents] = await Promise.all([
      User.countDocuments({ roles: "admin", isSuperAdmin: false }),
      User.countDocuments({ roles: "tutor" }),
      User.countDocuments({ roles: "resident" }),
    ]);

    res.json({
      institutions: {
        total: totalInstitutions,
        active: activeInstitutions,
      },
      users: {
        total: totalUsers,
        admins,
        tutors,
        residents,
      },
      formTemplates: totalFormTemplates,
      formSubmissions: totalFormSubmissions,
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({
      message: "Failed to fetch platform statistics",
      error: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("institutions")
      .populate("supervisor")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's submissions count
    let totalSubmissions = 0;
    if (user.roles.includes("tutor")) {
      totalSubmissions = await FormSubmitions.countDocuments({
        tutor: user._id,
      });
    } else if (user.roles.includes("resident")) {
      totalSubmissions = await FormSubmitions.countDocuments({
        resident: user._id,
      });
    }

    res.json({
      ...user.toObject(),
      totalSubmissions,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// Update user (super admin version with full control)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, phone, supervisor, institutionIds, roles } =
      req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent updating super admin users
    if (user.isSuperAdmin) {
      return res.status(403).json({
        message: "Cannot update super admin users through this endpoint",
      });
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (supervisor !== undefined) updateData.supervisor = supervisor || null;
    if (roles) updateData.roles = roles;

    // Handle institution updates
    if (institutionIds && institutionIds.length > 0) {
      const institutions = await Institution.find({
        _id: { $in: institutionIds },
      });
      if (institutions.length !== institutionIds.length) {
        return res.status(400).json({
          message: "One or more invalid institution IDs",
        });
      }
      updateData.institutions = institutionIds;
    }

    // Handle image upload
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    )
      .populate("institutions")
      .populate("supervisor")
      .select("-password");

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};
