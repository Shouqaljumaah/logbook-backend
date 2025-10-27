const express = require("express");
const {
  getAllFormSubmitions,
  getFormSubmitions,
  createFormSubmition,
  reviewFormSubmitions,
  deleteFormSubmitions,
  // getTutorPendingForms,// change done here to getTutorPendingForms
  deletFormSubmition,
  getFormSubmitionsByUserId,
} = require("./formSubmitions.controllers");
const passport = require("passport");

const router = express.Router();

// Apply authentication to all routes
router.use(passport.authenticate("jwt", { session: false }));

router.get("/", getAllFormSubmitions); //Get all
router.get("/user/:id", getFormSubmitionsByUserId); //Get form submitions by user id (must come before /:id)
router.get("/:id", getFormSubmitions); //Get  by id
router.post("/", createFormSubmition); //add
router.put("/:formSubmitionsId/review", reviewFormSubmitions); //uptate
router.delete("/:formSubmitionsId", deletFormSubmition); //Delete

//router.get("/", getTutorPendingForms);//changes done here to getTutorPendingForms

module.exports = router;
