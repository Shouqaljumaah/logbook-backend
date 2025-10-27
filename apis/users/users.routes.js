const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../../multer");
const {
  signupUser,
  loginUser,
  logoutUser,
  getAllUsers,
  changePassword,
  updateUserImage,
  createAdmin,
  deleteUser,
  updateUser,
  tutorList,
  getUserById,
  getUserByToken,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
} = require("./users.controllers");

// Apply authentication to all routes
router.get("/", passport.authenticate("jwt", { session: false }), getAllUsers);
router.post(
  "/signup",
  passport.authenticate("jwt", { session: false }), // Add this middleware
  signupUser
); //admin signup, not need image upload
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  loginUser
);
router.post("/logout", logoutUser);
router.post("/create-admin", createAdmin);
router.put("/change-password", changePassword);
router.put(
  "/update-image/:userId",
  upload.single("image"),
  passport.authenticate("jwt", { session: false }),
  updateUserImage
);
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  getUserByToken
);
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  updateUser
);
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteUser
);
router.get(
  "/tutor-list",
  passport.authenticate("jwt", { session: false }),
  tutorList
);
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  getUserById
);

// Profile management routes (mobile app)
router.get(
  "/profile/me",
  passport.authenticate("jwt", { session: false }),
  getMyProfile
);

router.put(
  "/profile/me",
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  updateMyProfile
);

router.delete(
  "/profile/me",
  passport.authenticate("jwt", { session: false }),
  deleteMyAccount
);

module.exports = router;
