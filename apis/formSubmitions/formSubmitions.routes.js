const express = require("express");
const {
  getAllFormSubmitions,
  getFormSubmitions,
  createFormSubmition,
  reviewFormSubmitions,
  deleteFormSubmitions,
} = require("./formSubmitions.controllers");

const router = express.Router();

router.get("/", getAllFormSubmitions); //Get all
router.get("/:id", getFormSubmitions); //Get  by id
router.post("/", createFormSubmition); //add
router.put("/:formSubmitionsId/review", reviewFormSubmitions); //uptate
router.delete("/:formSubmitionsId", deleteFormSubmitions); //Delete

module.exports = router;
