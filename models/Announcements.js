const { model, Schema, Types } = require("mongoose");
const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    date: {
      type: Date,
    },
    file: {
      type: String,
    },
  },
  { timestamps: true }
);
module.exports = model("Announcement", AnnouncementSchema);