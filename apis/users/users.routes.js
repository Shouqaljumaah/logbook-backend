const express = require("express");
const router = express.Router();
const passport = require("passport");

const upload = require("../../multer");
const {
  signupUser,
  loginUser,
  logoutUser,
  getAllUsers,
} = require("./users.controllers");

router.post("/signup", upload.single("image"), signupUser);
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  loginUser
);
router.post("/logout", logoutUser);
module.exports = router;
router.get("/", getAllUsers);
