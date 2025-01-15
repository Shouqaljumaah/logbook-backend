const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../../multer");
const {
  signupUser, loginUser,
  logoutUser, getAllUsers,
  changePassword, updateUserImage,
  createAdmin, deleteUser,
  updateUser, tutorList
} = require("./users.controllers");


router.get("/", getAllUsers);
router.post(
  "/signup", 
  passport.authenticate("jwt", { session: false }), // Add this middleware
  signupUser
); //admin signup, not need image upload
router.post("/login", passport.authenticate("local", { session: false }), loginUser);
router.post("/logout", logoutUser);
router.post("/create-admin", createAdmin);
router.put("/change-password", changePassword);
router.put("/update-image/:userId", upload.single("image"), updateUserImage);
router.put('/:id', passport.authenticate("jwt", { session: false }), updateUser);
router.delete('/:id', passport.authenticate("jwt", { session: false }), deleteUser);
router.get('/tutor-list', tutorList);

module.exports = router;