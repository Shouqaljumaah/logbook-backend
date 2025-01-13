const Announcement = require("../../models/Announcements");
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.status(200).json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};
exports.createAnnouncement = async (req, res) => {
  const { title, body, date, file } = req.body;
  if (!title || !body || !date || !file) {
    return res.status(400).json({ error: "announcement content are required" });
  }
  try {
    const newAnnouncement = new Announcement({ title, body, date, file });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ error: "Failed to create announcement" });
  }
};
exports.deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "Not Found" });
  }
};


