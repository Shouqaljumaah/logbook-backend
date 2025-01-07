const express = require("express");
const {
  getAllFormSubmitions,
  getFormSubmitions,
  createFormSubmitions,
  updateFormSubmitions,
  deleteFormSubmitions,
} = require("./formSubmitions.controllers");

const router = express.Router();

router.get("/", getAllFormSubmitions); //Get all
router.get("/:id", getFormSubmitions); //Get  by id
router.post("/", createFormSubmitions); //add
router.put("/:formSubmitionsId", updateFormSubmitions); //uptate
router.delete("/:formSubmitionsId", deleteFormSubmitions); //Delete

module.exports = router;
