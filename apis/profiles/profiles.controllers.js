const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const bcrypt = require('bcrypt');

// Get profile
exports.getProfile = async (req, res) => {
  try {
    // Check if user exists first
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Then find or create profile
    let profile = await Profile.findOne({ username: req.user.id })
      .populate('username', 'username roles');

    if (!profile) {
      // Create new profile if doesn't exist
      profile = new Profile({
        username: req.user.id
      });
      await profile.save();
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving profile',
      error: error.message 
    });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    let profile = await Profile.findOne({ username: req.user.id });
    
    if (!profile) {
      profile = new Profile({
        username: req.user.id,
        avatar: req.file.path
      });
    } else {
      profile.avatar = req.file.path;
    }

    await profile.save();

    res.json({
      success: true,
      avatar: profile.avatar
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading avatar',
      error: error.message 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
}; 