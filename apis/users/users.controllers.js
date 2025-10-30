const bcrypt = require("bcrypt");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRATION_MS } = require("../../key");
const fs = require("fs");
const path = require("path");
const upload = require("../../multer");
const FormSubmitions = require("../../models/FormSubmitions");

exports.signupUser = async (req, res) => {
  try {
    // // Get the admin user from the token
    // const adminUser = await User.findById(req.user._id).populate(
    //   "institutions"
    // );

    // // Check if user exists and is admin
    // if (!adminUser || !adminUser.roles.includes("admin")) {
    //   return res.status(403).json({
    //     message: "Only admins can create new users",
    //   });
    // }

    // Remove spaces from username
    const username = req.body.username.replace(/\s+/g, "");
    const name = req.body.name?.trim();
    const password = req.body.password;
    const role = req.body.role.toLowerCase(); // Single role from request
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();
    const institutionId = req.body.institutionId; // Institution to assign user to

    // Validate required fields
    if (!username || !password || !role || !name) {
      return res.status(400).json({
        message: "Username, password, name and role are required",
      });
    }

    // Validate role
    if (!["resident", "tutor"].includes(role)) {
      return res.status(400).json({
        message: "Role must be either 'resident' or 'tutor'",
      });
    }

    // // Determine institution - admin must be admin of the institution (in Institution.admins[])
    // const Institution = require("../../models/Institutions");
    // let institutions = [];

    // if (institutionId) {
    //   // Verify admin is actually admin of this institution (not just member)
    //   const institution = await Institution.findOne({
    //     _id: institutionId,
    //     admins: adminUser._id,
    //   });

    //   if (!institution) {
    //     return res.status(403).json({
    //       message: "You are not an admin of this institution",
    //     });
    //   }
    //   institutions = [institutionId];
    // } else {
    //   // Find first institution where user is admin
    //   const adminInstitutions = await Institution.find({
    //     admins: adminUser._id,
    //   });

    //   if (adminInstitutions.length === 0) {
    //     return res.status(403).json({
    //       message: "You are not an admin of any institution",
    //     });
    //   }
    //   institutions = [adminInstitutions[0]._id];
    // }

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

    // Create user with roles array and institution
    const user = await User.create({
      username,
      name,
      password: hashedPassword,
      roles: [role], // Store role in an array
      isFirstLogin: false,
      email,
      phone,
      // institutions,
    });

    const populatedUser = await User.findById(user._id).populate(
      "institutions"
    );

    // const payload = {
    //   id: populatedUser.id,
    //   username: populatedUser.username,
    //   role: populatedUser.roles,
    //   exp: Date.now() + parseInt(JWT_EXPIRATION_MS),
    //   image: populatedUser.image,
    //   name: populatedUser.name,
    // };
    // const token = jwt.sign(JSON.stringify(payload), JWT_SECRET);
    res.status(201).json({
      message: "User created successfully",
      // token: token,
      user: {
        username: populatedUser.username,
        name: populatedUser.name,
        roles: populatedUser.roles,
        _id: populatedUser._id,
        email: populatedUser.email,
        phone: populatedUser.phone,
        institutions: populatedUser.institutions,
      },
    });
  } catch (e) {
    console.error("Error:", e);
    if (e.code === 11000) {
      res.status(400).json({ message: "Username already exists" });
    } else {
      res.status(400).json({ message: e.message });
    }
  }
};

exports.logoutUser = async (req, res) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Find user with this token
    const users = await User.find({ session: token });
    if (users.length > 0) {
      const user = users[0];
      // Clear the session
      user.session = null;
      await user.save();
    }

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (e) {
    console.error("Logout error:", e);
    res.status(500).json({
      message: "Error during logout",
      error: e.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Get the requesting user to determine institution access
    const requestingUser = await User.findById(req.user._id).populate(
      "institutions"
    );

    // Build query based on user's institutions
    let query = {};
    if (!requestingUser.isSuperAdmin) {
      // Filter users by requesting user's institutions
      const institutionIds = requestingUser.institutions.map(
        (inst) => inst._id
      );
      query.institutions = { $in: institutionIds };
    }

    const users = await User.find(query, "-password")
      .populate("supervisor")
      .populate("institutions")
      .sort({ createdAt: -1 }); // Exclude password field

    // Add totalSubmissions to each user
    const usersWithSubmissions = await Promise.all(
      users.map(async (user) => {
        let totalSubmissions = 0;
        if (user.roles.includes("tutor")) {
          totalSubmissions = await FormSubmitions.countDocuments({
            tutor: user._id,
          });
        } else {
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

    res.json(usersWithSubmissions);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
////////////////////////////////////////////////////

exports.loginUser = async (req, res) => {
  try {
    const { user } = req;
    console.log("user", user.username);
    const payload = {
      id: user.id,
      username: user.username,
      role: user.roles,
      exp: Date.now() + parseInt(JWT_EXPIRATION_MS),
      image: user.image,
    };
    const token = jwt.sign(JSON.stringify(payload), JWT_SECRET);
    // Check if password needs to be changed (first login)
    if (user.isFirstLogin) {
      return res.status(200).json({
        message: "Password change required",
        requirePasswordChange: true,
        userId: user._id,
        token: token, // No token until password is changed
      });
    }

    // Normal login flow if password was already changed

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.roles,
        image: user.image,
        email: user.email,
        phone: user.phone,
        supervisor: user.supervisor,
        isFirstLogin: user.isFirstLogin,
      },
      requirePasswordChange: false,
    });
  } catch (e) {
    console.log("Login error:", e);
    res.status(500).json({ message: e.message });
  }
};

// Password change endpoint for mobile app
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      console.log("Current password is incorrect");
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash and save new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user
    user.password = hashedPassword;
    user.isFirstLogin = false; // Mark that password has been changed
    await user.save();

    // Generate new token after password change
    const payload = {
      id: user.id,
      username: user.username,
      exp: Date.now() + parseInt(JWT_EXPIRATION_MS),
    };
    const token = jwt.sign(JSON.stringify(payload), JWT_SECRET);

    res.status(200).json({
      message: "Password updated successfully",
      token, // Send new token for continued access
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// changes done here
exports.tutorList = async (req, res) => {
  try {
    // Get the requesting user to determine institution access
    const requestingUser = await User.findById(req.user._id).populate(
      "institutions"
    );

    // Build query based on user's institutions
    let query = {
      roles: { $in: ["tutor", "admin"] },
    };

    if (!requestingUser.isSuperAdmin) {
      // Filter tutors by requesting user's institutions
      const institutionIds = requestingUser.institutions.map(
        (inst) => inst._id
      );
      query.institutions = { $in: institutionIds };
    }

    // Find all users who are tutors (including those who are also admins)
    const tutors = await User.find(query, "-password").populate("institutions");

    res.json(tutors);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).json({
      message: "Failed to fetch tutors",
      error: error.message,
    });
  }
};

exports.updateUserImage = async (req, res) => {
  try {
    // Find user first to get old image path
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image if it exists
    if (user.image) {
      const oldImagePath = path.join(__dirname, "../../", user.image);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("Old image deleted successfully");
        }
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }

    // Update user with new image
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { image: req.file.path },
      { new: true }
    );

    res.json({
      message: "Profile image updated successfully",
      user: updatedUser,
    });
  } catch (e) {
    console.error("Error updating image:", e);
    res.status(500).json({ message: e.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const admin = await User.create({
      username: req.body.username,
      password: hashedPassword,
      role: "admin",
      isFirstLogin: false, // Admins don't need to change password
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        username: admin.username,
        role: admin.role,
        _id: admin._id,
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      // MongoDB duplicate key error
      res.status(400).json({ message: "Username already exists" });
    } else {
      res.status(400).json({ message: e.message });
    }
  }
};

exports.deleteUser = async (req, res) => {
  try {
    console.log("Delete request received. Token user:", req.user); // Debug log

    // Get the admin user from the token
    const adminUser = await User.findById(req.user._id || req.user.id);
    console.log("Admin user found:", adminUser); // Debug log

    // Check if user exists and is admin
    if (!adminUser) {
      console.log("No admin user found"); // Debug log
      return res.status(403).json({
        message: "Admin user not found",
      });
    }

    if (!adminUser.roles.includes("admin")) {
      // Check roles array instead of role property
      console.log("User is not admin. Roles:", adminUser.roles); // Debug log
      return res.status(403).json({
        message: "Only admins can delete users",
      });
    }

    const userId = req.params.id;
    console.log("Attempting to delete user:", userId); // Debug log

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      console.log("User to delete not found"); // Debug log
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log("Successfully deleted user:", deletedUser); // Debug log

    res.json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Log the incoming request
    // console.log("Update request received:", {
    //   userId: req.params.id,
    //   updates: req.body,
    //   adminId: req.user._id,
    // });

    // Verify admin user
    const adminUser = await User.findById(req.user._id);
    if (!adminUser || !adminUser.roles.includes("admin")) {
      return res.status(403).json({
        message: "Only admins can update users",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Handle image upload
    console.log("req.file", req.file);
    let image = user.image; // Keep existing image by default

    if (req.file) {
      // New image uploaded
      image = req.file.path;
    }

    console.log("Final image path:", image);

    // Prepare update data - only include fields that are provided
    const updateData = {};
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.supervisor !== undefined)
      updateData.supervisor = req.body.supervisor || null;
    if (image) updateData.image = image;

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Send success response
    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      message: "Error updating user",
      error: error.message,
    });
  }
};

// get user by id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("supervisor");

    res.json(user);
  } catch (error) {
    console.error("Error getting user by id:", error);
    res.status(500).json({
      message: "Error getting user by id",
      error: error.message,
    });
  }
};

//get user by token
exports.getUserByToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error("Error getting user by token:", error);
    res.status(500).json({
      message: "Error getting user by token",
      error: error.message,
    });
  }
};

//Example mobile app flow:
// // Login response handling
// if (response.requirePasswordChange) {
//   // Show password change screen
//   // User can't proceed until password is changed
//   navigateToChangePassword(response.userId);
// } else {
//   // Normal login flow
//   saveToken(response.token);
//   navigateToHome();
// }

// Get current user's profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("institutions", "name code logo")
      .populate("supervisor", "username email")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: "Account has been deleted" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update current user's profile
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, phone } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: "Account has been deleted" });
    }

    // Update allowed fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;

    // Handle profile image upload
    if (req.file) {
      user.image = req.file.path;
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId)
      .populate("institutions", "name code logo")
      .populate("supervisor", "username email")
      .select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${field} already exists`,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Soft delete user account
exports.deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required to delete account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        message: "Account is already deleted",
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    // Check if user is an admin of any institution
    const Institution = require("../../models/Institutions");
    const adminInstitutions = await Institution.find({ admins: userId });

    if (adminInstitutions.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete account. You are an admin of one or more institutions. Please transfer admin rights first.",
        institutions: adminInstitutions.map((inst) => inst.name),
      });
    }

    // Soft delete the account
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({
      message:
        "Account deleted successfully. You can contact support to restore your account within 30 days.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get residents supervised by a tutor in a specific institution
exports.getResidentsByTutor = async (req, res) => {
  try {
    const tutorId = req.params.tutorId || req.user._id; // Use logged-in user if no tutorId provided
    const { institutionId } = req.query;
    console.log("tutorId", tutorId);
    // Validate tutor exists
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.roles.includes("tutor")) {
      return res.status(400).json({ message: "User is not a tutor" });
    }

    // Build query
    let query = {
      // roles is an array of strings
      roles: { $in: ["resident"] },
      supervisor: tutorId,
      // isDeleted: false, // Exclude deleted accounts
    };

    // Filter by institution if provided
    if (institutionId) {
      // institutions is an array of objects with _id and name properties
      query.institutions = { $in: [institutionId] };
    }

    const residents = await User.find(query)
      .populate("institutions", "name code logo")
      .populate("supervisor", "username email")
      .select("-password")
      .sort({ username: 1 });
    console.log("residents", residents);
    // Get submission count for each resident
    const FormSubmitions = require("../../models/FormSubmitions");

    const residentsWithStats = await Promise.all(
      residents.map(async (resident) => {
        let submissionQuery = {
          resident: resident._id,
          tutor: tutorId,
        };

        // Filter submissions by institution if provided
        if (institutionId) {
          submissionQuery.institution = institutionId;
        }

        const submissionsCount = await FormSubmitions.countDocuments(
          submissionQuery
        );
        const reviewedCount = await FormSubmitions.countDocuments({
          ...submissionQuery,
          status: "reviewed",
        });

        return {
          ...resident.toObject(),
          stats: {
            totalSubmissions: submissionsCount,
            reviewedSubmissions: reviewedCount,
            pendingSubmissions: submissionsCount - reviewedCount,
          },
        };
      })
    );

    console.log("residentsWithStats", residentsWithStats);

    res.json({
      tutor: {
        _id: tutor._id,
        username: tutor.username,
        email: tutor.email,
      },
      institutionId: institutionId || "all",
      residentsCount: residentsWithStats.length,
      residents: residentsWithStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get resident details with submissions
exports.getResidentDetails = async (req, res) => {
  try {
    const { residentId } = req.params;
    const { institutionId } = req.query;
    const requestingUser = req.user;

    // Find resident
    const resident = await User.findById(residentId)
      .populate("institutions", "name code logo")
      .populate("supervisor", "username email phone image")
      .select("-password");

    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    if (!resident.roles.includes("resident")) {
      return res.status(400).json({ message: "User is not a resident" });
    }

    if (resident.isDeleted) {
      return res.status(403).json({ message: "Resident account is deleted" });
    }

    // Check permissions
    // Tutors can only see their own residents
    // Admins can see residents in their institutions
    // Super admins can see all
    if (!requestingUser.isSuperAdmin) {
      if (requestingUser.roles.includes("tutor")) {
        // Check if requesting tutor is the supervisor
        if (
          !resident.supervisor ||
          resident.supervisor._id.toString() !== requestingUser._id.toString()
        ) {
          return res.status(403).json({
            message: "You can only view your own residents",
          });
        }
      } else if (requestingUser.roles.includes("admin")) {
        // Check if resident is in admin's institutions
        const Institution = require("../../models/Institutions");
        const adminInstitutions = await Institution.find({
          admins: requestingUser._id,
        });
        const adminInstIds = adminInstitutions.map((inst) =>
          inst._id.toString()
        );

        const residentInstIds = resident.institutions.map((inst) =>
          inst._id.toString()
        );
        const hasCommonInst = residentInstIds.some((id) =>
          adminInstIds.includes(id)
        );

        if (!hasCommonInst) {
          return res.status(403).json({
            message: "You can only view residents in your institutions",
          });
        }
      } else {
        // Regular users cannot view other users' details
        if (resident._id.toString() !== requestingUser._id.toString()) {
          return res.status(403).json({
            message: "You don't have permission to view this resident",
          });
        }
      }
    }

    // Get submissions
    const FormSubmitions = require("../../models/FormSubmitions");
    let submissionQuery = { resident: residentId };

    // Filter by institution if provided
    if (institutionId) {
      submissionQuery.institution = institutionId;
    }

    const submissions = await FormSubmitions.find(submissionQuery)
      .populate("formTemplate", "formName score")
      .populate({
        path: "fieldRecord",
        populate: {
          path: "fieldTemplate",
          select: "name type",
        },
      })
      .populate("institution", "name code logo")
      .populate("tutor", "username email")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalSubmissions: submissions.length,
      reviewedSubmissions: submissions.filter(
        (sub) => sub.status === "reviewed"
      ).length,
      pendingSubmissions: submissions.filter((sub) => sub.status === "pending")
        .length,
    };

    // Group submissions by institution
    const submissionsByInstitution = {};
    submissions.forEach((sub) => {
      const instId = sub.institution._id.toString();
      if (!submissionsByInstitution[instId]) {
        submissionsByInstitution[instId] = {
          institution: sub.institution,
          count: 0,
          submissions: [],
        };
      }
      submissionsByInstitution[instId].count++;
      submissionsByInstitution[instId].submissions.push(sub);
    });

    res.json({
      resident: resident,
      stats: stats,
      submissions: submissions,
      submissionsByInstitution: Object.values(submissionsByInstitution),
    });
  } catch (error) {
    console.error("Error getting resident details:", error);
    res.status(500).json({ message: error.message });
  }
};
