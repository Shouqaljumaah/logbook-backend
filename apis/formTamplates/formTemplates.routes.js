const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  getForms,
  getForm,
  createFormTemplate,
  updateForm,
  deleteForm,
} = require("./formTemplates.controllers");

// Apply authentication to all routes
router.use(passport.authenticate("jwt", { session: false }));

router.get("/", getForms); //Get all formss
router.get("/:id", getForm); //Get form by id
router.post("/", createFormTemplate); //add form
router.put("/:formId", updateForm); //Edit form
router.delete("/:formId", deleteForm); //Delete form

module.exports = router;
