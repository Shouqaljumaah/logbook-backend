const express = require("express");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("./announcements.controllers");

const router = express.Router();
router.get("/", getAllAnnouncements);
router.post("/", upload.single('file'), createAnnouncement);  // Add multer middleware
router.delete("/:announcementId", deleteAnnouncement);

module.exports = router;