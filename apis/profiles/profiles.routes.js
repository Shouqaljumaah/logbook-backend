const express = require('express');
const router = express.Router();
const multer = require('multer');
const passport = require('passport');
const { localStrategy, jwtStrategy } = require('../../passport');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use passport middleware
passport.use(localStrategy);
passport.use(jwtStrategy);

// Auth middleware
const auth = passport.authenticate('jwt', { session: false });

const {
  getProfile,
  uploadAvatar,
  changePassword
} = require('./profiles.controllers');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the created directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Routes with auth middleware
router.get('/me', auth, getProfile);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);
router.post('/change-password', auth, changePassword);

module.exports = router; 