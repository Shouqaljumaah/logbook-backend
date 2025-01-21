const express = require("express");
const {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
} = require("./notifications.controllers");

const router = express.Router();

router.post("/notifications", createNotification);

//  Get notifications for a specific user
router.get("/notifications/:userId", getNotifications);

//  Mark a notification as read
router.put("/notifications/:notificationId", markAsRead);

router.delete("/notifications/:notificationId", deleteNotification);

module.exports = router;