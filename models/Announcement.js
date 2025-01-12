const { model, Schema, Types } = require("mongoose");

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = model("Announcement", AnnouncementSchema);
