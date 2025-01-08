const express = require("express");
const {
  getForms,
  getForm,createFormTemplate,
  updateForm,
  deleteForm,
} = require("./formTemplates.controllers");

const router = express.Router();

router.get("/", getForms); //Get all formss
router.get("/:id", getForm); //Get form by id
router.post("/", createFormTemplate); //add form
router.put("/:formId", updateForm); //Edit form
router.delete("/:formId", deleteForm); //Delete form

module.exports = router;
