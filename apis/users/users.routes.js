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
} = require("./users.controllers");

router.get("/", getAllUsers);
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
router.put("/update-image/:userId", upload.single("image"), updateUserImage);
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
router.get("/tutor-list", tutorList);
router.get("/:id", getUserById);

module.exports = router;
