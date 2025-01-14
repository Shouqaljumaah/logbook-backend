const Announcement = require("../../models/Announcements");

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
    const { title, body, date } = req.body;
    
    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({ 
        message: "Title and body are required" 
      });
    }

    // Create new announcement
    const newAnnouncement = new Announcement({
      title,
      body,
      date: date || new Date(),
      file: req.file ? req.file.path : undefined
    });

    // Save to database
    const savedAnnouncement = await newAnnouncement.save();
    console.log('Saved announcement:', savedAnnouncement); // Debug log

    res.status(201).json(savedAnnouncement);

  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ 
      message: "Failed to create announcement",
      error: err.message 
    });
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


