const bcrypt = require("bcrypt");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRATION_MS } = require("../../key");
const fs = require('fs');
const path = require('path');
const upload = require("../../multer");


exports.signupUser = async (req, res) => {
  try {
    // Get the admin user from the token
    const adminUser = await User.findById(req.user._id);
    console.log("Admin user:", adminUser); // Debug log

    // Check if user exists and is admin
    if (!adminUser || !adminUser.roles.includes('admin')) {
      return res.status(403).json({ 
        message: "Only admins can create new users" 
      });
    }

    // Remove spaces from username
    const username = req.body.username.replace(/\s+/g, '');
    const password = req.body.password;
    const role = req.body.role; // Single role from request
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ 
        message: "Username, password and role are required" 
      });
    }

    // Validate role
    if (!['resident', 'tutor'].includes(role)) {
      return res.status(400).json({ 
        message: "Role must be either 'resident' or 'tutor'" 
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        message: "Username already exists" 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with roles array
    const user = await User.create({
      username,
      password: hashedPassword,
      roles: [role], // Store role in an array
      isFirstLogin: true,
      email,
      phone
    });

    res.status(201).json({ 
      message: "User created successfully",
      user: {
        username: user.username,
        roles: user.roles,
        _id: user._id,
        email: user.email,
        phone: user.phone
      }
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: "No token provided" 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Find user with this token
    const users = await User.find({ session: token });
    if (users.length > 0) {
      const user = users[0];
      // Clear the session
      user.session = null;
      await user.save();
    }

    res.status(200).json({ 
      message: "Logged out successfully" 
    });
    
  } catch (e) {
    console.error('Logout error:', e);
    res.status(500).json({ 
      message: "Error during logout",
      error: e.message 
    });
  }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password field
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};
////////////////////////////////////////////////////

exports.loginUser = async (req, res) => {
  try {
    const { user } = req;
    console.log("user", user.username);

    // Check if password needs to be changed (first login)
    if (user.isFirstLogin) {
      return res.status(200).json({ 
        message: "Password change required",
        requirePasswordChange: true,
        userId: user._id,
        token: null  // No token until password is changed
      });
    }

    // Normal login flow if password was already changed
    const payload = {
      id: user.id,
      username: user.username,
      role: user.roles,
      exp: Date.now() + parseInt(JWT_EXPIRATION_MS),
    };
    const token = jwt.sign(JSON.stringify(payload), JWT_SECRET);
    console.log("user", user.roles);
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.roles
      },
      requirePasswordChange: false 
    });

  } catch (e) {
    console.log('Login error:', e);
    res.status(500).json({ message: e.message });
  }
};

// Password change endpoint for mobile app
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash and save new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user
    user.password = hashedPassword;
    user.isFirstLogin = false;  // Mark that password has been changed
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
      token  // Send new token for continued access
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// changes done here 
exports.tutorList = async (req, res) => {
  try {
    // Find all users who are tutors (including those who are also admins)
    const tutors = await User.find({ 
      roles: { $in: ['tutor', 'admin'] }
    }, '-password');

    // // Add isAdmin flag to response
    // const tutorsWithAdminStatus = tutors.map(tutor => ({
    //   ...tutor.toObject(),
    //   isAdmin: tutor.roles?.includes('admin')  // Added optional chaining
    // }));

    res.json(tutors);
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({ 
      message: 'Failed to fetch tutors',
      error: error.message 
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
      const oldImagePath = path.join(__dirname, '../../', user.image);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Old image deleted successfully');
        }
      } catch (err) {
        console.error('Error deleting old image:', err);
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
      user: updatedUser
    });

  } catch (e) {
    console.error('Error updating image:', e);
    res.status(500).json({ message: e.message });
  }
};



exports.createAdmin = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ 
        message: "Username and password are required" 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const admin = await User.create({
      username: req.body.username,
      password: hashedPassword,
      role: 'admin',
      isFirstLogin: false  // Admins don't need to change password
    });

    res.status(201).json({ 
      message: "Admin created successfully",
      admin: {
        username: admin.username,
        role: admin.role,
        _id: admin._id
      }
    });
  } catch (e) {
    if (e.code === 11000) { // MongoDB duplicate key error
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
                message: "Admin user not found" 
            });
        }

        if (!adminUser.roles.includes('admin')) { // Check roles array instead of role property
            console.log("User is not admin. Roles:", adminUser.roles); // Debug log
            return res.status(403).json({ 
                message: "Only admins can delete users" 
            });
        }

        const userId = req.params.id;
        console.log("Attempting to delete user:", userId); // Debug log

        // Find and delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            console.log("User to delete not found"); // Debug log
            return res.status(404).json({ 
                message: "User not found" 
            });
        }

        console.log("Successfully deleted user:", deletedUser); // Debug log

        res.json({ 
            message: "User deleted successfully",
            user: deletedUser
        });

    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({ 
            message: "Error deleting user",
            error: error.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        // Log the incoming request
        console.log('Update request received:', {
            userId: req.params.id,
            updates: req.body,
            adminId: req.user._id
        });

        // Verify admin user
        const adminUser = await User.findById(req.user._id);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ 
                message: "Only admins can update users" 
            });
        }

        // Find and update the user
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    username: req.body.username,
                    email: req.body.email,
                    phone: req.body.phone
                }
            },
            { new: true }  // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                message: "User not found" 
            });
        }

        console.log('User updated successfully:', updatedUser);

        // Send success response
        res.json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            message: "Error updating user",
            error: error.message
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