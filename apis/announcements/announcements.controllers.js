const Announcement = require("../../models/Announcements");
const multer = require('multer');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/announcements/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'));
    }
  }
});

exports.uploadImage = upload.single('image');

// Get all announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.status(200).json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Error fetching announcements" });
  }
};

// Create new announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    const file = req.file ? req.file.filename : null;

    const announcement = new Announcement({
      title,
      content,
      file
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    // Find and delete the announcement
    const deletedAnnouncement = await Announcement.findByIdAndDelete(announcementId);

    if (!deletedAnnouncement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json({ 
      message: "Announcement deleted successfully",
      deletedAnnouncement 
    });

  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ 
      message: "Failed to delete announcement",
      error: err.message 
    });
  }
};

// Get announcement
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    console.log('Sending announcement:', announcement); // Debug log
    res.json(announcement);
  } catch (error) {
    console.error('Error getting announcement:', error);
    res.status(500).json({ message: error.message });
  }
};


