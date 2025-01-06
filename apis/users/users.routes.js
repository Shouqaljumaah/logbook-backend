const express = require("express");
const router = express.Router();
const passport = require("passport");

const { signupUser, loginUser, logoutUser } = require("./users.controllers");

router.post("/signup", signupUser);
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  loginUser
);
router.post("/logout", logoutUser);

module.exports = router;
