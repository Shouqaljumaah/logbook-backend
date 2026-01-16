/**
 * Constants Controller
 * Provides system-wide constants and configuration values
 */

const ASSESSMENT_OPTIONS = require("../../constants/assessmentOptions");

// Get assessment options
exports.getAssessmentOptions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      assessmentOptions: ASSESSMENT_OPTIONS,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all constants (for future expansion)
exports.getConstants = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      constants: {
        assessmentOptions: ASSESSMENT_OPTIONS,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
