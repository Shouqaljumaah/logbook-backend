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

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getAllFormSubmitions
); //Get all

router.get("/:id", getFormSubmitions); //Get  by id
router.post("/", createFormSubmition); //add
router.put("/:formSubmitionsId/review", reviewFormSubmitions); //uptate
router.delete(
  "/:formSubmitionsId",
  passport.authenticate("jwt", { session: false }),
  deletFormSubmition
); //Delete
router.get("/user/:id", getFormSubmitionsByUserId); //Get form submitions by user id

//router.get("/", getTutorPendingForms);//changes done here to getTutorPendingForms

module.exports = router;
