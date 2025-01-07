const mongoose = require("mongoose");

// Define the Notification schema
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // user who the notification is for
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["comment", "mention"],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
