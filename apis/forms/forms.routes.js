const express = require("express");
const {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
} = require("./forms.controllers");

const router = express.Router();

router.get("/", getForms); //Get all formss
router.get("/:id", getForm); //Get form by id
router.post("/", createForm); //add form
router.put("/:id", updateForm); //Edit form
router.delete("/:id", deleteForm); //Delete form

module.exports = router;
