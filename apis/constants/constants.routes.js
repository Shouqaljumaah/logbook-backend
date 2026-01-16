const express = require("express");
const {
  getAssessmentOptions,
  getConstants,
} = require("./constants.controllers");

const router = express.Router();

// Public route - no authentication required for constants
router.get("/assessment-options", getAssessmentOptions);
router.get("/", getConstants);

module.exports = router;
