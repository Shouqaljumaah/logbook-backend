const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../../multer");

const {
  getAllUsers,
  createUser,
  updateUserInstitutions,
  deleteUser,
  createSuperAdmin,
  getPlatformStats,
  getUserById,
  updateUser,
} = require("./superadmin.controllers");

const { checkSuperAdmin } = require("./institutions.controllers");

// Apply authentication to all routes
router.use(passport.authenticate("jwt", { session: false }));

// Platform statistics (accessible by super admin)
router.get("/stats", checkSuperAdmin, getPlatformStats);

// Super admin creation (only super admins can create other super admins)
router.post("/create-superadmin", checkSuperAdmin, createSuperAdmin);

// User management routes (super admin only)
router.get("/users", checkSuperAdmin, getAllUsers);
router.get("/users/:userId", checkSuperAdmin, getUserById);
router.post("/users", checkSuperAdmin, upload.single("image"), createUser);
router.put(
  "/users/:userId",
  checkSuperAdmin,
  upload.single("image"),
  updateUser
);
router.patch(
  "/users/:userId/institutions",
  checkSuperAdmin,
  updateUserInstitutions
);
router.delete("/users/:userId", checkSuperAdmin, deleteUser);

module.exports = router;
