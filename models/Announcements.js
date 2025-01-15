const { model, Schema, Types } = require("mongoose");
const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    file: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = model("Announcement", AnnouncementSchema);