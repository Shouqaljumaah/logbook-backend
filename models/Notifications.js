const { model, Schema, Types } = require("mongoose");

const NotificationSchema = new Schema(
  {
    userId: {
      type: String,
    }, // user who the notification is for
    message: {
      type: String,
    },
    type: {
      type: String,
      enum: ["comment", "mention"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = model("Notification", NotificationSchema);