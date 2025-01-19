const Notification = require("../../models/Notifications");

exports.createNotification = async (req, res) => {
  const { userId, message, type } = req.body;

  try {
    const notification = new Notification({
      userId,
      message,
      type,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error Creating Notification", error });
  }
};

// Get all notifications for a specific user
exports.getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error Fetching Notifications", error });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification Not Found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error Updating Notification", error });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notifications.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "e" });
  }
};