const express = require("express");
const router = express.Router();
const {
  getAllFormSubmitions,
  getFormSubmitions,
  createFormSubmition,
  reviewFormSubmitions,
  deleteFormSubmitions,
} = require("./formSubmitions.controllers");

// Create new form submission
router.post("/create", createFormSubmition);

// Get all submissions for a user (tutor or resident)
router.get("/user/:userId", getAllFormSubmitions);

// Get specific submission by ID
router.get("/:id", getFormSubmitions);

// Review a submission
router.post("/:formSubmitionsId/review", reviewFormSubmitions);

// Delete a submission
router.delete("/:id", deleteFormSubmitions);

module.exports = router;
