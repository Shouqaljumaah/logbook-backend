const express = require("express");
const {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("./announcemnts.controllers");

const router = express.Router();

router.get("/", getAllAnnouncements); //Get all

router.post("/", createAnnouncement); //add

router.delete("/:announcementId", deleteAnnouncement); //Delete

module.exports = router;
